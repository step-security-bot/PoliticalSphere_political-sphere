/**
 * @ignore
 */

import {
  type Bill,
  type BillStatus,
  type CreateBillInput,
  CreateBillSchema,
} from '@political-sphere/shared';

import { getDatabase } from '../stores/index.js';
import type { DatabaseRecord } from '../services/prisma-database.service.js';

/**
 * BillService contains business logic for proposing, retrieving, listing and
 * updating bills within the simulation. It validates inputs, maps database
 * records to domain types and exposes pagination helpers for listing.
 *
 * Persistence is delegated to the project store layer obtained via
 * `getDatabase()` so the service remains database-agnostic and testable.
 */
export class BillService {
  // Lazy getter to avoid stale DB connections in tests
  private get db() {
    return getDatabase();
  }

  async proposeBill(input: CreateBillInput): Promise<Bill> {
    // Validate input
    CreateBillSchema.parse(input);

    // Verify proposer exists
    const proposer = await this.db.users.getById(input.proposerId);
    if (!proposer) {
      throw new Error('Proposer does not exist');
    }

    // Force initial status to 'proposed' regardless of caller input for consistency
    const billData = await this.db.bills.create({
      title: input.title,
      ...(input.description !== undefined && { description: input.description }),
      proposerId: input.proposerId,
      status: 'proposed',
    });

    // Map database result to Bill type (handle null description and ensure status type)
    const bill: Bill = {
      id: billData.id as string,
      title: billData.title as string,
      description: (billData.description as string | undefined) ?? undefined,
      proposerId: billData.proposerId as string,
      status: billData.status as BillStatus,
      createdAt: new Date(billData.createdAt as string),
      updatedAt: new Date(billData.updatedAt as string),
    } as Bill;
    return bill;
  }

  async getBillById(id: string): Promise<Bill | null> {
    const billData = await this.db.bills.getById(id);
    if (!billData) return null;

    // Map database result to Bill type
    return {
      id: billData.id as string,
      title: billData.title as string,
      description: (billData.description as string | undefined) ?? undefined,
      proposerId: billData.proposerId as string,
      status: billData.status as BillStatus,
      createdAt: new Date(billData.createdAt as string),
      updatedAt: new Date(billData.updatedAt as string),
    };
  }

  async getAllBills(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    bills: Bill[];
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    const allBills = await this.db.bills.getAll();

    // Map database results to Bill type
    const bills = allBills.map((bill: DatabaseRecord) => ({
      id: bill.id as string,
      title: bill.title as string,
      description: (bill.description as string | undefined) ?? undefined,
      proposerId: bill.proposerId as string,
      status: bill.status as BillStatus,
      createdAt: new Date(bill.createdAt as string),
      updatedAt: new Date(bill.updatedAt as string),
    }));

    // Manual pagination since store doesn't support it
    const total = bills.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedBills = bills.slice(start, end);

    const hasNext = end < total;
    const hasPrev = page > 1;

    return { bills: paginatedBills, total, hasNext, hasPrev };
  }

  async getBillsByProposer(proposerId: string): Promise<Bill[]> {
    // BillStore doesn't have getByProposerId, so filter all bills
    const allBills = await this.db.bills.getAll();
    return allBills
      .filter((bill: DatabaseRecord) => bill.proposerId === proposerId)
      .map((bill: DatabaseRecord) => ({
        id: bill.id as string,
        title: bill.title as string,
        description: (bill.description as string | undefined) ?? undefined,
        proposerId: bill.proposerId as string,
        status: bill.status as BillStatus,
        createdAt: new Date(bill.createdAt as string),
        updatedAt: new Date(bill.updatedAt as string),
      }));
  }

  async updateBillStatus(id: string, status: BillStatus): Promise<Bill | null> {
    // BillStore doesn't have updateStatus, so get and update
    const bill = await this.db.bills.getById(id);
    if (!bill) return null;

    // Update using the generic update method
    const updated = await this.db.bills.update(id, { status });
    if (!updated) return null;

    return {
      id: updated.id as string,
      title: updated.title as string,
      description: (updated.description as string | undefined) ?? undefined,
      proposerId: updated.proposerId as string,
      status: updated.status as BillStatus,
      createdAt: new Date(updated.createdAt as string),
      updatedAt: new Date(updated.updatedAt as string),
    };
  }
}
