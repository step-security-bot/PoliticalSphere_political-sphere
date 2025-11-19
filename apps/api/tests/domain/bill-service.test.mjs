import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BillService } from '../../src/domain/bill-service';
import { UserService } from '../../src/domain/user-service';
import { closeDatabase, getDatabase } from '../../src/stores/index.ts';

describe('BillService', () => {
  let userService;
  let billService;

  beforeEach(() => {
    getDatabase();
    userService = new UserService();
    billService = new BillService();
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('proposeBill', () => {
    it('should create a new bill', async () => {
      const user = await userService.createUser({
        username: 'testuser',
        email: 'test@example.com',
      });

      const input = {
        title: 'Test Bill',
        description: 'A test bill description',
        proposerId: user.id,
      };

      const bill = await billService.proposeBill(input);

      expect(bill.title).toBe(input.title);
      expect(bill.description).toBe(input.description);
      expect(bill.proposerId).toBe(input.proposerId);
      expect(bill.status).toBe('proposed');
      expect(bill.id).toBeTruthy();
      expect(bill.createdAt).toBeInstanceOf(Date);
      expect(bill.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent proposer', async () => {
      const input = {
        title: 'Test Bill',
        description: 'A test bill description',
        proposerId: 'non-existent-id',
      };

      await expect(billService.proposeBill(input)).rejects.toThrow(/Proposer does not exist/);
    });
  });

  describe('getBillById', () => {
    it('should return bill by id', async () => {
      const user = await userService.createUser({
        username: 'testuser',
        email: 'test@example.com',
      });

      const input = {
        title: 'Test Bill',
        description: 'A test bill description',
        proposerId: user.id,
      };

      const created = await billService.proposeBill(input);
      const retrieved = await billService.getBillById(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent bill', async () => {
      const bill = await billService.getBillById('non-existent-id');
      expect(bill).toBeNull();
    });
  });
});
