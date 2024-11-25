import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://parent-geenee-xforia-dev-999919612837.us-central1.run.app/';

export const options = {
  vus: 3, // Number of Virtual Users
  duration: '1m', // Test duration
};

export default function () {
  const data = { email: 'john-dev@xforia.com' };
  const headers = { 'Content-Type': 'application/json' };

  const otpRes = http.post(`${BASE_URL}/auth/email/request-otp`, JSON.stringify(data), {
    headers,
  });

  console.log(`Status Code: ${otpRes.status} - Response Body: ${otpRes.body}`);

  check(otpRes, {
    'OTP request successful (200)': (r) => r.status === 200,
    'Response contains success message': (r) =>
      r.json().message === 'OTP send successfully',
  });

  sleep(1); // Simulate think time
}
