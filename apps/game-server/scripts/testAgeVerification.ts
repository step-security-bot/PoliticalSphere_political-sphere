import fetch, { Response } from 'node-fetch';

const BASE_URL: string = 'http://localhost:5100';

async function testAgeVerification(): Promise<void> {
  console.log('== Testing Age Verification Integration ==\n');

  // Create a game
  console.log('Creating game...');
  const createRes: Response = await fetch(`${BASE_URL}/games`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Age Verification Test' }),
  });
  const createData: any = await createRes.json();
  const gameId: string = createData.game.id;
  console.log('Game created:', gameId);

  // Test joining without userId (should succeed)
  console.log('\nJoining without userId (should succeed)...');
  const joinRes1: Response = await fetch(`${BASE_URL}/games/${gameId}/join`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ displayName: 'Anonymous Player' }),
  });
  const joinData1: any = await joinRes1.json();
  console.log('Join result:', joinData1);

  // Test joining with unverified userId (should fail)
  console.log('\nJoining with unverified userId (should fail)...');
  const joinRes2: Response = await fetch(`${BASE_URL}/games/${gameId}/join`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ displayName: 'Unverified User', userId: 'unverified-user-123' }),
  });
  const joinData2: any = await joinRes2.json();
  console.log('Join result:', joinData2);

  // Test joining with verified adult userId (would succeed if API available)
  console.log('\nJoining with verified adult userId (would succeed if API available)...');
  const joinRes3: Response = await fetch(`${BASE_URL}/games/${gameId}/join`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ displayName: 'Verified Adult', userId: 'verified-adult-123' }),
  });
  const joinData3: any = await joinRes3.json();
  console.log('Join result:', joinData3);

  console.log('\n== Age Verification Test Complete ==');
}

testAgeVerification().catch(console.error);
