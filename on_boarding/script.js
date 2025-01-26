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
import { generateRandomEmail, generateDeviceDetails, generateRandomAlphabeticName, generateRandomBeacon, meta, apps, updateSpacePayload, } from "../utils/utils.js";

let spaceCreated = false;
let childUserId = false;
let childDeviceDetails = false

export const options = {
  scenarios: {
    steadyLoad: {
      executor: "constant-arrival-rate",
      rate: 28, // 28 requests per second (this will generate ~100,000 requests in 1 hour)
      timeUnit: "1s", // New requests arrive every second
      duration: "1h", // Test duration of 1 hour
      preAllocatedVUs: 250, // Pre-allocate 250 VUs (this can be adjusted)
      maxVUs: 2500, // Allow up to 2,500 VUs
    },
  },
  ext: {
    loadimpact: {
      name: "100,000 requests over 1 hour (approx. 100,000 target)",
    },
  },
};


export default function () {
  const email =  generateRandomEmail()
  let validPayload = {email}
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
  if (!spaceCreated) {
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
    spaceCreated = true;
  }

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

