// Minimal store index to satisfy module resolution in tests.
// Tests mock this module via vi.mock; at runtime this stub prevents ESM resolution errors.

export type BillsApi = {
  create: (...args: unknown[]) => Promise<unknown>;
  getById: (id: string) => Promise<unknown | null>;
  update: (id: string, data: unknown) => Promise<unknown>;
  delete: (id: string) => Promise<boolean>;
  getAll: () => Promise<unknown[]>;
  getByStatus: (status: string) => Promise<unknown[]>;
};

export type UsersApi = {
  create: (data: unknown) => Promise<unknown>;
  getById: (id: string) => Promise<unknown | null>;
  getByUsername?: (u: string) => Promise<unknown | null>;
  getByEmail?: (e: string) => Promise<unknown | null>;
  update: (id: string, data: unknown) => Promise<unknown>;
  delete: (id: string) => Promise<boolean>;
  getAll: () => Promise<unknown[]>;
};

export type ModerationApi = Record<string, (...args: unknown[]) => Promise<unknown>>;
export type ComplianceApi = Record<string, (...args: unknown[]) => Promise<unknown>>;
export type AgeVerificationApi = Record<string, (...args: unknown[]) => Promise<unknown>>;

export function getDatabase(): {
  bills: BillsApi;
  users: UsersApi;
  moderation: ModerationApi;
  compliance: ComplianceApi;
  ageVerification: AgeVerificationApi;
} {
  throw new Error('getDatabase() is a stub for tests and should be mocked');
}
