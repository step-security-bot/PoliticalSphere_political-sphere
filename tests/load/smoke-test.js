import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1, // 1 virtual user for smoke test
  duration: '30s',

  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests should be below 1500ms
    http_req_failed: ['rate<0.1'], // Error rate should be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // Test homepage
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    'homepage status is 200': r => r.status === 200,
    'homepage response time < 1000ms': r => r.timings.duration < 1000,
  });

  // Test API health endpoint
  response = http.get(`${BASE_URL}/api/health`);
  check(response, {
    'API health status is 200': r => r.status === 200,
    'API health response time < 500ms': r => r.timings.duration < 500,
  });

  sleep(1);
}
