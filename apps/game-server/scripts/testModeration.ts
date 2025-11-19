import fetch, { Response } from 'node-fetch';

const base: string = 'http://localhost:5100';
const headers: Record<string, string> = { 'Content-Type': 'application/json' };

function log(title: string, obj: any): void {
  console.log('\n== ' + title + ' ==');
  console.log(JSON.stringify(obj, null, 2));
}

async function testModeration(): Promise<void> {
  try {
    // Create game
    let res: Response = await fetch(base + '/games', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Moderation Test' }),
    });
    const create: any = await res.json();
    log('create', create);
    const gameId: string = create.game.id;

    // Join as Alice
    res = await fetch(`${base}/games/${gameId}/join`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ displayName: 'Alice', userId: 'test-user-1' }),
    });
    const join: any = await res.json();
    log('join', join);
    const playerId: string = join.player.id;

    // Submit flagged proposal
    const flaggedAction: any = {
      action: {
        type: 'propose',
        payload: {
          title: 'I will kill the mayor',
          description: 'Threatening statement',
          proposerId: playerId,
        },
      },
    };
    res = await fetch(`${base}/games/${gameId}/action`, {
      method: 'POST',
      headers,
      body: JSON.stringify(flaggedAction),
    });
    const flaggedResp: any = await res.json();
    log('flagged proposal response', flaggedResp);

    // Submit safe proposal
    const safeAction: any = {
      action: {
        type: 'propose',
        payload: {
          title: 'Improve parks',
          description: 'Allocate budget to parks',
          proposerId: playerId,
        },
      },
    };
    res = await fetch(`${base}/games/${gameId}/action`, {
      method: 'POST',
      headers,
      body: JSON.stringify(safeAction),
    });
    const safeResp: any = await res.json();
    log('safe proposal response', safeResp);
  } catch (err: any) {
    console.error('Test script error', err);
    process.exit(2);
  }
}

testModeration().catch(console.error);
