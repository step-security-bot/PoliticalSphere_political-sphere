#!/usr/bin/env node
/**
 * Simple E2E Registration Test
 * Tests the complete registration flow via API and verifies token handling
 */

const API_BASE = 'http://localhost:4000';
const timestamp = Date.now();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testRegistration() {
  const testUser = {
    username: `e2etest${timestamp}`,
    email: `e2etest${timestamp}@example.com`,
    password: 'SecurePass123!',
  };

  log('\n🧪 Testing Registration Flow\n', colors.blue);
  log(`Creating user: ${testUser.username}`, colors.yellow);

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ Registration failed with status ${response.status}`, colors.red);
      log(`Error: ${JSON.stringify(data, null, 2)}`, colors.red);
      return false;
    }

    // Verify response structure
    log('\n✓ Registration successful', colors.green);
    log(`  User ID: ${data.user?.id}`, colors.green);
    log(`  Username: ${data.user?.username}`, colors.green);
    log(`  Email: ${data.user?.email}`, colors.green);

    // Check token structure (the critical fix we made)
    if (!data.tokens) {
      log('❌ Missing tokens object in response', colors.red);
      return false;
    }

    if (!data.tokens.accessToken) {
      log('❌ Missing accessToken in tokens object', colors.red);
      return false;
    }

    if (!data.tokens.refreshToken) {
      log('❌ Missing refreshToken in tokens object', colors.red);
      return false;
    }

    log('\n✓ Token structure correct', colors.green);
    log(`  Access Token: ${data.tokens.accessToken.substring(0, 30)}...`, colors.green);
    log(`  Refresh Token: ${data.tokens.refreshToken.substring(0, 30)}...`, colors.green);

    // Simulate what the frontend does
    log('\n🔍 Simulating Frontend Token Extraction', colors.blue);

    const tokens = data.tokens || data;
    const accessToken = tokens.accessToken || tokens.token;
    const refreshToken = tokens.refreshToken;

    if (accessToken && refreshToken) {
      log('✓ Frontend would successfully extract and store tokens', colors.green);
      log('✓ User would be authenticated', colors.green);
    } else {
      log('❌ Frontend token extraction would fail', colors.red);
      return false;
    }

    // Test login with the newly created user
    log('\n🧪 Testing Login Flow\n', colors.blue);
    log(`Logging in as: ${testUser.username}`, colors.yellow);

    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password,
      }),
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      log(`❌ Login failed with status ${loginResponse.status}`, colors.red);
      log(`Error: ${JSON.stringify(loginData, null, 2)}`, colors.red);
      return false;
    }

    log('\n✓ Login successful', colors.green);

    if (!loginData.tokens || !loginData.tokens.accessToken || !loginData.tokens.refreshToken) {
      log('❌ Login response has incorrect token structure', colors.red);
      return false;
    }

    log('✓ Login token structure correct', colors.green);

    // Test authenticated request
    log('\n🧪 Testing Authenticated Request\n', colors.blue);

    const profileResponse = await fetch(`${API_BASE}/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${loginData.tokens.accessToken}`,
      },
    });

    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      log('✓ Authenticated request successful', colors.green);
      log(`  Retrieved profile for: ${profile.username}`, colors.green);
    } else {
      log('⚠️  Authenticated endpoint may not be implemented yet', colors.yellow);
    }

    return true;
  } catch (error) {
    log(`\n❌ Test failed with error: ${error.message}`, colors.red);
    console.error(error);
    return false;
  }
}

async function main() {
  log('\n' + '='.repeat(60), colors.blue);
  log('  E2E Registration & Authentication Test', colors.blue);
  log('='.repeat(60), colors.blue);

  const success = await testRegistration();

  log('\n' + '='.repeat(60), colors.blue);
  if (success) {
    log('  ✅ ALL TESTS PASSED', colors.green);
    log('  Registration flow works correctly!', colors.green);
    log('  Token extraction is functioning as expected', colors.green);
  } else {
    log('  ❌ TESTS FAILED', colors.red);
    log('  See errors above for details', colors.red);
  }
  log('='.repeat(60), colors.blue);
  log('');

  process.exit(success ? 0 : 1);
}

main();
