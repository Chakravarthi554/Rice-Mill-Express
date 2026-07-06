import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ──────────────────────────────────────────────────────────
const errorRate = new Rate('errors');
const healthLatency = new Trend('health_latency', true);
const productLatency = new Trend('product_latency', true);
const authLatency = new Trend('auth_latency', true);

// ─── Configuration ───────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001';

export const options = {
  // Ramp-up scenario: gradually increase load
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 virtual users
    { duration: '1m', target: 50 },    // Hold at 50 VUs for 1 minute
    { duration: '30s', target: 100 },  // Spike to 100 VUs
    { duration: '1m', target: 100 },   // Sustain peak load
    { duration: '30s', target: 0 },    // Ramp down gracefully
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95th percentile < 500ms
    http_req_failed: ['rate<0.05'],      // Error rate < 5%
    errors: ['rate<0.05'],               // Custom error rate < 5%
    health_latency: ['p(99)<200'],       // Health check always fast
    product_latency: ['p(95)<400'],      // Product listing under 400ms
  },
};

// ─── Setup: Create a test user token (optional) ──────────────────────────────
export function setup() {
  // Attempt login to get a JWT for authenticated endpoints
  const loginPayload = JSON.stringify({
    email: __ENV.TEST_EMAIL || 'test@ricemill.com',
    password: __ENV.TEST_PASSWORD || 'Test@123456',
  });

  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  let token = null;
  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body);
      token = body.token || body.accessToken;
    } catch (e) {
      console.log('Login response not JSON, skipping auth tests');
    }
  }

  return { token };
}

// ─── Main Test Scenario ──────────────────────────────────────────────────────
export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (data.token) {
    headers['Authorization'] = `Bearer ${data.token}`;
  }

  // ── Group 1: Health Check ──────────────────────────────────────────────────
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/api/v1/health`, { headers });
    healthLatency.add(res.timings.duration);

    const passed = check(res, {
      'health status 200': (r) => r.status === 200,
      'health response has status OK': (r) => {
        try {
          return JSON.parse(r.body).status === 'OK';
        } catch (e) {
          return false;
        }
      },
      'health response time < 200ms': (r) => r.timings.duration < 200,
    });
    errorRate.add(!passed);
  });

  sleep(0.5);

  // ── Group 2: Product Listing (Public, no auth required) ────────────────────
  group('Product Listing', () => {
    const res = http.get(`${BASE_URL}/api/v1/products?page=1&limit=10`, { headers });
    productLatency.add(res.timings.duration);

    const passed = check(res, {
      'products status 200': (r) => r.status === 200,
      'products has body': (r) => r.body && r.body.length > 0,
      'products response time < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(!passed);
  });

  sleep(0.5);

  // ── Group 3: Single Product Detail ─────────────────────────────────────────
  group('Product Detail', () => {
    // First get the product list to find a real product ID
    const listRes = http.get(`${BASE_URL}/api/v1/products?page=1&limit=1`, { headers });

    if (listRes.status === 200) {
      try {
        const body = JSON.parse(listRes.body);
        const products = body.products || body.data || [];
        if (products.length > 0) {
          const productId = products[0]._id;
          const detailRes = http.get(`${BASE_URL}/api/v1/products/${productId}`, { headers });

          const passed = check(detailRes, {
            'product detail status 200': (r) => r.status === 200,
            'product detail has name': (r) => {
              try {
                const p = JSON.parse(r.body);
                return p.name || (p.data && p.data.name);
              } catch (e) {
                return false;
              }
            },
          });
          errorRate.add(!passed);
        }
      } catch (e) {
        // Products not available, skip
      }
    }
  });

  sleep(0.5);

  // ── Group 4: Auth - Login (rate-limited, so be careful) ────────────────────
  group('Auth Login', () => {
    const payload = JSON.stringify({
      email: `loadtest_${__VU}@ricemill.com`,
      password: 'WrongPassword123',
    });

    const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, { headers });
    authLatency.add(res.timings.duration);

    // We expect 401 (invalid creds) — NOT 500 or timeout
    const passed = check(res, {
      'auth returns 401 for bad creds': (r) => r.status === 401,
      'auth response time < 1s': (r) => r.timings.duration < 1000,
    });
    errorRate.add(!passed);
  });

  sleep(1);

  // ── Group 5: Authenticated Endpoints (only if token available) ─────────────
  if (data.token) {
    group('Authenticated - Cart', () => {
      const res = http.get(`${BASE_URL}/api/v1/cart`, { headers });

      const passed = check(res, {
        'cart status 200': (r) => r.status === 200,
        'cart response time < 500ms': (r) => r.timings.duration < 500,
      });
      errorRate.add(!passed);
    });

    sleep(0.5);

    group('Authenticated - Orders', () => {
      const res = http.get(`${BASE_URL}/api/v1/orders?page=1&limit=5`, { headers });

      const passed = check(res, {
        'orders status 200': (r) => r.status === 200,
        'orders response time < 500ms': (r) => r.timings.duration < 500,
      });
      errorRate.add(!passed);
    });

    sleep(0.5);

    group('Authenticated - Notifications', () => {
      const res = http.get(`${BASE_URL}/api/v1/notifications`, { headers });

      const passed = check(res, {
        'notifications status 200 or 401': (r) => r.status === 200 || r.status === 401,
      });
      errorRate.add(!passed);
    });
  }

  sleep(1);
}

// ─── Teardown ────────────────────────────────────────────────────────────────
export function teardown(data) {
  console.log('Load test complete.');
  if (data.token) {
    console.log('Authenticated tests were included.');
  } else {
    console.log('Only public endpoint tests were run (no valid auth token).');
  }
}
