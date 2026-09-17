import assert from 'node:assert';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { createApp } from '../app.js';
import {
  pool,
  db,
  enquiries,
  adminSessions,
  adminUsers,
  auditLogs,
  estimates,
  count,
  desc,
  eq,
  PUBLISHED_DEFAULT_ADMIN_PASSWORD,
} from '@asthiwar/database';
import { env } from '../config/env.js';
import { SESSION_COOKIE_NAME } from '../middleware/auth.js';
import { clientIp, clientIpKey } from '../middleware/client-ip.js';
import { errorHandler, flushAnonymousAuditWindow } from '../middleware/errorHandler.js';
import { TRUSTED_DEVICE_COOKIE } from './auth/trusted-device.js';
import { escapeHtml } from './email/email-templates.js';
import { boundedForAudit, sanitizePayload } from '../services/audit.service.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';

interface RequestOptions {
  method?: string;
  path: string;
  body?: any;
  headers?: Record<string, string>;
}

function makeRequest(server: http.Server, options: RequestOptions): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr || typeof addr === 'string') {
      return reject(new Error('Server address not available'));
    }

    const payload = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: addr.port,
        path: options.path,
        method: options.method || 'GET',
        headers: {
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload).toString() } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode || 500, body: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runSecurityTests() {
  console.log('\n🔒 ASTHIWAR Security Hardening & Penetration Defense Test Suite');
  console.log('-----------------------------------------------------------------');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  try {
    // -----------------------------------------------------------------
    // [Test 1] HTML Injection & Email XSS Escaping
    // -----------------------------------------------------------------
    console.log('\n[Test 1] HTML Injection / Email XSS Defense');
    const maliciousPayload = '<script>alert("xss")</script><img src="x" onerror="steal()">&"\'';
    const escaped = escapeHtml(maliciousPayload);

    assert(!escaped.includes('<script>'), 'Script tag open bracket is escaped');
    assert(!escaped.includes('</script>'), 'Script tag close bracket is escaped');
    assert(escaped.includes('&lt;script&gt;'), 'HTML tags are converted to &lt; and &gt;');
    assert(escaped.includes('&quot;'), 'Quotes are escaped');
    assert(escaped.includes('&#39;'), 'Single quotes are escaped');
    assert(escaped.includes('&amp;'), 'Ampersand is escaped');
    console.log('  ✅ PASS: escapeHtml cleanly converts all HTML injection vectors');

    // -----------------------------------------------------------------
    // [Test 2] PII Redaction in Audit & Log Pipelines
    // -----------------------------------------------------------------
    console.log('\n[Test 2] PII Redaction in Audit & Logging Pipelines');
    const rawPayload = {
      customerName: 'Real Customer',
      customerPhone: '9876543210',
      customerEmail: 'customer@example.com',
      plotLocation: 'Coimbatore',
      password: 'SuperSecretPassword',
      token: 'bearer-token-12345',
      safeField: 'standard-package',
    };
    const sanitized = sanitizePayload(rawPayload);

    assert(sanitized.password === '[REDACTED]', 'Password redacted');
    assert(sanitized.token === '[REDACTED]', 'Token redacted');
    assert(sanitized.customerPhone === '[REDACTED]', 'Customer phone redacted');
    assert(sanitized.customerEmail === '[REDACTED]', 'Customer email redacted');
    assert(sanitized.customerName === '[REDACTED]', 'Customer name redacted');
    assert(sanitized.plotLocation === '[REDACTED]', 'Plot location redacted');
    assert(sanitized.safeField === 'standard-package', 'Safe business fields preserved');
    console.log('  ✅ PASS: sanitizePayload scrubs customer PII and secrets');

    // -----------------------------------------------------------------
    // [Test 3] Session Token SHA-256 Hashing in Database
    // -----------------------------------------------------------------
    console.log('\n[Test 3] Session Token SHA-256 Hashing at Rest');
    const loginRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/admin/auth/login',
      body: {
        email: 'admin@asthiwar.com',
        password: 'ChangeMe@2026!',
      },
    });
    assert(loginRes.status === 200, 'Admin login returns 200 OK');
    const setCookie = loginRes.headers['set-cookie'] ?? [];
    const sessionCookie = setCookie.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
    assert(Boolean(sessionCookie), 'Session cookie returned');
    assert(/SameSite=Lax/i.test(sessionCookie!), 'Session cookie is SameSite=Lax');

    const cookieStr = sessionCookie!.split(';')[0];
    const rawToken = cookieStr.slice(`${SESSION_COOKIE_NAME}=`.length);
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const plaintextDbRow = await db.query.adminSessions.findFirst({
      where: eq(adminSessions.token, rawToken),
    });
    assert(plaintextDbRow === undefined, 'Raw session token is NOT stored in plaintext in the database');
    const hashedDbRow = await db.query.adminSessions.findFirst({
      where: eq(adminSessions.token, tokenHash),
    });
    assert(Boolean(hashedDbRow), 'Session is stored under the SHA-256 of the token');

    const protectedRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/auth/me',
      headers: { Cookie: cookieStr },
    });
    assert(protectedRes.status === 200, 'Authenticated request succeeds with session token');
    assert(protectedRes.body.data.user.email === 'admin@asthiwar.com', 'Admin user profile retrieved');

    // What is stored must not itself work as a credential.
    const storedHashReplay = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/admin/auth/me',
      headers: { Authorization: `Bearer ${tokenHash}` },
    });
    assert(storedHashReplay.status === 401, `Stored hash is rejected as a bearer token (got ${storedHashReplay.status})`);
    console.log('  ✅ PASS: Session token is stored as SHA-256 hash at rest, and the hash is not a credential');

    // -----------------------------------------------------------------
    // [Test 4] IDOR & Lead Hijacking Defense on POST /api/v1/enquiries
    // -----------------------------------------------------------------
    console.log('\n[Test 4] IDOR & Lead Hijacking Defense on POST /api/v1/enquiries');

    const victimPhone = '9876543210';
    const victimEmail = 'genuine.client@example.com';
    const victimName = 'Genuine Customer';

    const estRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/calculator/estimate',
      body: {
        customerName: victimName,
        customerPhone: victimPhone,
        customerEmail: victimEmail,
        plotLocation: 'Chennai',
        plotArea: 2400,
        plotAreaUnit: 'sqft',
        builtupAreaPerFloor: 1200,
        floorCount: 1,
        carParkingAreaSqft: 200,
        carCount: 1,
        packageSlug: 'standard',
        customizations: [],
        addons: [],
      },
    });
    assert(estRes.status === 201, 'Victim estimate created with 201 Created');
    const estimateNumber = estRes.body.data.estimateNumber;
    const accessToken = estRes.body.data.accessToken;

    const initialEnquiry = await db.query.enquiries.findFirst({
      where: eq(enquiries.estimateNumber, estimateNumber),
    });
    assert(Boolean(initialEnquiry), 'Initial enquiry created with estimate');
    assert(initialEnquiry!.fullName === victimName, 'Initial enquiry customer name matches victim');

    // 1. No token: must not touch the victim's lead, nor link to their estimate.
    const hijackRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/enquiries',
      body: {
        fullName: 'Malicious Attacker',
        phone: '9123456789',
        email: 'attacker@hacker.io',
        plotLocation: 'Madurai',
        estimateNumber,
      },
    });
    assert(hijackRes.status === 201, `Tokenless submission creates a separate lead (got ${hijackRes.status})`);
    assert(hijackRes.body.data.estimateNumber === null, 'Tokenless submission is not linked to the estimate');

    // 2. The victim's phone number is not a credential either.
    const phoneOnlyRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/enquiries',
      body: {
        fullName: 'Knows The Phone Number',
        phone: victimPhone,
        email: 'attacker2@hacker.io',
        plotLocation: 'Chennai',
        estimateNumber,
        requirementNotes: 'Overwritten by someone who knew the phone number',
      },
    });
    assert(phoneOnlyRes.status === 201, `Matching phone without token does not update the lead (got ${phoneOnlyRes.status})`);
    assert(phoneOnlyRes.body.data.estimateNumber === null, 'Phone-only submission is not linked to the estimate');

    const enquiryAfterAttack = await db.query.enquiries.findFirst({
      where: eq(enquiries.id, initialEnquiry!.id),
    });
    assert(enquiryAfterAttack!.fullName === victimName, 'Victim enquiry fullName is UNCHANGED');
    assert(enquiryAfterAttack!.email === victimEmail, 'Victim enquiry email is UNCHANGED');
    assert(enquiryAfterAttack!.requirementNotes === initialEnquiry!.requirementNotes, 'Victim notes are UNCHANGED');

    // 3. A wrong token of the right shape is refused the same way.
    const wrongTokenRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/enquiries',
      body: {
        fullName: 'Guessing Tokens',
        phone: '9000000000',
        email: 'attacker3@hacker.io',
        plotLocation: 'Chennai',
        estimateNumber,
        accessToken: 'f'.repeat(64),
      },
    });
    assert(wrongTokenRes.status === 201 && wrongTokenRes.body.data.estimateNumber === null, 'Wrong token is not linked');

    // 4. The customer, holding their link, can update their own lead.
    const legitTokenUpdateRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/enquiries',
      body: {
        fullName: 'Genuine Customer Via Token',
        phone: '9988776655',
        email: victimEmail,
        plotLocation: 'Chennai',
        estimateNumber,
        accessToken,
        requirementNotes: 'Customer added notes',
      },
    });
    assert(legitTokenUpdateRes.status === 200, `Update with valid accessToken succeeds (got ${legitTokenUpdateRes.status})`);
    const enquiryAfterLegitUpdate = await db.query.enquiries.findFirst({
      where: eq(enquiries.id, initialEnquiry!.id),
    });
    assert(enquiryAfterLegitUpdate!.requirementNotes === 'Customer added notes', 'Token-authorised update was applied');
    console.log('  ✅ PASS: Only the estimate access token links or updates a customer lead');

    // -----------------------------------------------------------------
    // [Test 5] Login does not reveal which accounts exist
    // -----------------------------------------------------------------
    console.log('\n[Test 5] Login account enumeration');
    const timeLogin = async (email: string, password: string) => {
      const started = performance.now();
      const res = await makeRequest(server, {
        method: 'POST',
        path: '/api/v1/admin/auth/login',
        body: { email, password },
      });
      return { ms: performance.now() - started, res };
    };
    const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

    const unknownTimes: number[] = [];
    const knownTimes: number[] = [];
    for (let i = 0; i < 3; i++) {
      const unknown = await timeLogin(`nobody-${Date.now()}-${i}@example.com`, 'Wrong-Password-1');
      assert(unknown.res.body.error.code === 'INVALID_CREDENTIALS', 'Unknown email answers INVALID_CREDENTIALS');
      unknownTimes.push(unknown.ms);
      const known = await timeLogin('admin@asthiwar.com', 'Wrong-Password-1');
      knownTimes.push(known.ms);
    }
    assert(
      median(unknownTimes) >= median(knownTimes) * 0.5,
      `Unknown email costs the same as a wrong password (${Math.round(median(unknownTimes))}ms vs ${Math.round(median(knownTimes))}ms)`
    );

    const disabledEmail = `disabled-${Date.now()}@security-test.local`;
    const [disabledUser] = await db
      .insert(adminUsers)
      .values({
        email: disabledEmail,
        passwordHash: await bcrypt.hash('Right-Password-1', 12),
        fullName: 'Disabled Test Account',
        role: 'viewer',
        isActive: false,
      })
      .returning({ id: adminUsers.id });
    try {
      const disabledWrong = await timeLogin(disabledEmail, 'Wrong-Password-1');
      assert(
        disabledWrong.res.status === 401 && disabledWrong.res.body.error.code === 'INVALID_CREDENTIALS',
        `Disabled account with a wrong password looks like any bad login (got ${disabledWrong.res.body.error.code})`
      );
      const disabledRight = await timeLogin(disabledEmail, 'Right-Password-1');
      assert(disabledRight.res.status === 403, 'Disabled account with the right password is told it is disabled');
    } finally {
      await db.delete(adminUsers).where(eq(adminUsers.id, disabledUser.id));
    }

    // Production refuses the password published in the source.
    const realNodeEnv = env.NODE_ENV;
    env.NODE_ENV = 'production';
    try {
      const defaultLogin = await timeLogin('admin@asthiwar.com', PUBLISHED_DEFAULT_ADMIN_PASSWORD);
      assert(
        defaultLogin.res.status === 403 && defaultLogin.res.body.error.code === 'DEFAULT_PASSWORD_BLOCKED',
        `Production blocks the published default password (got ${defaultLogin.res.status})`
      );
    } finally {
      env.NODE_ENV = realNodeEnv;
    }
    console.log('  ✅ PASS: Login responses and timing do not enumerate accounts');

    // -----------------------------------------------------------------
    // [Test 6] Audit log cannot be used to fill the database
    // -----------------------------------------------------------------
    console.log('\n[Test 6] Audit log write amplification');
    const countHealthAuditRows = async () => {
      const [row] = await db
        .select({ n: count() })
        .from(auditLogs)
        .where(eq(auditLogs.endpoint, '/api/v1/health'));
      return Number(row.n);
    };
    await new Promise((r) => setTimeout(r, 500));
    const healthRowsBefore = await countHealthAuditRows();
    for (let i = 0; i < 5; i++) {
      const rejected = await makeRequest(server, {
        path: '/api/v1/health',
        headers: { Origin: 'https://evil.example' },
      });
      assert(rejected.status === 403, 'Disallowed origin is refused');
    }
    await new Promise((r) => setTimeout(r, 500));
    assert((await countHealthAuditRows()) === healthRowsBefore, 'Rejected origins write no audit rows');

    const oversizedPreview = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/calculator/preview',
      body: {
        customerName: 'Probe',
        customerPhone: '9999999999',
        plotLocation: 'Chennai',
        plotArea: 1200,
        builtupAreaPerFloor: 1000,
        floorCount: 1,
        packageSlug: 'basic',
        customizations: Array.from({ length: 5000 }, (_, i) => ({ itemSlug: `x${i}`, optionSlug: 'y' })),
      },
    });
    assert(oversizedPreview.status === 400, `Oversized customizations array is rejected up front (got ${oversizedPreview.status})`);
    assert(JSON.stringify(oversizedPreview.body).length < 2000, 'Rejection response stays small');

    const hugeNotes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/enquiries',
      body: {
        fullName: 'Probe',
        phone: '9999999999',
        email: 'probe@example.com',
        plotLocation: 'Chennai',
        requirementNotes: 'x'.repeat(20000),
      },
    });
    assert(hugeNotes.status === 400, `Oversized enquiry notes are rejected (got ${hugeNotes.status})`);

    const bounded = boundedForAudit({ items: Array.from({ length: 10000 }, (_, i) => i) }) as Record<string, unknown>;
    assert(bounded.truncated === true, 'Large audit values are replaced by a summary');
    console.log('  ✅ PASS: Anonymous requests cannot inflate audit_logs');

    // -----------------------------------------------------------------
    // [Test 7] Internal error text is not returned to callers
    // -----------------------------------------------------------------
    console.log('\n[Test 7] Error responses do not leak internals');
    const nulByte = await makeRequest(server, { path: '/api/v1/calculator/estimate/AW%00X?t=abc' });
    assert(nulByte.status === 400, `Database data exception answers 400 (got ${nulByte.status})`);
    assert(nulByte.body.error.code === 'INVALID_INPUT', 'Code is INVALID_INPUT, not a SQLSTATE');
    assert(!/UTF8|0x00/.test(nulByte.body.error.message), 'Postgres message is not echoed');

    const captured: { status?: number; body?: any } = {};
    const fakeRes = {
      status(code: number) {
        captured.status = code;
        return this;
      },
      json(body: unknown) {
        captured.body = body;
        return this;
      },
    } as unknown as Response;
    const fakeReq = {
      originalUrl: '/api/v1/security-test',
      method: 'GET',
      headers: {},
      body: {},
      query: {},
      params: {},
      ip: '127.0.0.1',
      socket: {},
    } as unknown as Request;
    const realConsoleError = console.error;
    console.error = () => {};
    try {
      errorHandler(
        new Error('connection to server at "db.internal" (10.0.0.5), port 5432 failed'),
        fakeReq,
        fakeRes,
        () => {}
      );
    } finally {
      console.error = realConsoleError;
    }
    assert(captured.status === 500, 'Unexpected error answers 500');
    assert(captured.body.error.message === 'An unexpected error occurred', 'Unexpected error message is generic');
    assert(captured.body.error.code === 'INTERNAL_SERVER_ERROR', 'Unexpected error code is generic');

    const health = await makeRequest(server, { path: '/api/v1/health' });
    assert(
      JSON.stringify(Object.keys(health.body)) === '["status"]' &&
        ['ok', 'unavailable'].includes(health.body.status),
      `Health check answers status only (got ${JSON.stringify(health.body)})`
    );
    console.log('  ✅ PASS: Unexpected errors and database faults are answered generically');

    // -----------------------------------------------------------------
    // [Test 8] Public quotation reads are rate limited
    // -----------------------------------------------------------------
    console.log('\n[Test 8] Public quotation routes');
    const quotationRef = String(estimateNumber).replace(/\//g, '-');
    const pdfPath = `/api/v1/calculator/estimate/${quotationRef}/pdf?t=${accessToken}`;
    const firstPdf = await makeRequest(server, { path: pdfPath });
    const secondPdf = await makeRequest(server, { path: pdfPath });
    assert(firstPdf.status === 200 && secondPdf.status === 200, 'Quotation PDF is served with its token');
    assert(Boolean(firstPdf.headers['ratelimit-limit'] ?? firstPdf.headers['ratelimit']), 'PDF route carries rate-limit headers');
    const jsonRead = await makeRequest(server, {
      path: `/api/v1/calculator/estimate/${quotationRef}?t=${accessToken}`,
    });
    assert(jsonRead.status === 200, 'Estimate JSON is served with its token');
    assert(Boolean(jsonRead.headers['ratelimit-limit'] ?? jsonRead.headers['ratelimit']), 'Estimate JSON route carries rate-limit headers');
    console.log('  ✅ PASS: Quotation reads are rate limited');

    // -----------------------------------------------------------------
    // [Test 9] Client IP is only taken from the proxy when it proves itself
    // -----------------------------------------------------------------
    console.log('\n[Test 9] Trusted client IP');
    const spoofReq = (secret: string) =>
      ({
        headers: { 'x-asthiwar-proxy-secret': secret, 'x-asthiwar-client-ip': '203.0.113.7' },
        ip: '10.0.0.1',
        socket: {},
      }) as unknown as Request;
    const realProxySecret = env.API_PROXY_SECRET;
    try {
      env.API_PROXY_SECRET = undefined;
      assert(clientIp(spoofReq('anything')) === '10.0.0.1', 'Without a configured secret the header is ignored');
      env.API_PROXY_SECRET = 'a'.repeat(40);
      assert(clientIp(spoofReq('b'.repeat(40))) === '10.0.0.1', 'A wrong secret is ignored');
      assert(clientIp(spoofReq('a'.repeat(40))) === '203.0.113.7', 'The right secret forwards the client IP');
    } finally {
      env.API_PROXY_SECRET = realProxySecret;
    }
    console.log('  ✅ PASS: Forwarded client IP requires the proxy secret');

    // -----------------------------------------------------------------
    // [Test 10] Cross-site writes and the CORS wildcard
    // -----------------------------------------------------------------
    console.log('\n[Test 10] Cross-site writes and CORS wildcard');
    const siteOrigin = new URL(env.PUBLIC_BASE_URL).origin;

    const refererOnly = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/admin/auth/logout',
      headers: { Cookie: cookieStr, Referer: 'https://evil.example/page' },
    });
    assert(
      refererOnly.status === 403 && refererOnly.body.error.code === 'UNTRUSTED_ORIGIN',
      `A write with a foreign Referer and no Origin is refused (got ${refererOnly.status})`
    );
    const stillSignedIn = await makeRequest(server, {
      path: '/api/v1/admin/auth/me',
      headers: { Cookie: cookieStr },
    });
    assert(stillSignedIn.status === 200, 'The refused logout did not end the session');

    const fromSite = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/enquiries',
      body: {},
      headers: { Origin: siteOrigin },
    });
    assert(fromSite.status === 400, `A write from PUBLIC_BASE_URL reaches validation (got ${fromSite.status})`);

    const formPost = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/enquiries',
      body: 'fullName=Form+Spam&phone=9999999999&email=a%40b.co&plotLocation=Chennai',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    assert(formPost.status === 400, `A form-encoded body is not parsed (got ${formPost.status})`);

    const realCorsOrigin = env.CORS_ORIGIN;
    env.CORS_ORIGIN = '*';
    const realConsoleWarn = console.warn;
    console.warn = () => {};
    const wildcardServer = http.createServer(createApp());
    console.warn = realConsoleWarn;
    await new Promise<void>((resolve) => wildcardServer.listen(0, '127.0.0.1', () => resolve()));
    try {
      const wildcardRead = await makeRequest(wildcardServer, {
        path: '/api/v1/calculator/packages',
        headers: { Origin: 'https://evil.example' },
      });
      assert(wildcardRead.status === 200, 'Wildcard still allows public reads');
      assert(wildcardRead.headers['access-control-allow-origin'] === '*', 'Wildcard answers Allow-Origin: *');
      assert(
        wildcardRead.headers['access-control-allow-credentials'] === undefined,
        'Wildcard never sends Allow-Credentials'
      );

      const wildcardWrite = await makeRequest(wildcardServer, {
        method: 'POST',
        path: '/api/v1/admin/auth/logout',
        headers: { Cookie: cookieStr, Origin: 'https://evil.example' },
      });
      assert(
        wildcardWrite.status === 403 && wildcardWrite.body.error.code === 'UNTRUSTED_ORIGIN',
        `Wildcard does not let another site write (got ${wildcardWrite.status})`
      );
    } finally {
      wildcardServer.close();
      env.CORS_ORIGIN = realCorsOrigin;
    }
    console.log('  ✅ PASS: Other sites cannot write, and `*` never shares credentials');

    // -----------------------------------------------------------------
    // [Test 11] Stack traces are for super_admin only
    // -----------------------------------------------------------------
    console.log('\n[Test 11] Audit log stack traces');
    const viewerEmail = `viewer-${Date.now()}@security-test.local`;
    const [viewer] = await db
      .insert(adminUsers)
      .values({
        email: viewerEmail,
        passwordHash: await bcrypt.hash('Viewer-Password-1', 12),
        fullName: 'Viewer Test Account',
        role: 'viewer',
        isActive: true,
      })
      .returning({ id: adminUsers.id });
    const [stackRow] = await db
      .insert(auditLogs)
      .values({
        eventType: 'ERROR',
        action: 'SECURITY_TEST_STACK',
        errorMessage: 'security test',
        errorStack: 'Error: security test\n    at internal/path.ts:1:1',
      })
      .returning({ id: auditLogs.id });
    try {
      const viewerLogin = await makeRequest(server, {
        method: 'POST',
        path: '/api/v1/admin/auth/login',
        body: { email: viewerEmail, password: 'Viewer-Password-1' },
      });
      const viewerCookie = (viewerLogin.headers['set-cookie'] ?? [])
        .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`))!
        .split(';')[0];

      const asViewer = await makeRequest(server, {
        path: `/api/v1/admin/audit-logs/${stackRow.id}`,
        headers: { Cookie: viewerCookie },
      });
      assert(asViewer.status === 200, 'Viewer can read the audit entry');
      assert(!('errorStack' in asViewer.body.data), 'Viewer does not receive errorStack');

      const asSuperAdmin = await makeRequest(server, {
        path: `/api/v1/admin/audit-logs/${stackRow.id}`,
        headers: { Cookie: cookieStr },
      });
      assert(
        typeof asSuperAdmin.body.data.errorStack === 'string',
        'super_admin receives errorStack'
      );
    } finally {
      await db.delete(auditLogs).where(eq(auditLogs.id, stackRow.id));
      await db.delete(adminUsers).where(eq(adminUsers.id, viewer.id));
    }
    console.log('  ✅ PASS: Only super_admin sees stack traces');

    // -----------------------------------------------------------------
    // [Test 12] WhatsApp transport
    // -----------------------------------------------------------------
    console.log('\n[Test 12] WhatsApp providers');
    const realFetch = globalThis.fetch;
    const fetchedUrls: string[] = [];
    globalThis.fetch = (async (input: string | URL | globalThis.Request) => {
      fetchedUrls.push(String(input));
      return new globalThis.Response('{}', { status: 200 });
    }) as typeof fetch;
    const savedEnv = {
      CALLMEBOT_API_KEY: process.env.CALLMEBOT_API_KEY,
      WHATSAPP_API_URL: process.env.WHATSAPP_API_URL,
      WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
    };
    const realConsoleInfo = console.info;
    const realConsoleErr = console.error;
    console.info = () => {};
    console.error = () => {};
    try {
      process.env.CALLMEBOT_API_KEY = 'callmebot-key';
      delete process.env.WHATSAPP_API_URL;
      delete process.env.WHATSAPP_API_TOKEN;
      const viaCallMeBot = await sendWhatsAppMessage({ to: '919999999999', message: 'lead details' });
      assert(viaCallMeBot.reason === 'NO_CREDENTIALS', 'CALLMEBOT_API_KEY alone sends nothing');

      process.env.WHATSAPP_API_URL = 'http://gateway.example/send';
      process.env.WHATSAPP_API_TOKEN = 'gateway-token';
      const viaHttpGateway = await sendWhatsAppMessage({ to: '919999999999', message: 'lead details' });
      assert(viaHttpGateway.sent === false && viaHttpGateway.reason === 'FAILED', 'An http:// gateway is refused');

      assert(fetchedUrls.length === 0, `No outbound request was made (saw ${fetchedUrls.join(', ') || 'none'})`);
    } finally {
      globalThis.fetch = realFetch;
      console.info = realConsoleInfo;
      console.error = realConsoleErr;
      for (const [key, value] of Object.entries(savedEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
    console.log('  ✅ PASS: No CallMeBot, no cleartext gateway');

    // -----------------------------------------------------------------
    // [Test 13] Login lockout cannot keep a known device out
    // -----------------------------------------------------------------
    console.log('\n[Test 13] Login lockout and trusted devices');
    const lockEmail = `lockout-${Date.now()}@security-test.local`;
    const lockPassword = 'Lockout-Password-1';
    const [lockUser] = await db
      .insert(adminUsers)
      .values({
        email: lockEmail,
        passwordHash: await bcrypt.hash(lockPassword, 12),
        fullName: 'Lockout Test Account',
        role: 'viewer',
        isActive: true,
      })
      .returning({ id: adminUsers.id });
    try {
      const firstLogin = await makeRequest(server, {
        method: 'POST',
        path: '/api/v1/admin/auth/login',
        body: { email: lockEmail, password: lockPassword },
      });
      assert(firstLogin.status === 200, 'Owner signs in');
      assert(!('token' in firstLogin.body.data), 'Login body does not carry the session token');
      const deviceSetCookie = (firstLogin.headers['set-cookie'] ?? []).find((c) =>
        c.startsWith(`${TRUSTED_DEVICE_COOKIE}=`)
      );
      assert(Boolean(deviceSetCookie), 'Sign-in issues a trusted-device cookie');
      assert(/HttpOnly/i.test(deviceSetCookie!), 'Device cookie is HttpOnly');
      assert(/Path=\/api\/v1\/admin\/auth/i.test(deviceSetCookie!), 'Device cookie is scoped to the auth routes');
      const deviceCookie = deviceSetCookie!.split(';')[0];

      const attackStatuses: number[] = [];
      for (let i = 0; i < 11; i++) {
        const attempt = await makeRequest(server, {
          method: 'POST',
          path: '/api/v1/admin/auth/login',
          body: { email: lockEmail, password: `wrong-${i}` },
        });
        attackStatuses.push(attempt.status);
      }
      assert(attackStatuses[10] === 429, `The account locks for unknown browsers (got ${attackStatuses.join(',')})`);

      const unknownBrowser = await makeRequest(server, {
        method: 'POST',
        path: '/api/v1/admin/auth/login',
        body: { email: lockEmail, password: lockPassword },
      });
      assert(unknownBrowser.status === 429, 'An unknown browser stays locked out, even with the password');

      const knownDevice = await makeRequest(server, {
        method: 'POST',
        path: '/api/v1/admin/auth/login',
        body: { email: lockEmail, password: lockPassword },
        headers: { Cookie: deviceCookie },
      });
      assert(knownDevice.status === 200, `The owner's device still signs in during the attack (got ${knownDevice.status})`);

      const forged = deviceCookie.slice(0, -2) + (deviceCookie.endsWith('AA') ? 'BB' : 'AA');
      const forgedDevice = await makeRequest(server, {
        method: 'POST',
        path: '/api/v1/admin/auth/login',
        body: { email: lockEmail, password: lockPassword },
        headers: { Cookie: forged },
      });
      assert(forgedDevice.status === 429, 'A tampered device cookie is not trusted');
    } finally {
      await db.delete(adminUsers).where(eq(adminUsers.id, lockUser.id));
    }
    console.log('  ✅ PASS: Flooding a known email no longer locks out its owner');

    // -----------------------------------------------------------------
    // [Test 14] Estimate sizes are bounded
    // -----------------------------------------------------------------
    console.log('\n[Test 14] Estimate size limits');
    const previewWith = (dimensions: Record<string, unknown>) =>
      makeRequest(server, {
        method: 'POST',
        path: '/api/v1/calculator/preview',
        body: {
          customerName: 'Probe',
          customerPhone: '9999999999',
          plotLocation: 'Chennai',
          packageSlug: 'basic',
          plotArea: 2400,
          builtupAreaPerFloor: 1200,
          floorCount: 1,
          ...dimensions,
        },
      });
    assert((await previewWith({})).status === 200, 'A normal house still prices');
    assert((await previewWith({ builtupAreaPerFloor: 1e200 })).status === 400, '1e200 sq.ft is refused');
    assert((await previewWith({ builtupAreaPerFloor: 60000 })).status === 400, 'Over 100,000 sq.ft in total is refused');
    assert((await previewWith({ plotArea: 10000, plotAreaUnit: 'cents' })).status === 400, 'A 4.3M sq.ft plot is refused');
    assert((await previewWith({ carParkingAreaSqft: 1e308 })).status === 400, 'Unbounded parking area is refused');
    const liftRush = await previewWith({ addons: [{ addonSlug: 'passenger_lift', variantSlug: '4pax', quantity: 1000 }] });
    assert(
      liftRush.status === 422 && /maximum of 10/.test(JSON.stringify(liftRush.body.error.details)),
      `1,000 of a fixed-price add-on is refused for exceeding its ceiling (got ${liftRush.status} ${JSON.stringify(liftRush.body.error?.details)})`
    );
    const oneLift = await previewWith({ addons: [{ addonSlug: 'passenger_lift', variantSlug: '4pax', quantity: 1 }] });
    assert(oneLift.status === 200, `One lift still prices (got ${oneLift.status})`);
    console.log('  ✅ PASS: Absurd dimensions cannot become stored quotations');

    // -----------------------------------------------------------------
    // [Test 15] Quotation links expire and can be reissued
    // -----------------------------------------------------------------
    console.log('\n[Test 15] Quotation link expiry and reissue');
    const [linkEstimate] = await db
      .select({ id: estimates.id, estimateNumber: estimates.estimateNumber })
      .from(estimates)
      .where(eq(estimates.accessToken, accessToken));
    const linkRef = String(linkEstimate.estimateNumber).replace(/\//g, '-');

    const liveRead = await makeRequest(server, { path: `/api/v1/calculator/estimate/${linkRef}?t=${accessToken}` });
    assert(liveRead.status === 200, 'A live link reads the quotation');
    assert(!('accessToken' in liveRead.body.data), 'The served snapshot does not repeat the token');

    await db
      .update(estimates)
      .set({ accessTokenExpiresAt: new Date(Date.now() - 1000) })
      .where(eq(estimates.id, linkEstimate.id));
    const expiredRead = await makeRequest(server, { path: `/api/v1/calculator/estimate/${linkRef}?t=${accessToken}` });
    assert(
      expiredRead.status === 410 && expiredRead.body.error.code === 'QUOTATION_LINK_EXPIRED',
      `An expired link is refused (got ${expiredRead.status})`
    );

    const reissue = await makeRequest(server, {
      method: 'POST',
      path: `/api/v1/admin/estimates/${linkEstimate.id}/access-link`,
      headers: { Cookie: cookieStr },
    });
    assert(reissue.status === 200, `Staff can issue a new link (got ${reissue.status})`);
    const newToken = new URL(`http://x${reissue.body.data.accessLinkPath}`).searchParams.get('t')!;
    assert(Boolean(newToken) && newToken !== accessToken, 'The new link carries a new token');

    const oldTokenRead = await makeRequest(server, { path: `/api/v1/calculator/estimate/${linkRef}?t=${accessToken}` });
    assert(oldTokenRead.status === 404, 'The previous link no longer works');
    const newTokenRead = await makeRequest(server, { path: `/api/v1/calculator/estimate/${linkRef}?t=${newToken}` });
    assert(newTokenRead.status === 200, 'The new link works');
    console.log('  ✅ PASS: Links expire, and a leaked link can be revoked');

    // -----------------------------------------------------------------
    // [Test 16] Rate-limit keys group IPv6 by /56
    // -----------------------------------------------------------------
    console.log('\n[Test 16] IPv6 rate-limit keys');
    const keyFor = (ip: string) => clientIpKey({ headers: {}, ip, socket: {} } as unknown as Request);
    assert(keyFor('2001:db8:1234:5600::1') === keyFor('2001:db8:1234:56ff:ffff::9'), 'Addresses in one /56 share a bucket');
    assert(keyFor('2001:db8:1234:5600::1') !== keyFor('2001:db8:1234:5700::1'), 'Different /56 networks do not');
    assert(keyFor('::ffff:203.0.113.9') === '203.0.113.9', 'IPv4-mapped addresses key as IPv4');
    console.log('  ✅ PASS: Rotating IPv6 addresses does not reset limits');

    // -----------------------------------------------------------------
    // [Test 17] One address cannot use up the audit trail
    // -----------------------------------------------------------------
    console.log('\n[Test 17] Per-address audit cap and suppression summary');
    await flushAnonymousAuditWindow();
    const auditProbePath = `/api/v1/security-test-audit-cap-${Date.now()}`;
    const failFrom = (ip: string) => {
      const res = {
        status() {
          return this;
        },
        json() {
          return this;
        },
      } as unknown as Response;
      const req = {
        originalUrl: auditProbePath,
        method: 'GET',
        headers: {},
        body: {},
        query: {},
        params: {},
        ip,
        socket: {},
      } as unknown as Request;
      const quiet = console.error;
      console.error = () => {};
      try {
        errorHandler(new Error('audit cap probe'), req, res, () => {});
      } finally {
        console.error = quiet;
      }
    };
    for (let i = 0; i < 15; i++) failFrom('198.51.100.1');
    failFrom('198.51.100.2');
    await flushAnonymousAuditWindow();
    await new Promise((r) => setTimeout(r, 500));

    const probeRows = await db
      .select({ ip: auditLogs.ipAddress })
      .from(auditLogs)
      .where(eq(auditLogs.endpoint, auditProbePath));
    const fromFlooder = probeRows.filter((row) => row.ip === '198.51.100.1').length;
    const fromOther = probeRows.filter((row) => row.ip === '198.51.100.2').length;
    assert(fromFlooder === 10, `One address records at most 10 per minute (got ${fromFlooder})`);
    assert(fromOther === 1, 'Another address is still recorded');

    const summaries = await db
      .select({ id: auditLogs.id, metadata: auditLogs.metadata })
      .from(auditLogs)
      .where(eq(auditLogs.action, 'ANONYMOUS_ERRORS_SUPPRESSED'))
      .orderBy(desc(auditLogs.id))
      .limit(1);
    const summary = summaries[0]?.metadata as { suppressed?: number; topAddresses?: Array<{ ip: string }> } | undefined;
    assert(
      summary?.suppressed === 5 && summary.topAddresses?.[0]?.ip === '198.51.100.1',
      `The withheld records are summarised with the address (got ${JSON.stringify(summary)})`
    );
    await db.delete(auditLogs).where(eq(auditLogs.endpoint, auditProbePath));
    if (summaries[0]) await db.delete(auditLogs).where(eq(auditLogs.id, summaries[0].id));
    console.log('  ✅ PASS: Flooding is capped per address and leaves a record');

    // -----------------------------------------------------------------
    // [Test 18] Unset NODE_ENV means production
    // -----------------------------------------------------------------
    console.log('\n[Test 18] NODE_ENV default');
    const envModuleUrl = pathToFileURL(fileURLToPath(new URL('../config/env.ts', import.meta.url))).href;
    const childEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      DATABASE_URL: 'postgresql://unused@localhost/unused',
      SESSION_SECRET: 'x'.repeat(40),
    };
    const probe = spawnSync(
      process.execPath,
      // tsx by absolute URL: the child runs in an empty directory with no node_modules.
      ['--import', import.meta.resolve('tsx'), '--input-type=module', '-e', `const m = await import(${JSON.stringify(envModuleUrl)}); console.log('NODE_ENV=' + m.env.NODE_ENV);`],
      // An empty directory, so no .env file supplies NODE_ENV.
      { cwd: fs.mkdtempSync(path.join(os.tmpdir(), 'asthiwar-env-')), env: childEnv, encoding: 'utf8' }
    );
    assert(
      /NODE_ENV=production/.test(probe.stdout),
      `Unset NODE_ENV resolves to production (stdout: ${probe.stdout.trim()} stderr: ${probe.stderr.trim().slice(0, 200)})`
    );
    console.log('  ✅ PASS: A deploy that forgets NODE_ENV fails closed');

    console.log('\n-----------------------------------------------------------------');
    console.log('Results: All Security Hardening & Penetration Tests Passed!');
  } finally {
    server.close();
    await new Promise((r) => setTimeout(r, 150));
    await pool.end();
  }
}

runSecurityTests().catch((err) => {
  console.error('\n❌ Security Tests Failed:', err);
  process.exit(1);
});
