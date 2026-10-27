const http = require('http');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

const AUTH_SECRET = process.env.AUTH_SECRET || 'brandguard_ai_production_auth_secret_key_928174';

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function mintToken(user, expiresIn = '1h', secret = AUTH_SECRET) {
  return jwt.sign(
    {
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    secret,
    {
      expiresIn,
      issuer: 'brandguard-ai',
      audience: 'brandguard-api',
    }
  );
}

async function runSecurityTests() {
  console.log('===============================================================');
  console.log('   BRANDGUARD AI - AUTH & ROLE-BASED AUTHORIZATION TEST SUITE  ');
  console.log('===============================================================\n');

  const results = [];
  function record(testName, passed, details) {
    results.push({ testName, passed, details });
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${testName}\n       -> ${details}`);
  }

  // Pre-fetch a real audit, finding, and guideline ID from DB
  let conn;
  let testAuditId = 'audit-mvqs980u-vion';
  let testFindingId = 'find-0oy26jmi';
  let testGuidelineId = 'guide-aura';
  let testBrandId = 'brand-aura';

  try {
    conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'brandguard_db',
    });

    const [aRows] = await conn.query('SELECT id FROM audits LIMIT 1');
    if (aRows.length) testAuditId = aRows[0].id;

    const [fRows] = await conn.query('SELECT id, audit_id FROM findings LIMIT 1');
    if (fRows.length) {
      testFindingId = fRows[0].id;
      testAuditId = fRows[0].audit_id;
    }

    const [gRows] = await conn.query('SELECT id, brand_id FROM guidelines LIMIT 1');
    if (gRows.length) {
      testGuidelineId = gRows[0].id;
      testBrandId = gRows[0].brand_id;
    }
  } catch (err) {
    console.warn('MySQL read warning:', err.message);
  } finally {
    if (conn) await conn.end();
  }

  // Define users
  const creatorUser = {
    uid: 'usr-creator-test',
    email: 'creator@brandguard.ai',
    name: 'Alex Chen',
    role: 'Content Creator',
  };
  const reviewerUser = {
    uid: 'usr-reviewer-test',
    email: 'reviewer@brandguard.ai',
    name: 'Jordan Patel',
    role: 'Reviewer',
  };
  const adminUser = {
    uid: 'usr-admin-test',
    email: 'admin@brandguard.ai',
    name: 'Morgan Taylor',
    role: 'Administrator',
  };

  const creatorToken = mintToken(creatorUser);
  const reviewerToken = mintToken(reviewerUser);
  const adminToken = mintToken(adminUser);
  const expiredToken = mintToken(creatorUser, '-10s');
  const forgedToken = mintToken(creatorUser, '1h', 'wrong_fake_secret_key_tamper');

  // -------------------------------------------------------------
  // TEST GROUP 1: UNAUTHENTICATED ACCESS (Expected: 401 Unauthorized)
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Unauthenticated Access Rejections (401) ---');

  const unauthEndpoints = [
    { method: 'POST', path: '/api/audits', body: { title: 'Test' }, label: 'POST /api/audits' },
    { method: 'PUT', path: `/api/audits/${testAuditId}/findings/${testFindingId}`, body: { status: 'Resolved' }, label: 'PUT finding-status' },
    { method: 'POST', path: `/api/audits/${testAuditId}/approval`, body: { action: 'approve' }, label: 'POST approval' },
    { method: 'PUT', path: `/api/guidelines/${testGuidelineId}`, body: { id: testGuidelineId, brandId: testBrandId }, label: 'PUT guidelines' },
    { method: 'POST', path: '/api/brands', body: { name: 'New Brand' }, label: 'POST brands' },
    { method: 'DELETE', path: `/api/brands/${testBrandId}`, body: null, label: 'DELETE brands/:id' },
  ];

  for (const ep of unauthEndpoints) {
    try {
      const res = await makeRequest(
        {
          hostname: 'localhost',
          port: 3001,
          path: ep.path,
          method: ep.method,
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173',
          },
        },
        ep.body
      );
      const is401 = res.statusCode === 401 && res.data?.error?.includes('Authentication required');
      record(
        `Unauthenticated ${ep.label} is rejected with 401`,
        is401,
        `Status: ${res.statusCode}, Error: ${JSON.stringify(res.data?.error || res.data)}`
      );
    } catch (err) {
      record(`Unauthenticated ${ep.label}`, false, err.message);
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 2: INVALID, FORGED & EXPIRED TOKENS (Expected: 401)
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Invalid, Forged, and Expired Tokens (401) ---');

  // Corrupted token
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        Authorization: 'Bearer invalid.garbled.tokenstring',
        Origin: 'http://localhost:5173',
      },
    });
    const is401 = res.statusCode === 401;
    record('Malformed token rejected with 401', is401, `Status: ${res.statusCode}, Error: ${JSON.stringify(res.data)}`);
  } catch (err) {
    record('Malformed token', false, err.message);
  }

  // Forged signature
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${forgedToken}`,
        Origin: 'http://localhost:5173',
      },
    });
    const is401 = res.statusCode === 401 && res.data?.error?.includes('Invalid cryptographic token signature');
    record('Forged signature rejected with 401', is401, `Status: ${res.statusCode}, Error: ${JSON.stringify(res.data)}`);
  } catch (err) {
    record('Forged signature', false, err.message);
  }

  // Expired token
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${expiredToken}`,
        Origin: 'http://localhost:5173',
      },
    });
    const is401 = res.statusCode === 401 && res.data?.error?.includes('Token expired');
    record('Expired token rejected with 401', is401, `Status: ${res.statusCode}, Error: ${JSON.stringify(res.data)}`);
  } catch (err) {
    record('Expired token', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST GROUP 3: ROLE AUTHORIZATION & FORBIDDEN ROLES (Expected: 403)
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Forbidden Role Enforcement (403) ---');

  // Content Creator trying to approve an audit
  try {
    const res = await makeRequest(
      {
        hostname: 'localhost',
        port: 3001,
        path: `/api/audits/${testAuditId}/approval`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creatorToken}`,
          'Content-Type': 'application/json',
          Origin: 'http://localhost:5173',
        },
      },
      { action: 'approve', comment: 'Creator trying to self-approve' }
    );
    const is403 = res.statusCode === 403 && res.data?.error?.includes('Forbidden: Only Reviewers or Administrators');
    record(
      'Content Creator forbidden from approving audit (403)',
      is403,
      `Status: ${res.statusCode}, Error: ${res.data?.error}`
    );
  } catch (err) {
    record('Creator approve forbidden', false, err.message);
  }

  // Content Creator trying to update finding status
  try {
    const res = await makeRequest(
      {
        hostname: 'localhost',
        port: 3001,
        path: `/api/audits/${testAuditId}/findings/${testFindingId}`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${creatorToken}`,
          'Content-Type': 'application/json',
          Origin: 'http://localhost:5173',
        },
      },
      { status: 'Resolved' }
    );
    const is403 = res.statusCode === 403 && res.data?.error?.includes('Forbidden: Insufficient privileges');
    record(
      'Content Creator forbidden from updating finding status (403)',
      is403,
      `Status: ${res.statusCode}, Error: ${res.data?.error}`
    );
  } catch (err) {
    record('Creator finding update forbidden', false, err.message);
  }

  // Content Creator trying to modify brand guidelines
  try {
    const res = await makeRequest(
      {
        hostname: 'localhost',
        port: 3001,
        path: `/api/guidelines/${testGuidelineId}`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${creatorToken}`,
          'Content-Type': 'application/json',
          Origin: 'http://localhost:5173',
        },
      },
      { id: testGuidelineId, brandId: testBrandId, description: 'Tampered' }
    );
    const is403 = res.statusCode === 403 && res.data?.error?.includes('Required role: Administrator');
    record(
      'Content Creator forbidden from modifying guidelines (403)',
      is403,
      `Status: ${res.statusCode}, Error: ${res.data?.error}`
    );
  } catch (err) {
    record('Creator guideline modify forbidden', false, err.message);
  }

  // Reviewer trying to modify brand guidelines
  try {
    const res = await makeRequest(
      {
        hostname: 'localhost',
        port: 3001,
        path: `/api/guidelines/${testGuidelineId}`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${reviewerToken}`,
          'Content-Type': 'application/json',
          Origin: 'http://localhost:5173',
        },
      },
      { id: testGuidelineId, brandId: testBrandId, description: 'Tampered by reviewer' }
    );
    const is403 = res.statusCode === 403 && res.data?.error?.includes('Required role: Administrator');
    record(
      'Reviewer forbidden from modifying guidelines (403)',
      is403,
      `Status: ${res.statusCode}, Error: ${res.data?.error}`
    );
  } catch (err) {
    record('Reviewer guideline modify forbidden', false, err.message);
  }

  // Reviewer trying to create a brand
  try {
    const res = await makeRequest(
      {
        hostname: 'localhost',
        port: 3001,
        path: '/api/brands',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${reviewerToken}`,
          'Content-Type': 'application/json',
          Origin: 'http://localhost:5173',
        },
      },
      { name: 'Reviewer Brand' }
    );
    const is403 = res.statusCode === 403 && res.data?.error?.includes('Required role: Administrator');
    record(
      'Reviewer forbidden from creating brands (403)',
      is403,
      `Status: ${res.statusCode}, Error: ${res.data?.error}`
    );
  } catch (err) {
    record('Reviewer create brand forbidden', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST GROUP 4: PERMITTED AUTHENTICATED WORKFLOWS (Expected: 200/201)
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Permitted Authenticated Workflows ---');

  // 1. Content Creator creates an audit
  let createdAuditId = null;
  try {
    const res = await makeRequest(
      {
        hostname: 'localhost',
        port: 3001,
        path: '/api/audits',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creatorToken}`,
          'Content-Type': 'application/json',
          Origin: 'http://localhost:5173',
        },
      },
      {
        title: 'Q4 Product Launch Announcement',
        campaign: 'Q4 Global Launch',
        contentType: 'Social Media',
        content: 'Discover our premium, revolutionary flagship experience with 100% satisfaction guaranteed.',
        brandId: testBrandId,
      }
    );
    const is201 = res.statusCode === 201 && res.data?.id;
    if (is201) createdAuditId = res.data.id;
    record(
      'Content Creator successfully creates audit (201)',
      is201,
      `Status: ${res.statusCode}, Audit ID: ${createdAuditId}, Submitter: ${res.data?.submitter}`
    );
  } catch (err) {
    record('Creator create audit', false, err.message);
  }

  // 2. Content Creator submits audit for approval (action: 'submit')
  if (createdAuditId) {
    try {
      const res = await makeRequest(
        {
          hostname: 'localhost',
          port: 3001,
          path: `/api/audits/${createdAuditId}/approval`,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${creatorToken}`,
            'Content-Type': 'application/json',
            Origin: 'http://localhost:5173',
          },
        },
        { action: 'submit' }
      );
      const is200 = res.statusCode === 200 && res.data?.status === 'Pending Approval';
      record(
        'Content Creator successfully submits audit for review (200)',
        is200,
        `Status: ${res.statusCode}, Audit Status: ${res.data?.status}`
      );
    } catch (err) {
      record('Creator submit audit', false, err.message);
    }
  }

  // 3. Reviewer updates finding status on existing audit
  try {
    const res = await makeRequest(
      {
        hostname: 'localhost',
        port: 3001,
        path: `/api/audits/${testAuditId}/findings/${testFindingId}`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${reviewerToken}`,
          'Content-Type': 'application/json',
          Origin: 'http://localhost:5173',
        },
      },
      { status: 'Resolved' }
    );
    const is200 = res.statusCode === 200;
    record(
      'Reviewer successfully updates finding status to Resolved (200)',
      is200,
      `Status: ${res.statusCode}`
    );

    // Revert back
    await makeRequest(
      {
        hostname: 'localhost',
        port: 3001,
        path: `/api/audits/${testAuditId}/findings/${testFindingId}`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${reviewerToken}`,
          'Content-Type': 'application/json',
          Origin: 'http://localhost:5173',
        },
      },
      { status: 'Open' }
    );
  } catch (err) {
    record('Reviewer update finding', false, err.message);
  }

  // 4. Reviewer approves the pending audit
  if (createdAuditId) {
    try {
      const res = await makeRequest(
        {
          hostname: 'localhost',
          port: 3001,
          path: `/api/audits/${createdAuditId}/approval`,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${reviewerToken}`,
            'Content-Type': 'application/json',
            Origin: 'http://localhost:5173',
          },
        },
        { action: 'approve', comment: 'Compliance standards met. Approved.' }
      );
      const is200 = res.statusCode === 200 && res.data?.status === 'Approved' && res.data?.reviewer === reviewerUser.name;
      record(
        'Reviewer successfully approves audit with server-verified name (200)',
        is200,
        `Status: ${res.statusCode}, Audit Status: ${res.data?.status}, Reviewer: ${res.data?.reviewer}`
      );
    } catch (err) {
      record('Reviewer approve audit', false, err.message);
    }
  }

  // 5. Administrator modifies brand guidelines
  try {
    // Fetch current guideline
    const getRes = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/guidelines/${testBrandId}`,
      method: 'GET',
    });
    if (getRes.statusCode === 200 && getRes.data) {
      const g = getRes.data;
      const res = await makeRequest(
        {
          hostname: 'localhost',
          port: 3001,
          path: `/api/guidelines/${g.id}`,
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
            Origin: 'http://localhost:5173',
          },
        },
        g
      );
      const is200 = res.statusCode === 200 && res.data?.id === g.id;
      record(
        'Administrator successfully saves brand guidelines (200)',
        is200,
        `Status: ${res.statusCode}, Guideline ID: ${res.data?.id}`
      );
    }
  } catch (err) {
    record('Admin save guidelines', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST GROUP 5: SYSTEM INTEGRATION & PERSISTENCE PRESERVATION
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing System Integration & Persistence ---');

  // Health endpoint check
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET',
    });
    const mysqlLive = res.data?.services?.mysql?.configured === true;
    const geminiLive = res.data?.services?.gemini?.configured === true;
    const isOk = res.statusCode === 200 && mysqlLive && geminiLive;
    record(
      'System Health: MySQL & Gemini live',
      isOk,
      `Status: ${res.statusCode}, MySQL: ${res.data?.services?.mysql?.mode}, Gemini: ${res.data?.services?.gemini?.mode}`
    );
  } catch (err) {
    record('System Health check', false, err.message);
  }

  // Auth Status endpoint
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/status',
      method: 'GET',
    });
    const isOk = res.statusCode === 200 && res.data?.rolesSupported?.length === 3;
    record(
      'Auth Status Endpoint reports configuration',
      isOk,
      `Status: ${res.statusCode}, Primary Provider: ${res.data?.primaryProvider}, Roles: ${res.data?.rolesSupported?.join(', ')}`
    );
  } catch (err) {
    record('Auth Status check', false, err.message);
  }

  // Database record counts intact
  try {
    conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'brandguard_db',
    });
    const tables = ['brands', 'guidelines', 'audits', 'findings', 'revisions', 'approval_events'];
    const counts = {};
    for (const t of tables) {
      const [cnt] = await conn.query(`SELECT COUNT(*) as c FROM ${t}`);
      counts[t] = cnt[0].c;
    }
    const intact = counts.brands > 0 && counts.audits > 0 && counts.findings > 0;
    record(
      'Database records intact (Zero data loss)',
      intact,
      `Counts: ${JSON.stringify(counts)}`
    );
  } catch (err) {
    record('Database counts check', false, err.message);
  } finally {
    if (conn) await conn.end();
  }

  console.log('\n===============================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`TOTAL SECURITY TESTS: ${results.length}`);
  console.log(`PASSED: ${results.filter((r) => r.passed).length}`);
  console.log(`FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log(`OVERALL RESULT: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('===============================================================\n');
}

runSecurityTests().catch(console.error);
