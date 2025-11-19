type VerificationRecord = {
  id?: string;
  userId: string;
  verified: boolean;
  age: number;
  verificationMethod?: string;
  verifiedAt?: string;
  [key: string]: unknown;
};

type AgeVerificationStore = {
  create: (data: VerificationRecord) => Promise<VerificationRecord>;
  getById: (userId: string) => Promise<VerificationRecord | null>;
  update: (id: string, data: Partial<VerificationRecord>) => Promise<VerificationRecord>;
  getAll: () => Promise<VerificationRecord[]>;
};

function calculateAge(dob: string): number {
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date of birth format');
  const now = new Date();
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  const m = now.getUTCMonth() - date.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < date.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export default class AgeVerificationService {
  private store: AgeVerificationStore;

  constructor(store: AgeVerificationStore) {
    this.store = store;
  }

  async verifyAge(data: {
    userId: string;
    dateOfBirth: string;
    verificationMethod: string;
    documentType?: string;
  }): Promise<VerificationRecord> {
    if (!data?.dateOfBirth || !data?.verificationMethod) {
      throw new Error('Missing required fields: dateOfBirth, verificationMethod');
    }

    const age = calculateAge(data.dateOfBirth);

    if (age >= 18) {
      const record: VerificationRecord = {
        ...data,
        userId: data.userId,
        verified: true,
        age,
        verificationMethod: data.verificationMethod,
        verifiedAt: new Date().toISOString(),
      };
      return this.store.create(record);
    }

    return {
      verified: false,
      age,
      userId: data.userId,
      reason: 'User must be at least 18 years old',
    } as unknown as VerificationRecord;
  }

  async getVerificationStatus(userId: string): Promise<VerificationRecord | null> {
    return this.store.getById(userId);
  }

  async updateVerification(
    id: string,
    update: Partial<VerificationRecord>
  ): Promise<VerificationRecord> {
    return this.store.update(id, update);
  }

  async isEligibleForContent(
    userId: string,
    contentType: string
  ): Promise<{ eligible: boolean; age?: number; reason?: string }> {
    const record = await this.store.getById(userId);
    if (!record) {
      return { eligible: false, reason: 'Age verification required' };
    }

    if (contentType === 'adult_content') {
      if (record.verified && record.age >= 18) {
        return { eligible: true, age: record.age };
      }
      return { eligible: false, reason: 'Content requires age 18+' };
    }

    return { eligible: Boolean(record.verified), age: record.age };
  }

  async getVerificationStats(): Promise<{
    totalVerifications: number;
    verifiedCount: number;
    rejectedCount: number;
    averageAge: number;
    methodStats: Record<string, number>;
  }> {
    const all = await this.store.getAll();
    const totalVerifications = all.length;
    const verifiedCount = all.filter(r => r.verified).length;
    const rejectedCount = totalVerifications - verifiedCount;

    const averageAge = totalVerifications
      ? Number((all.reduce((sum, r) => sum + (r.age ?? 0), 0) / totalVerifications).toFixed(2))
      : 0;

    const methodStats: Record<string, number> = {};
    for (const r of all) {
      const m = String(r.verificationMethod ?? 'unknown');
      methodStats[m] = (methodStats[m] ?? 0) + 1;
    }

    return { totalVerifications, verifiedCount, rejectedCount, averageAge, methodStats };
  }
}
