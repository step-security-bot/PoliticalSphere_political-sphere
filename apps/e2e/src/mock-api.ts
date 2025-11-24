import type { Page, Route } from '@playwright/test';

type Proposal = {
  id: string;
  title: string;
  description: string;
  status: 'proposed' | 'active' | 'rejected';
  votes: { aye: number; nay: number; abstain: number };
};

const jsonHeaders = { 'content-type': 'application/json' };

const buildSimulationState = () => ({
  id: 'sim-1',
  currentTurn: 1,
  status: 'active',
  players: [
    { id: 'player-1', name: 'Alice', role: 'Prime Minister', influence: 80 },
    { id: 'player-2', name: 'Bob', role: 'Opposition', influence: 70 },
  ],
  policies: [
    {
      id: 'policy-1',
      title: 'Education Reform',
      description: 'Modernize curriculum',
      status: 'active',
    },
    {
      id: 'policy-2',
      title: 'Green Energy',
      description: 'Invest in renewables',
      status: 'proposed',
    },
  ],
  economy: { gdp: 2.4, unemployment: 4.1, inflation: 2.0 },
  society: { happiness: 72, education: 78, health: 81 },
  environment: { pollution: 32, renewableEnergy: 45, biodiversity: 67 },
  lastUpdated: new Date().toISOString(),
});

const defaultProposals = (): Proposal[] => [
  {
    id: 'prop-1',
    title: 'Electoral Reform Act',
    description: 'Introduce ranked choice voting nationwide.',
    status: 'proposed',
    votes: { aye: 2, nay: 1, abstain: 0 },
  },
  {
    id: 'prop-2',
    title: 'Green Investment Plan',
    description: 'Expand renewable energy subsidies.',
    status: 'proposed',
    votes: { aye: 3, nay: 0, abstain: 0 },
  },
];

// Shared proposals array across all mock API instances for multi-user tests
export let sharedProposals: Proposal[] = defaultProposals();

const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, headers: jsonHeaders, body: JSON.stringify(body) });

const handleAuth = (route: Route) => {
  const url = new URL(route.request().url());
  const path = url.pathname;

  if (path.includes('/auth/login')) {
    return fulfillJson(route, {
      success: true,
      data: { token: 'fake-token' },
      tokens: { accessToken: 'fake-access', refreshToken: 'fake-refresh' },
      user: { id: 'user-1', username: 'Test User', email: 'test@example.com' },
    });
  }

  if (path.includes('/auth/register')) {
    return fulfillJson(route, {
      success: true,
      data: { token: 'fake-token' },
      user: { id: 'user-2', username: 'New User', email: 'new@example.com' },
    });
  }

  if (path.includes('/auth/logout') || path.includes('/auth/refresh')) {
    return fulfillJson(route, { success: true });
  }

  return null;
};

export async function setupMockApi(page: Page): Promise<void> {
  console.log('Setting up mock API...');
  const handleProposalVote = (proposalId: string, vote: 'aye' | 'nay' | 'abstain') => {
    console.log('Handling vote:', proposalId, vote);
    const proposal = sharedProposals.find(p => p.id === proposalId);
    if (proposal) {
      proposal.votes[vote] += 1;
      console.log('Updated proposal votes:', proposal.votes);
    }
    return proposal;
  };

  const apiHandler = async (route: Route) => {
    const { method } = route.request();
    const url = new URL(route.request().url());
    const path = url.pathname;

    console.log('Mock API intercepted:', method, path);

    // Only intercept API and auth requests
    if (!path.includes('/auth/') && !path.includes('/api/')) {
      return route.continue();
    }
    console.log('Intercepting API request:', method, path);

    const authResult = handleAuth(route);
    if (authResult) return;

    // Simulation data (keeps UI responsive without real backend)
    if (path.includes('/simulation/state')) {
      return fulfillJson(route, { success: true, data: buildSimulationState() });
    }

    // Proposals
    if (path.match(/proposals$/)) {
      console.log('Handling proposals request:', method);
      if (method === 'GET') {
        console.log('Returning proposals:', sharedProposals.length);
        return fulfillJson(route, { success: true, data: sharedProposals });
      }

      if (method === 'POST') {
        const body = (await route.request().postDataJSON()) as Partial<Proposal>;
        console.log('Creating proposal:', body);
        const newProposal: Proposal = {
          id: `prop-${Date.now()}`,
          title: body.title || 'Untitled Proposal',
          description: body.description || '',
          status: 'proposed',
          votes: { aye: 0, nay: 0, abstain: 0 },
        };
        sharedProposals.push(newProposal);
        // Also update localStorage for harness compatibility
        try {
          const stored = localStorage.getItem('__psE2EProposals');
          const current = stored ? JSON.parse(stored) : [];
          current.push(newProposal);
          localStorage.setItem('__psE2EProposals', JSON.stringify(current));
        } catch (e) {
          // ignore localStorage errors
        }
        console.log('Created proposal:', newProposal.id);
        return fulfillJson(route, { success: true, data: newProposal }, 201);
      }
    }

    // Votes
    if (path.includes('/votes') || path.includes('/voting')) {
      console.log('Handling votes request');
      const body = (await route
        .request()
        .postDataJSON()
        .catch(() => ({}))) as {
        proposalId?: string;
        vote?: 'aye' | 'nay' | 'abstain';
      };

      const targetId =
        body.proposalId || url.searchParams.get('proposalId') || sharedProposals[0]?.id;
      const voteChoice = body.vote || 'aye';
      console.log('Voting on proposal:', targetId, voteChoice);
      const updated = handleProposalVote(
        targetId || sharedProposals[0]?.id || 'prop-1',
        voteChoice
      );

      // Also update localStorage for harness compatibility
      if (updated) {
        try {
          const stored = localStorage.getItem('__psE2EProposals');
          const current = stored ? JSON.parse(stored) : [];
          const target = current.find((p: any) => p.id === updated.id);
          if (target) {
            target.votes = updated.votes;
            localStorage.setItem('__psE2EProposals', JSON.stringify(current));
          }
        } catch (e) {
          // ignore localStorage errors
        }
      }

      return fulfillJson(route, {
        success: true,
        data: {
          proposalId: updated?.id ?? targetId,
          votes: updated?.votes ?? { aye: 1, nay: 0, abstain: 0 },
        },
      });
    }

    // News / metrics stubs for dashboard components
    if (path.includes('/news')) {
      return fulfillJson(route, {
        success: true,
        data: [
          { id: 'news-1', title: 'Policy update', updatedAt: new Date().toISOString() },
          { id: 'news-2', title: 'Economic outlook', updatedAt: new Date().toISOString() },
        ],
      });
    }

    if (path.includes('/metrics')) {
      return fulfillJson(route, {
        success: true,
        data: {
          total: 2,
          categories: { policy: 1, economy: 1 },
          tags: { reform: 1, growth: 1 },
          latest: { title: 'Policy update', updatedAt: new Date().toISOString() },
        },
      });
    }

    // Generic success fallback for unhandled API paths
    return fulfillJson(route, { success: true });
  };

  await page.route('**', apiHandler);
}
