import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PartyService } from '../../src/domain/party-service';
import { closeDatabase, getDatabase } from '../../src/stores/index.ts';

describe('PartyService', () => {
  beforeEach(() => {
    getDatabase();
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('createParty', () => {
    it('should create a new party', async () => {
      const service = new PartyService();
      const input = {
        name: 'Test Party',
        description: 'A test party',
        color: '#FF0000',
      };

      const party = await service.createParty(input);

      expect(party.name).toBe(input.name);
      expect(party.description).toBe(input.description);
      expect(party.color).toBe(input.color);
      expect(party.id).toBeTruthy();
      expect(party.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error for duplicate party name', async () => {
      const service = new PartyService();
      const input = {
        name: 'Test Party',
        description: 'A test party',
        color: '#FF0000',
      };

      await service.createParty(input);

      await expect(service.createParty(input)).rejects.toThrow(/Party name already exists/);
    });
  });

  describe('getPartyById', () => {
    it('should return party by id', async () => {
      const service = new PartyService();
      const input = {
        name: 'Test Party',
        description: 'A test party',
        color: '#FF0000',
      };

      const created = await service.createParty(input);
      const retrieved = await service.getPartyById(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent party', async () => {
      const service = new PartyService();
      const party = await service.getPartyById('non-existent-id');
      expect(party).toBeNull();
    });
  });

  describe('getAllParties', () => {
    it('should return all parties', async () => {
      const service = new PartyService();

      const input1 = {
        name: 'Party 1',
        description: 'First party',
        color: '#FF0000',
      };
      const input2 = {
        name: 'Party 2',
        description: 'Second party',
        color: '#00FF00',
      };

      const party1 = await service.createParty(input1);
      const party2 = await service.createParty(input2);

      const parties = await service.getAllParties();

      expect(parties.length).toBeGreaterThanOrEqual(2);
      expect(parties.some(p => p.id === party1.id)).toBe(true);
      expect(parties.some(p => p.id === party2.id)).toBe(true);
    });
  });
});
