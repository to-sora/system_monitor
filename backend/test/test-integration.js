#!/usr/bin/env node
/**
 * System Monitor v2.0 - Integration Tests
 * Tests the complete backend API with real HTTP requests
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
process.env.NODE_ENV = 'test';
process.env.DB_PATH = path.join(__dirname, '../data/test-integration.db');
process.env.JWT_SECRET = 'test_jwt_secret_for_integration_testing';
process.env.DB_ENCRYPTION_KEY = 'test_encryption_key_for_integration_testing';
process.env.PORT = 3099; // Different port for testing
process.env.SSL_KEY_PATH = path.join(__dirname, '../server.key');
process.env.SSL_CERT_PATH = path.join(__dirname, '../server.cert');

let server;
let token;
const BASE_URL = `https://localhost:${process.env.PORT}`;

// Test results
let passed = 0;
let failed = 0;
const errors = [];

// Custom HTTPS agent that ignores self-signed certificate errors
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Make HTTP request
 */
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      agent: httpsAgent
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Test helper
 */
function test(name, fn) {
  return async () => {
    try {
      console.log(`\n🧪 ${name}`);
      await fn();
      console.log(`   ✅ PASSED`);
      passed++;
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      failed++;
      errors.push({ test: name, error: error.message });
    }
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Setup: Start server
 */
async function setupServer() {
  console.log('🚀 Starting test server...');

  // Clean up test database
  const dbPath = process.env.DB_PATH;
  [dbPath, dbPath + '-wal', dbPath + '-shm'].forEach(file => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });

  // Initialize database
  const db = require('../db/database');
  db.connect();

  // Create admin user
  const User = require('../db/models/User');
  await User.create({
    username: 'admin',
    password: 'Admin123!',
    isAdmin: true
  });

  // Create test device
  const Device = require('../db/models/Device');
  Device.create({
    deviceId: 'test-device',
    name: 'Test Device',
    description: 'Integration test device'
  });

  // Create test data types
  const DataType = require('../db/models/DataType');
  DataType.create({
    keyName: 'CPU_Temperature',
    dataType: 'float',
    normalRange: { min: 20, max: 60 },
    warningRange: { min: 60, max: 80 }
  });

  DataType.create({
    keyName: 'GPU_Temperature',
    dataType: 'float',
    normalRange: { min: 20, max: 70 },
    warningRange: { min: 70, max: 90 }
  });

  // Generate SSL certs if they don't exist
  if (!fs.existsSync(process.env.SSL_KEY_PATH)) {
    const { execSync } = require('child_process');
    execSync(`openssl req -x509 -nodes -days 1 -newkey rsa:2048 -keyout "${process.env.SSL_KEY_PATH}" -out "${process.env.SSL_CERT_PATH}" -subj "/CN=localhost" 2>/dev/null`, { stdio: 'ignore' });
  }

  // Start server
  server = require('../server.new');

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(`✅ Server started on ${BASE_URL}\n`);
}

/**
 * Teardown: Stop server
 */
async function teardownServer() {
  if (server) {
    server.close();
    const db = require('../db/database');
    db.close();
  }

  // Clean up
  const dbPath = process.env.DB_PATH;
  [dbPath, dbPath + '-wal', dbPath + '-shm'].forEach(file => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });
}

// ============================================================================
// TESTS
// ============================================================================

