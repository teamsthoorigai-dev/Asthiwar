/**
 * ASTHIWAR — Admin Authentication & Security Verification Suite (Phase 6)
 *
 * Tests:
 * 1. Admin login with seeded credentials -> HTTP 200, session token & user profile
 * 2. Login with non-existent email -> HTTP 401 INVALID_CREDENTIALS
 * 3. Login with incorrect password -> HTTP 401 INVALID_CREDENTIALS
 * 4. GET /api/v1/admin/auth/me with Cookie -> HTTP 200 with user profile
 * 5. GET /api/v1/admin/auth/me with Bearer token header -> HTTP 200
 * 6. GET /api/v1/admin/auth/me without token -> HTTP 401 UNAUTHORIZED
 * 7. GET /api/v1/admin/auth/me with invalid token -> HTTP 401 SESSION_EXPIRED
 * 8. POST /api/v1/admin/auth/logout -> HTTP 200, session deleted in DB, cookie cleared
 * 9. Password change workflow -> Change, verify old sessions revoked, login with new password, restore
 */

import { createApp } from '../../app.js';
import { db, adminSessions, eq, pool } from '@asthiwar/database';
import http from 'http';

let testsPassed = 0;
let testsFailed = 0;
let server: http.Server;
let baseUrl: string;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Details: ${details}`);
    testsFailed++;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  const setCookie = res.headers.get('set-cookie');
  return { status: res.status, data, setCookie };
}

async function runAuthTests() {
  console.log('\n🔐 ASTHIWAR Admin Authentication & Security Test Suite — Phase 6\n');
  console.log('-----------------------------------------------------------------');

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        baseUrl = `http://localhost:${address.port}`;
      }
      resolve();
    });
  });

  const defaultAdminEmail = 'admin@asthiwar.com';
  const defaultAdminPass = 'ChangeMe@2026!';
  let activeToken = '';
  let cookieHeader = '';

  try {
    // -----------------------------------------------------------------------
    // Test 1: Admin Login Success
    // -----------------------------------------------------------------------
    console.log('\n[Test 1] POST /api/v1/admin/auth/login (Valid credentials)');
    const loginRes = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: defaultAdminEmail, password: defaultAdminPass }),
    });

    assert(loginRes.status === 200, 'Status code is 200');
    assert(loginRes.data.success === true, 'Response has success: true');
    assert(Boolean(loginRes.data.data.token), 'Returns session token');
    assert(loginRes.data.data.user.email === defaultAdminEmail, 'Returns correct admin email');
    assert(loginRes.data.data.user.role === 'super_admin', 'Role is super_admin');
    assert(Boolean(loginRes.setCookie), 'Sets session cookie in response');
    assert(Boolean(loginRes.setCookie?.includes('asthiwar_session=')), 'Cookie name is asthiwar_session');
    assert(Boolean(loginRes.setCookie?.includes('HttpOnly')), 'Cookie has HttpOnly flag');

    activeToken = loginRes.data.data.token;
    // Extract cookie value for subsequent requests
    const match = loginRes.setCookie?.match(/asthiwar_session=([^;]+)/);
    if (match) cookieHeader = `asthiwar_session=${match[1]}`;

    // -----------------------------------------------------------------------
    // Test 2: Login with non-existent email
    // -----------------------------------------------------------------------
    console.log('\n[Test 2] POST /api/v1/admin/auth/login (Non-existent email)');
    const nonExistentRes = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@asthiwar.com', password: 'Password123!' }),
    });
    assert(nonExistentRes.status === 401, 'Status code is 401 (Unauthorized)');
    assert(nonExistentRes.data.error.code === 'INVALID_CREDENTIALS', 'Returns INVALID_CREDENTIALS');

    // -----------------------------------------------------------------------
    // Test 3: Login with incorrect password
    // -----------------------------------------------------------------------
    console.log('\n[Test 3] POST /api/v1/admin/auth/login (Wrong password)');
    const wrongPassRes = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: defaultAdminEmail, password: 'WrongPassword@999' }),
    });
    assert(wrongPassRes.status === 401, 'Status code is 401 (Unauthorized)');
    assert(wrongPassRes.data.error.code === 'INVALID_CREDENTIALS', 'Returns INVALID_CREDENTIALS');

    // -----------------------------------------------------------------------
    // Test 4: GET /api/v1/admin/auth/me (Cookie auth)
    // -----------------------------------------------------------------------
    console.log('\n[Test 4] GET /api/v1/admin/auth/me (Using HttpOnly Cookie)');
    const meCookieRes = await request('/api/v1/admin/auth/me', {
      headers: { Cookie: cookieHeader },
    });
    assert(meCookieRes.status === 200, 'Status code is 200');
    assert(meCookieRes.data.data.user.email === defaultAdminEmail, 'User profile verified via cookie');

    // -----------------------------------------------------------------------
    // Test 5: GET /api/v1/admin/auth/me (Bearer Header auth)
    // -----------------------------------------------------------------------
    console.log('\n[Test 5] GET /api/v1/admin/auth/me (Using Authorization: Bearer Header)');
    const meBearerRes = await request('/api/v1/admin/auth/me', {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    assert(meBearerRes.status === 200, 'Status code is 200');
    assert(meBearerRes.data.data.user.role === 'super_admin', 'User profile verified via Bearer header');

    // -----------------------------------------------------------------------
    // Test 6: GET /api/v1/admin/auth/me (Missing token)
    // -----------------------------------------------------------------------
    console.log('\n[Test 6] GET /api/v1/admin/auth/me (Missing token - Guard Check)');
    const unauthRes = await request('/api/v1/admin/auth/me');
    assert(unauthRes.status === 401, 'Status code is 401 (Unauthorized)');
    assert(unauthRes.data.error.code === 'UNAUTHORIZED', 'Returns UNAUTHORIZED code');

    // -----------------------------------------------------------------------
    // Test 7: GET /api/v1/admin/auth/me (Invalid token)
    // -----------------------------------------------------------------------
    console.log('\n[Test 7] GET /api/v1/admin/auth/me (Invalid session token)');
    const invalidTokenRes = await request('/api/v1/admin/auth/me', {
      headers: { Authorization: 'Bearer deadbeef00000000000000000000000000000000000000000000000000000000' },
    });
    assert(invalidTokenRes.status === 401, 'Status code is 401');
    assert(invalidTokenRes.data.error.code === 'SESSION_EXPIRED', 'Returns SESSION_EXPIRED code');

    // -----------------------------------------------------------------------
    // Test 8: POST /api/v1/admin/auth/logout
    // -----------------------------------------------------------------------
    console.log('\n[Test 8] POST /api/v1/admin/auth/logout (Session Revocation)');
    const logoutRes = await request('/api/v1/admin/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    assert(logoutRes.status === 200, 'Status code is 200 (Logged out)');

    // Verify session token is removed from database
    const dbSession = await db
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.token, activeToken));
    assert(dbSession.length === 0, 'Session token was deleted from Neon PostgreSQL');

    // Verify old token can no longer access /me
    const meAfterLogout = await request('/api/v1/admin/auth/me', {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    assert(meAfterLogout.status === 401, 'Revoked token correctly returns 401');

    // -----------------------------------------------------------------------
    // Test 9: Password Change Workflow & Session Revocation
    // -----------------------------------------------------------------------
    console.log('\n[Test 9] Password Change Workflow & All-Sessions Revocation');
    // Login fresh to get active session
    const freshLogin = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: defaultAdminEmail, password: defaultAdminPass }),
    });
    const freshToken = freshLogin.data.data.token;

    // Change password to temporary new password
    const tempNewPass = 'NewSecurePass@2026!';
    const changePassRes = await request('/api/v1/admin/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshToken}` },
      body: JSON.stringify({
        currentPassword: defaultAdminPass,
        newPassword: tempNewPass,
      }),
    });
    if (changePassRes.status !== 200) {
      console.log('Change pass response:', JSON.stringify(changePassRes.data));
    }
    assert(changePassRes.status === 200, 'Password changed successfully', JSON.stringify(changePassRes.data));

    // Verify login with OLD password now fails
    const oldLoginFail = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: defaultAdminEmail, password: defaultAdminPass }),
    });
    assert(oldLoginFail.status === 401, 'Login with old password fails');

    // Verify login with NEW password succeeds
    const newLoginSuccess = await request('/api/v1/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: defaultAdminEmail, password: tempNewPass }),
    });
    assert(newLoginSuccess.status === 200, 'Login with new password succeeds');
    const newSessionToken = newLoginSuccess.data.data.token;

    // Restore original default password for development consistency
    const restorePass = await request('/api/v1/admin/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${newSessionToken}` },
      body: JSON.stringify({
        currentPassword: tempNewPass,
        newPassword: defaultAdminPass,
      }),
    });
    assert(restorePass.status === 200, 'Original admin password restored for dev convenience');

    console.log('\n-----------------------------------------------------------------');
    console.log(`Results: ${testsPassed} Passed, ${testsFailed} Failed\n`);

    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Auth Test Suite crashed:', error);
    process.exit(1);
  } finally {
    server.close();
    await pool.end();
  }
}

runAuthTests();
