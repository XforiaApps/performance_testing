import { sleep } from "k6";
import {
  requestOTP,
  verifyOTP,
  updateUser,
  createSpace,
  getAvailableApps,
  requestQRCode,
  updateSpace,
  checkIfChildAlreadyExists,
  verifyUser,
} from "../loadTestHelpers/script.js";
import { generateRandomEmail, generateDeviceDetails, generateRandomAlphabeticName, updateSpacePayload, } from "../utils/utils.js";

let childUserId = false;
let childDeviceDetails = false

export const options = {
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        // Ramp up from 0 to 100k users over 20 seconds
        { duration: '20s', target: 100000 },
        // Stay at 100k users for 1 minute
        { duration: '1m', target: 100000 },
        // Graceful ramp down over 10 seconds
        { duration: '10s', target: 0 }
      ],
    },
  },
  // Thresholds for monitoring test health
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should complete within 2s
    http_req_failed: ['rate<0.01'],    // Less than 1% of requests should fail
  },
  // Ensure enough time for setup
  setupTimeout: '2m',
  // Test metadata
  ext: {
    loadimpact: {
      name: '100k Concurrent Users Load Test',
      notes: 'High concurrency test with 100k VUs for 1 minute'
    },
  },
};




export default function () {
  const email = generateRandomEmail()
  let validPayload = { email }
  // Step 1: Request OTP
  const otpRes = requestOTP(validPayload);
  if (otpRes.status !== 200) {
    console.error("Failed to request OTP:", otpRes.body);
    return;
  }
  validPayload = {
    email,
    otp: "1234",
    device: generateDeviceDetails(),
  }
  // Step 2: Verify OTP
  const verifyRes = verifyOTP(validPayload);
  if (verifyRes.status !== 200) {
    console.error("Failed to verify OTP:", verifyRes.body);
    return;
  }

  const accessToken = verifyRes.json().tokens.accessToken;
  const userId = verifyRes.json().user.userId;

  // Step 3: Update User
  const updateRes = updateUser(accessToken, userId);
  if (updateRes.status !== 200) {
    console.error("Failed to update user:", updateRes.body);
    return;
  }

  // Step 4: Create Space (if not already created)

  const spaceRes = createSpace(accessToken);
  if (spaceRes.status !== 200) {
    console.error("Failed to create space:", spaceRes.body);
    return;
  }

  // Step 5: Get Available Apps
  const appsRes = getAvailableApps(accessToken);
  if (appsRes.status !== 200) {
    console.error("Failed to fetch available apps:", appsRes.body);
    return;
  }
  // Step 6: Update space
  const spaceId = spaceRes.json().id;

  updateSpace(spaceId, updateSpacePayload(appsRes), accessToken)


  // Step 6: Request QR Code
  const qrRes = requestQRCode(accessToken);
  if (qrRes.status !== 200) {
    console.error("Failed to request QR code:", qrRes.body);
    return;
  }

  const deepLink = qrRes.json().deepLink;
  const token = deepLink.match(/token=([^&]+)/)?.[1];

  if (!childUserId) {
    childUserId = checkIfChildAlreadyExists(token, accessToken)
  }

  childDeviceDetails = generateDeviceDetails();

  const randomName = generateRandomAlphabeticName()
  const payload = {
    token,
    userId: childUserId,
    username: !childUserId ? randomName : undefined,
    device: childDeviceDetails,
  };
  verifyUser(payload, accessToken)
  sleep(1);
}

