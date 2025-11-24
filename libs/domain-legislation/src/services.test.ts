import { describe, it, expect, beforeEach } from 'vitest';
import { BillService, JudiciaryService } from './services.js';
import type {
  CreateBillInput,
  FileCaseInput,
  IssueRulingInput,
  CreateReviewInput,
  CreatePrecedentInput,
} from './types.js';

describe('BillService', () => {
  let billService: BillService;

  beforeEach(() => {
    billService = new BillService();
  });

  describe('proposeBill', () => {
    it('should propose a bill with valid input', async () => {
      const input: CreateBillInput = {
        title: 'Budget Reform Act',
        description: 'A bill to reform the national budget',
        proposerId: 'user-123',
      };

      const result = await billService.proposeBill(input);

      expect(result).toBeDefined();
      expect(result.title).toBe(input.title);
      expect(result.description).toBe(input.description);
      expect(result.proposerId).toBe(input.proposerId);
      expect(result.status).toBe('proposed');
      expect(result.debateId).toBeNull();
      expect(result.contentRating).toBe('PG');
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('getBillById', () => {
    it('should return null for non-existent bill', async () => {
      const result = await billService.getBillById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await billService.getBillById('');
      expect(result).toBeNull();
    });
  });

  describe('getBillsByProposer', () => {
    it('should return empty array for non-existent proposer', async () => {
      const result = await billService.getBillsByProposer('non-existent-user');
      expect(result).toEqual([]);
    });

    it('should handle empty string input', async () => {
      const result = await billService.getBillsByProposer('');
      expect(result).toEqual([]);
    });
  });

  describe('updateBillStatus', () => {
    it('should return null for non-existent bill', async () => {
      const result = await billService.updateBillStatus('non-existent-id', 'passed');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await billService.updateBillStatus('', 'passed');
      expect(result).toBeNull();
    });

    it('should handle invalid status', async () => {
      const result = await billService.updateBillStatus('test-id', 'invalid' as any);
      expect(result).toBeNull();
    });
  });

  describe('getAllBills', () => {
    it('should return empty result set', async () => {
      const result = await billService.getAllBills(1, 10);
      expect(result).toEqual({
        bills: [],
        total: 0,
        hasNext: false,
        hasPrev: false,
      });
    });
  });

  describe('getBillsByProposer', () => {
    it('should return empty array for non-existent proposer', async () => {
      const result = await billService.getBillsByProposer('non-existent-user');
      expect(result).toEqual([]);
    });
  });
});

describe('JudiciaryService', () => {
  let judiciaryService: JudiciaryService;

  beforeEach(() => {
    judiciaryService = new JudiciaryService();
  });

  describe('fileCase', () => {
    it('should file a case with valid input', async () => {
      const input: FileCaseInput = {
        title: 'Constitutional Challenge',
        description: 'Challenge to government policy on free speech',
        type: 'constitutional',
        court: 'supreme',
        plaintiff: 'Citizen A',
        defendant: 'Government',
        priority: 'high',
      };

      const result = await judiciaryService.fileCase(input);

      expect(result).toBeDefined();
      expect(result.title).toBe(input.title);
      expect(result.description).toBe(input.description);
      expect(result.type).toBe(input.type);
      expect(result.court).toBe(input.court);
      expect(result.plaintiff).toBe(input.plaintiff);
      expect(result.defendant).toBe(input.defendant);
      expect(result.priority).toBe(input.priority);
      expect(result.status).toBe('filed');
      expect(result.id).toBeDefined();
      expect(result.caseNumber).toBeDefined();
      expect(result.filedAt).toBeInstanceOf(Date);
    });
  });

  describe('getCase', () => {
    it('should return null for non-existent case', async () => {
      const result = await judiciaryService.getCase('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await judiciaryService.getCase('');
      expect(result).toBeNull();
    });
  });

  describe('updateCaseStatus', () => {
    it('should return null for non-existent case', async () => {
      const result = await judiciaryService.updateCaseStatus('non-existent-id', 'hearing');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await judiciaryService.updateCaseStatus('', 'hearing');
      expect(result).toBeNull();
    });

    it('should handle invalid status', async () => {
      const result = await judiciaryService.updateCaseStatus('test-id', 'invalid' as any);
      expect(result).toBeNull();
    });
  });

  describe('decideCase', () => {
    it('should return null for non-existent case', async () => {
      const result = await judiciaryService.decideCase('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await judiciaryService.decideCase('');
      expect(result).toBeNull();
    });
  });

  describe('listCases', () => {
    it('should return empty array', async () => {
      const result = await judiciaryService.listCases({ status: 'filed' });
      expect(result).toEqual([]);
    });
  });

  describe('createJudge', () => {
    it('should create a judge with valid input', async () => {
      const input = {
        userId: 'user-123',
        court: 'supreme' as const,
      };

      const result = await judiciaryService.createJudge(input);

      expect(result).toBeDefined();
      expect(result.userId).toBe(input.userId);
      expect(result.court).toBe(input.court);
      expect(result.status).toBe('active');
      expect(result.id).toBeDefined();
      expect(result.appointedAt).toBeInstanceOf(Date);
    });
  });

  describe('getJudge', () => {
    it('should return null for non-existent judge', async () => {
      const result = await judiciaryService.getJudge('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await judiciaryService.getJudge('');
      expect(result).toBeNull();
    });
  });

  describe('listJudges', () => {
    it('should return empty array', async () => {
      const result = await judiciaryService.listJudges({ court: 'supreme' });
      expect(result).toEqual([]);
    });

    it('should handle empty options', async () => {
      const result = await judiciaryService.listJudges({});
      expect(result).toEqual([]);
    });
  });

  describe('listJudges', () => {
    it('should return empty array', async () => {
      const result = await judiciaryService.listJudges({ court: 'supreme' });
      expect(result).toEqual([]);
    });
  });

  describe('issueRuling', () => {
    it('should issue a ruling with valid input', async () => {
      const input: IssueRulingInput = {
        decision: 'upheld',
        reasoning: 'Based on constitutional principles and precedent',
      };

      const result = await judiciaryService.issueRuling('case-123', 'judge-456', input);

      expect(result).toBeDefined();
      expect(result.caseId).toBe('case-123');
      expect(result.judgeId).toBe('judge-456');
      expect(result.decision).toBe(input.decision);
      expect(result.reasoning).toBe(input.reasoning);
      expect(result.precedent).toBe(false);
      expect(result.id).toBeDefined();
      expect(result.issuedAt).toBeInstanceOf(Date);
    });
  });

  describe('getRuling', () => {
    it('should return null for non-existent ruling', async () => {
      const result = await judiciaryService.getRuling('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await judiciaryService.getRuling('');
      expect(result).toBeNull();
    });
  });

  describe('listRulings', () => {
    it('should return empty array for non-existent case', async () => {
      const result = await judiciaryService.listRulings('non-existent-case');
      expect(result).toEqual([]);
    });

    it('should handle empty string input', async () => {
      const result = await judiciaryService.listRulings('');
      expect(result).toEqual([]);
    });
  });

  describe('listRulings', () => {
    it('should return empty array for non-existent case', async () => {
      const result = await judiciaryService.listRulings('non-existent-case');
      expect(result).toEqual([]);
    });
  });

  describe('createReview', () => {
    it('should create a review with valid input', async () => {
      const input: CreateReviewInput = {
        caseId: 'case-123',
        type: 'appeal',
      };

      const result = await judiciaryService.createReview(input);

      expect(result).toBeDefined();
      expect(result.caseId).toBe(input.caseId);
      expect(result.type).toBe(input.type);
      expect(result.status).toBe('pending');
      expect(result.id).toBeDefined();
      expect(result.filedAt).toBeInstanceOf(Date);
    });
  });

  describe('getReview', () => {
    it('should return null for non-existent review', async () => {
      const result = await judiciaryService.getReview('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await judiciaryService.getReview('');
      expect(result).toBeNull();
    });
  });

  describe('updateReviewStatus', () => {
    it('should return null for non-existent review', async () => {
      const result = await judiciaryService.updateReviewStatus('non-existent-id', 'granted');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await judiciaryService.updateReviewStatus('', 'granted');
      expect(result).toBeNull();
    });

    it('should handle invalid status', async () => {
      const result = await judiciaryService.updateReviewStatus('test-id', 'invalid' as any);
      expect(result).toBeNull();
    });
  });

  describe('grantReview', () => {
    it('should return null for non-existent review', async () => {
      const result = await judiciaryService.grantReview('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await judiciaryService.grantReview('');
      expect(result).toBeNull();
    });
  });

  describe('denyReview', () => {
    it('should return null for non-existent review', async () => {
      const result = await judiciaryService.denyReview('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await judiciaryService.denyReview('');
      expect(result).toBeNull();
    });
  });

  describe('createPrecedent', () => {
    it('should create a precedent with valid input', async () => {
      const input: CreatePrecedentInput = {
        citation: 'Smith v. Government (2024)',
        summary: 'Case about free speech rights',
        holding: 'Government cannot restrict political speech without compelling interest',
        caseId: 'case-123',
      };

      const result = await judiciaryService.createPrecedent(input);

      expect(result).toBeDefined();
      expect(result.citation).toBe(input.citation);
      expect(result.summary).toBe(input.summary);
      expect(result.holding).toBe(input.holding);
      expect(result.caseId).toBe(input.caseId);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('listPrecedents', () => {
    it('should return empty array', async () => {
      const result = await judiciaryService.listPrecedents({ limit: 10 });
      expect(result).toEqual([]);
    });

    it('should handle empty options', async () => {
      const result = await judiciaryService.listPrecedents({});
      expect(result).toEqual([]);
    });

    it('should handle options with caseId', async () => {
      const result = await judiciaryService.listPrecedents({ caseId: 'test-case' });
      expect(result).toEqual([]);
    });
  });

  describe('getActiveCases', () => {
    it('should return empty array', async () => {
      const result = await judiciaryService.getActiveCases();
      expect(result).toEqual([]);
    });
  });

  describe('getCasesUnderReview', () => {
    it('should return empty array', async () => {
      const result = await judiciaryService.getCasesUnderReview();
      expect(result).toEqual([]);
    });
  });
});
