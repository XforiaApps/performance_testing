import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://parent-geenee-xforia-dev-999919612837.us-central1.run.app/';

// Test configuration
export const options = {
  vus: 500, // Increased to 10 virtual users
  duration: '5m', // Test runs for 5 minutes
  ext: {
    loadimpact: {
      name: 'OTP Request Extended Load Test', // Name for identifying the test
    },
  },
};

// Helper function to generate random emails
function generateRandomEmail(domain = "xforia.com") {
  const randomString = Math.random().toString(36).substring(7);
  return `${randomString}-dev@${domain}`;
}

export default function () {
  // Generate a random email for each iteration
  const email = generateRandomEmail();
  
  // Test Case 1: Valid Email
  const validPayload = { email: email };
  const headers = { 'Content-Type': 'application/json' };

  // POST request to /auth/email/request-otp
  let validRes = http.post(`${BASE_URL}/auth/email/request-otp`, JSON.stringify(validPayload), {
    headers,
  });

  // Assertions for the valid response
  check(validRes, {
    'Valid Email: OTP request successful (200)': (r) => r.status === 200,
    'Valid Email: Response contains success message': (r) =>
      r.json().message === 'OTP send successfully',
  });

  // Test Case 2: Invalid Email
  const invalidPayload = { email: 'invalid-email' };
  let invalidRes = http.post(`${BASE_URL}/auth/email/request-otp`, JSON.stringify(invalidPayload), {
    headers,
  });

  // Assertions for the invalid response
  check(invalidRes, {
    'Invalid Email: OTP request fails (400)': (r) => r.status === 400,
    'Invalid Email: Response contains error message': (r) =>
      r.json().message === 'invalid email',
  });

  // Simulate think time between iterations
  sleep(1);
}
