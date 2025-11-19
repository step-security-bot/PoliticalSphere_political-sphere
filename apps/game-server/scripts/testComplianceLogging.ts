import fetch, { Response } from 'node-fetch';

const BASE_URL: string = 'http://localhost:5100';

async function testComplianceLogging(): Promise<void> {
  console.log('== Testing Compliance Logging ==\n');

  // Create a game
  console.log('Creating game...');
  const createRes: Response = await fetch(`${BASE_URL}/games`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Compliance Logging Test' }),
  });
  const createData: any = await createRes.json();
  const gameId: string = createData.game.id;
  console.log('Game created:', gameId);

  // Join game
  console.log('\nJoining game...');
  const joinRes: Response = await fetch(`${BASE_URL}/games/${gameId}/join`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ displayName: 'Test Player' }),
  });
  const joinData: any = await joinRes.json();
  const playerId: string = joinData.player.id;
  console.log('Player joined:', playerId);

  // Submit safe proposal
  console.log('\nSubmitting safe proposal...');
  const proposeRes: Response = await fetch(`${BASE_URL}/games/${gameId}/action`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      action: {
        type: 'propose',
        payload: {
          title: 'Improve education funding',
          description: 'Increase budget for schools',
          proposerId: playerId,
        },
      },
    }),
  });
  const proposeData: any = await proposeRes.json();
  const proposalId: string = proposeData.proposal.id;
  console.log('Proposal created:', proposalId);

  // Cast vote
  console.log('\nCasting vote...');
  const voteRes: Response = await fetch(`${BASE_URL}/games/${gameId}/action`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      action: {
        type: 'vote',
        payload: {
          proposalId: proposalId,
          playerId: playerId,
          choice: 'for',
        },
      },
    }),
  });
  const voteData: any = await voteRes.json();
  console.log('Vote cast:', voteData.vote);

  console.log('\n== Compliance Logging Test Complete ==');
  console.log('Check compliance API logs for audit trail events');
}

testComplianceLogging().catch(console.error);
