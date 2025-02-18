
import { sleep } from "k6";
import {
  generateDeviceDetails, generateRandomEmail, updateSpacePayload
} from "../utils/utils.js";
import { createSpace, getAvailableApps, requestOTP, updateSpace, updateUser, verifyOTP } from "../loadTestHelpers/script.js";

export const options = {
  setupTimeout: '10m', // Allow setup to run for up to 10 minutes
  scenarios: {
    steadyLoad: {
      executor: "constant-arrival-rate",
      rate: 2000, // ~417 users per second to reach 3,000,000 users in 2 hours
      timeUnit: "1s", // New users arrive every second
      duration: "5m", // Test duration of 2 hours
      preAllocatedVUs: 3000, // Pre-allocate enough VUs to handle the load
      maxVUs: 5000, // Allow up to 5000 VUs for peak concurrency
    },
  },
  ext: {
    loadimpact: {
      name: "3,000,000 users over 2 hours",
    },
  },
};

let parentDeviceDetails = null, spaceCreated = null

export function setup() {

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
  return {
    accessToken,
    spaceId
  };
}

export default function (userInfo) {
  const { accessToken,spaceId } =
    userInfo;
 
  const appsRes = getAvailableApps(accessToken);
  if (appsRes.status !== 200) {
    console.error("Failed to fetch available apps:", appsRes.body);
    return;
  }
  updateSpace(spaceId, updateSpacePayload(appsRes), accessToken)

  sleep(1); // Wait for 1 second before the next iteration
}
