/**
 * Vote API Fixtures
 */

export const voteFixtures = {
  votes: [
    {
      id: 'vote-1',
      billId: 'bill-1',
      userId: 'user-1',
      vote: 'yes',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'vote-2',
      billId: 'bill-1',
      userId: 'user-2',
      vote: 'no',
      createdAt: '2024-01-01T00:00:00Z',
    },
  ],

  voteSummary: {
    billId: 'bill-1',
    yes: 45,
    no: 30,
    abstain: 5,
    total: 80,
  },
};
