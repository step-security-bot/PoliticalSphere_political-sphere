/**
 * Bill API Fixtures
 */

export const billFixtures = {
  bills: [
    {
      id: 'bill-1',
      title: 'Climate Change Mitigation Act',
      description:
        'A comprehensive bill to address climate change through renewable energy incentives.',
      status: 'active',
      category: 'environment',
      sponsorId: 'user-1',
      coSponsors: ['user-2'],
      content: 'Full bill content here...',
      tags: ['climate', 'renewable', 'environment'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'bill-2',
      title: 'Healthcare Reform Bill',
      description: 'Reforming the healthcare system to provide universal coverage.',
      status: 'passed',
      category: 'healthcare',
      sponsorId: 'user-2',
      coSponsors: ['user-3'],
      content: 'Healthcare reform content...',
      tags: ['healthcare', 'reform', 'universal'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
};
