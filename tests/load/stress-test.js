import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 },   // Warm up
    { duration: '1m', target: 50 },   // Ramp up
    { duration: '2m', target: 100 },  // Load
    { duration: '2m', target: 200 },  // Stress
    { duration: '2m', target: 300 },  // Breaking point
    { duration: '1m', target: 0 },    // Cool down
  ],

  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2000ms
    http_req_failed: ['rate<0.2'], // Allow higher error rate during stress
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // Heavy API usage simulation
  const requests = [
    ['GET', `${BASE_URL}/api/bills`],
    ['GET', `${BASE_URL}/api/parties`],
    ['GET', `${BASE_URL}/api/users/profile`],
    ['POST', `${BASE_URL}/api/search`, JSON.stringify({ query: 'democracy' })],
  ];

  requests.forEach(([method, url, body]) => {
    const response = method === 'GET'
      ? http.get(url)
      : http.post(url, body, { headers: { 'Content-Type': 'application/json' } });

    check(response, {
      [`${method} ${url} status is 200`: (r) => r.status === 200,
    });
  });

  sleep(Math.random() * 2 + 0.5); // Random sleep between 0.5-2.5 seconds
}
