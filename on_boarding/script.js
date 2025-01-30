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

let childDeviceDetails = false

export const options = {
  scenarios: {
    rampUp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },  
      ],
    },
  },
};


export default function () {
  const email = generateRandomEmail();
  let validPayload = { email };

  // Step 1: Request OTP
  const otpRes = requestOTP(validPayload);
  if (otpRes.status !== 200) {
    console.error("Failed to request OTP:", otpRes.body);
    return;
  }
  sleep(Math.random() * 3); 

  validPayload = {
    email,
    otp: "1234",
    device: generateDeviceDetails(),
  };

  // Step 2: Verify OTP
  const verifyRes = verifyOTP(validPayload);
  if (verifyRes.status !== 200) {
    console.error("Failed to verify OTP:", verifyRes.body);
    return;
  }
  sleep(Math.random() * 3);

  const accessToken = verifyRes.json().tokens.accessToken;
  const userId = verifyRes.json().user.userId;

  // Step 3: Update User
  const updateRes = updateUser(accessToken, userId);
  if (updateRes.status !== 200) {
    console.error("Failed to update user:", updateRes.body);
    return;
  }
  sleep(Math.random() * 5);

  // Step 4: Create Space (if not already created)
  const spaceRes = createSpace(accessToken);
  if (spaceRes.status !== 200) {
    console.error("Failed to create space:", spaceRes.body);
    return;
  }
  sleep(Math.random() * 5)

  // Step 5: Get Available Apps
  const appsRes = getAvailableApps(accessToken);
  if (appsRes.status !== 200) {
    console.error("Failed to fetch available apps:", appsRes.body);
    return;
  }
  sleep(Math.random() * 5); 

  // Step 6: Update space
  const spaceId = spaceRes.json().id;
  updateSpace(spaceId, updateSpacePayload(appsRes), accessToken);
  sleep(Math.random() * 5);

  // Step 7: Request QR Code
  const qrRes = requestQRCode(accessToken);
  if (qrRes.status !== 200) {
    console.error("Failed to request QR code:", qrRes.body);
    return;
  }
  sleep(Math.random() * 7);

  const deepLink = qrRes.json().deepLink;
  const token = deepLink.match(/token=([^&]+)/)?.[1];  


  childDeviceDetails = generateDeviceDetails();
  const randomName = generateRandomAlphabeticName();
  const payload = {
    token,
    username: randomName ,
    device: childDeviceDetails,
  };
  const response = verifyUser(payload);
  const childId = response.user.userId
  const childAccessToken = response.tokens.accessToken
  updateUser(childAccessToken, childId)
  sleep(1);
}