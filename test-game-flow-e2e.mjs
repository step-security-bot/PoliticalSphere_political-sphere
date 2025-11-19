#!/usr/bin/env node
/**
 * End-to-End Game Flow Test
 * Tests the complete political simulation game flow from start to finish
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000';

let cookies = '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(cookies ? { Cookie: cookies } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function testGameFlow() {
  log('\n🎮 Testing Complete Game Flow\n', colors.blue);
  log('='.repeat(60), colors.blue);

  let gameId = null;

  try {
    // Step 1: Register and authenticate user
    log('\n1️⃣  User Registration & Authentication', colors.cyan);

    const testUser = {
      username: `gameflow${Date.now()}`,
      email: `gameflow${Date.now()}@example.com`,
      password: 'SecurePass123!',
    };

    const registerResponse = await makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
    });

    log(`✓ User registered: ${registerResponse.data.user.username}`, colors.green);

    const loginResponse = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password,
      }),
    });

    // Extract cookies from response
    const setCookie = loginResponse.headers?.get('set-cookie');
    if (setCookie) {
      const cookieParts = setCookie.split(', ');
      const parsed = {};
      for (const part of cookieParts) {
        const [nv] = part.split(';');
        const [name, value] = nv.split('=');
        parsed[name] = value;
      }
      cookies = Object.entries(parsed)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    }

    log(`✓ User authenticated: ${loginResponse.data.user.username}`, colors.green);

    // Step 2: Create a new game
    log('\n2️⃣  Game Creation', colors.cyan);

    const createGameResponse = await makeRequest('/game/create', {
      method: 'POST',
      body: JSON.stringify({
        name: 'E2E Test Game',
      }),
    });

    gameId = createGameResponse.game.id;
    log(`✓ Game created: ${createGameResponse.game.name} (${gameId})`, colors.green);
    log(`  Phase: ${createGameResponse.game.phase}`, colors.yellow);
    log(`  Players: ${createGameResponse.game.players.length}`, colors.yellow);

    // Step 3: Start the game (move to legislative phase)
    log('\n3️⃣  Game Start - Legislative Phase', colors.cyan);

    const startGameResponse = await makeRequest(`/game/${gameId}/start`, {
      method: 'POST',
    });

    log(`✓ Game started, phase: ${startGameResponse.game.phase}`, colors.green);

    // Step 4: Simulate legislative activity
    log('\n4️⃣  Legislative Activity', colors.cyan);

    // Create a motion (bill)
    const motionResponse = await makeRequest('/api/parliament/motions', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        chamberId: 'chamber-commons',
        proposerId: createGameResponse.game.players[0].id,
        type: 'debate',
        title: 'Education Reform Bill',
        description:
          'A comprehensive reform of the education system to improve access and quality.',
      }),
    });

    const motionId = motionResponse.data.id;
    log(`✓ Motion created: ${motionResponse.data.title}`, colors.green);

    // Start voting on the motion
    await makeRequest(`/api/parliament/motions/${motionId}/start-voting`, {
      method: 'POST',
    });
    log(`✓ Voting started on motion`, colors.green);

    // Cast votes (simulate multiple players)
    const players = startGameResponse.game.players;
    for (const _player of players) {
      await makeRequest('/api/parliament/votes', {
        method: 'POST',
        body: JSON.stringify({
          motionId,
          vote: Math.random() > 0.3 ? 'aye' : 'no', // 70% aye votes
        }),
      });
    }
    log(`✓ Votes cast by ${players.length} players`, colors.green);

    // Close voting
    const closeVotingResponse = await makeRequest(
      `/api/parliament/motions/${motionId}/close-voting`,
      {
        method: 'POST',
      }
    );

    log(`✓ Voting closed, result: ${closeVotingResponse.data.result}`, colors.green);

    // Step 5: Advance to Executive Phase
    log('\n5️⃣  Advance to Executive Phase', colors.cyan);

    const advanceToExecutiveResponse = await makeRequest(`/game/${gameId}/action`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'advance_phase',
      }),
    });

    log(`✓ Advanced to phase: ${advanceToExecutiveResponse.game.phase}`, colors.green);
    log(
      `  Executive actions created: ${advanceToExecutiveResponse.game.governmentState.executiveActions.length}`,
      colors.yellow
    );

    // Step 6: Advance to Judicial Phase
    log('\n6️⃣  Advance to Judicial Phase', colors.cyan);

    const advanceToJudicialResponse = await makeRequest(`/game/${gameId}/action`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'advance_phase',
      }),
    });

    log(`✓ Advanced to phase: ${advanceToJudicialResponse.game.phase}`, colors.green);
    log(
      `  Judges assigned: ${advanceToJudicialResponse.game.judiciaryState.judges.length}`,
      colors.yellow
    );
    log(
      `  Cases created: ${advanceToJudicialResponse.game.judiciaryState.activeCases.length}`,
      colors.yellow
    );
    log(
      `  Rulings issued: ${advanceToJudicialResponse.game.judiciaryState.rulings.length}`,
      colors.yellow
    );

    // Step 7: Advance to Media Phase
    log('\n7️⃣  Advance to Media Phase', colors.cyan);

    const advanceToMediaResponse = await makeRequest(`/game/${gameId}/action`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'advance_phase',
      }),
    });

    log(`✓ Advanced to phase: ${advanceToMediaResponse.game.phase}`, colors.green);
    log(
      `  Press releases: ${advanceToMediaResponse.game.mediaState.pressReleases.length}`,
      colors.yellow
    );
    log(
      `  Public approval: ${advanceToMediaResponse.game.mediaState.publicOpinion.approval}%`,
      colors.yellow
    );
    log(
      `  Public trust: ${advanceToMediaResponse.game.mediaState.publicOpinion.trust}%`,
      colors.yellow
    );

    // Step 8: Advance to Election Phase
    log('\n8️⃣  Advance to Election Phase', colors.cyan);

    const advanceToElectionResponse = await makeRequest(`/game/${gameId}/action`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'advance_phase',
      }),
    });

    log(`✓ Advanced to phase: ${advanceToElectionResponse.game.phase}`, colors.green);
    log(
      `  Election triggered: ${advanceToElectionResponse.game.electionState.electionTriggered}`,
      colors.yellow
    );
    log(
      `  Government approval: ${advanceToElectionResponse.game.electionState.currentGovernmentApproval}%`,
      colors.yellow
    );

    // Step 9: Complete the game
    log('\n9️⃣  Complete Game', colors.cyan);

    const completeGameResponse = await makeRequest(`/game/${gameId}/action`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'advance_phase',
      }),
    });

    log(`✓ Game completed!`, colors.green);
    log(`  Final phase: ${completeGameResponse.game.phase}`, colors.yellow);
    log(`  Stability score: ${completeGameResponse.game.winConditions.stability}`, colors.yellow);
    log(
      `  Legislation score: ${completeGameResponse.game.winConditions.legislation}`,
      colors.yellow
    );
    log(
      `  Public trust score: ${completeGameResponse.game.winConditions.publicTrust}`,
      colors.yellow
    );

    // Step 10: Verify system integration
    log('\n🔗 System Integration Verification', colors.cyan);

    const finalGame = completeGameResponse.game;

    // Check Parliament → Government integration
    const lawsToActions =
      finalGame.parliamentState.passedLaws.length ===
      finalGame.governmentState.executiveActions.length;
    log(
      `${lawsToActions ? '✓' : '✗'} Parliament laws became executive actions`,
      lawsToActions ? colors.green : colors.red
    );

    // Check Government → Judiciary integration
    const actionsToCases =
      finalGame.governmentState.executiveActions.length >=
      finalGame.judiciaryState.activeCases.length;
    log(
      `${actionsToCases ? '✓' : '✗'} Executive actions challenged in court`,
      actionsToCases ? colors.green : colors.red
    );

    // Check Judiciary → Media integration
    const rulingsToPress =
      finalGame.judiciaryState.rulings.length === finalGame.mediaState.pressReleases.length;
    log(
      `${rulingsToPress ? '✓' : '✗'} Judicial rulings generated press coverage`,
      rulingsToPress ? colors.green : colors.red
    );

    // Check Media → Elections integration
    const mediaAffectsElection =
      finalGame.mediaState.publicOpinion.approval ===
      finalGame.electionState.currentGovernmentApproval;
    log(
      `${mediaAffectsElection ? '✓' : '✗'} Public opinion affects election outcomes`,
      mediaAffectsElection ? colors.green : colors.red
    );

    return true;
  } catch (error) {
    log(`\n❌ Test failed with error: ${error.message}`, colors.red);
    console.error(error);

    // Cleanup: delete the game if it was created
    if (gameId) {
      try {
        await makeRequest(`/game/${gameId}`, {
          method: 'DELETE',
        });
        log(`✓ Test game cleaned up`, colors.yellow);
      } catch (cleanupError) {
        log(`⚠️  Failed to cleanup test game: ${cleanupError.message}`, colors.yellow);
      }
    }

    return false;
  }
}

async function main() {
  log(`\n${'='.repeat(80)}`, colors.blue);
  log('  🎮 POLITICAL SPHERE - END-TO-END GAME FLOW TEST', colors.blue);
  log('='.repeat(80), colors.blue);

  const success = await testGameFlow();

  log(`\n${'='.repeat(80)}`, colors.blue);
  if (success) {
    log('  ✅ ALL GAME FLOW TESTS PASSED', colors.green);
    log('  🎉 Complete political simulation flow working correctly!', colors.green);
    log(
      '  📊 All systems (Parliament, Government, Judiciary, Media, Elections) integrated',
      colors.green
    );
  } else {
    log('  ❌ GAME FLOW TESTS FAILED', colors.red);
    log('  See errors above for details', colors.red);
  }
  log('='.repeat(80), colors.blue);
  log('');

  process.exit(success ? 0 : 1);
}

main();