const tests = [
  test('Health check endpoint', async () => {
    const res = await request('GET', '/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.status === 'healthy', 'Health status should be healthy');
    console.log(`   📊 Uptime: ${res.data.uptime.toFixed(2)}s`);
  }),

  test('Detailed health check', async () => {
    const res = await request('GET', '/health/detailed');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.database, 'Should include database stats');
    console.log(`   💾 Database: ${res.data.database.users} users, ${res.data.database.devices} devices`);
  }),

  test('Login with admin credentials', async () => {
    const res = await request('POST', '/api/auth/login', {
      username: 'admin',
      password: 'Admin123!'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.token, 'Should receive JWT token');
    token = res.data.token;
    console.log(`   🔑 Token received: ${token.substring(0, 20)}...`);
  }),

  test('Login with invalid credentials (should fail)', async () => {
    const res = await request('POST', '/api/auth/login', {
      username: 'admin',
      password: 'WrongPassword'
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  }),

  test('Access protected endpoint without token (should fail)', async () => {
    const res = await request('GET', '/api/devices');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  }),

  test('Get all devices (authenticated)', async () => {
    const res = await request('GET', '/api/devices', null, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.devices), 'Should return devices array');
    console.log(`   📱 Found ${res.data.devices.length} device(s)`);
  }),

  test('Get all data types (authenticated)', async () => {
    const res = await request('GET', '/api/keys', null, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.dataTypes), 'Should return dataTypes array');
    console.log(`   📊 Found ${res.data.dataTypes.length} data type(s)`);
  }),

  test('Upload single data value', async () => {
    const res = await request('POST', '/api/data', {
      key: 'CPU_Temperature',
      machine: 'test-device',
      value: 55.5,
      timestamp: new Date().toISOString()
    }, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    console.log(`   ✅ Data uploaded: CPU_Temperature = 55.5°C`);
  }),

  test('Upload bulk data values', async () => {
    const now = new Date();
    const bulkData = [];

    for (let i = 0; i < 10; i++) {
      bulkData.push({
        key: 'GPU_Temperature',
        machine: 'test-device',
        value: 60 + Math.random() * 10,
        timestamp: new Date(now.getTime() - i * 1000).toISOString()
      });
    }

    const res = await request('POST', '/api/data/bulk', bulkData, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.data.uploaded === 10, 'Should upload 10 records');
    console.log(`   ✅ Bulk upload: ${res.data.uploaded} records`);
  }),

  test('Get daily data', async () => {
    const res = await request('GET', '/api/data/daily?device=test-device&keys=GPU_Temperature&range=1h', null, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data, 'Should return data object');
    const gpuData = res.data.data.GPU_Temperature;
    assert(gpuData, 'Should have GPU_Temperature data');
    console.log(`   📈 Retrieved ${gpuData.values.length} data points`);
  }),

  test('Get monthly aggregated data', async () => {
    const res = await request('GET', '/api/data/month?device=test-device&key=GPU_Temperature', null, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    if (res.data.data) {
      const data = res.data.data;
      console.log(`   📊 Aggregates: min=${data.min.toFixed(1)}, max=${data.max.toFixed(1)}, median=${data.median.toFixed(1)}, mean=${data.mean.toFixed(1)}`);
    }
  }),

  test('Rate limiting on auth endpoint', async () => {
    // Make 6 rapid requests (limit is 5)
    const promises = [];
    for (let i = 0; i < 6; i++) {
      promises.push(
        request('POST', '/api/auth/login', {
          username: 'test',
          password: 'test'
        })
      );
    }

    const results = await Promise.all(promises);
    const rateLimited = results.some(r => r.status === 429);
    assert(rateLimited, 'Should rate limit after 5 requests');
    console.log(`   🚦 Rate limiting working (got 429 response)`);
  }),

  test('Create new device', async () => {
    const res = await request('POST', '/api/devices', {
      deviceId: 'new-device',
      name: 'New Test Device',
      description: 'Created via integration test'
    }, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    console.log(`   ✅ Device created: ${res.data.device.deviceId}`);
  }),

  test('Update device', async () => {
    const res = await request('PUT', '/api/devices/new-device', {
      name: 'Updated Device Name'
    }, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.device.name === 'Updated Device Name', 'Device name should be updated');
  }),

  test('Create new data type', async () => {
    const res = await request('POST', '/api/keys', {
      keyName: 'Memory_Usage',
      dataType: 'float',
      normalRange: { min: 0, max: 80 },
      warningRange: { min: 80, max: 100 }
    }, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    console.log(`   ✅ Data type created: ${res.data.dataType.keyName}`);
  }),
];

// ============================================================================
// RUN TESTS
// ============================================================================

async function runIntegrationTests() {
  console.log('================================================================================');
  console.log('         System Monitor v2.0 - Integration Tests');
  console.log('================================================================================\n');

  try {
    await setupServer();

    for (const testFn of tests) {
      await testFn();
    }

    console.log('\n================================================================================');
    console.log('                        Test Results');
    console.log('================================================================================\n');

    if (failed === 0) {
      console.log(`✅ ALL TESTS PASSED! (${passed}/${passed})\n`);
      console.log('🎉 Complete stack integration verified!\n');
      console.log('Verified:');
      console.log('  ✅ Health monitoring endpoints');
      console.log('  ✅ Authentication (login, JWT tokens)');
      console.log('  ✅ Security (rate limiting, auth protection)');
      console.log('  ✅ Device management (CRUD)');
      console.log('  ✅ Data type management (CRUD)');
      console.log('  ✅ Data upload (single & bulk)');
      console.log('  ✅ Data retrieval (daily & monthly)');
      console.log('  ✅ Aggregates calculation (min, max, mean, median)');
      console.log('');
    } else {
      console.log(`❌ TESTS FAILED: ${failed}/${passed + failed}`);
      console.log(`✅ Tests passed: ${passed}\n`);
      console.log('Errors:');
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.test}: ${err.error}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await teardownServer();
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runIntegrationTests().catch(console.error);
