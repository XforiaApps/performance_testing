import { sleep } from "k6";
import {
  requestOTP,
  verifyOTP,
  updateUser,
  createSpace,
  getAvailableApps,
  requestQRCode,
  updateSpace,
  verifyUser,
} from "../loadTestHelpers/script.js";
import { generateRandomEmail, generateDeviceDetails, generateRandomAlphabeticName, updateSpacePayload, } from "../utils/utils.js";

let childDeviceDetails = false

export const options = {
  scenarios: {
    rampUpTo60k: {
      executor: 'ramping-vus',
      startVUs: 0, // Start with 0 virtual users
      stages: [
        { duration: '5m', target: 50000 }, // Ramp up to 10k VUs in 2 minutes
        // { duration: '5m', target: 50000 }, // Ramp up to 20k VUs in 2 minutes
      ],
    },
  },
  tags: {
    name: "load_test",  // Use a static name instead of dynamic high-cardinality values
  },
};

// export const options = {
//   setupTimeout: '10m', // Allow setup to run for up to 10 minutes
//   scenarios: {
//       steadyLoad: {
//           executor: "constant-arrival-rate",
//           rate: 7000, // ~417 users per second to reach 3,000,000 users in 2 hours
//           timeUnit: "1s", // New users arrive every second
//           duration: "5m", // Test duration of 2 hours
//           preAllocatedVUs: 1000, // Pre-allocate enough VUs to handle the load
//           maxVUs: 5000, // Allow up to 5000 VUs for peak concurrency
//       },
//   },
//   ext: {
//       loadimpact: {
//           name: "5000 request per second",
//       },
//   },
// };


export default function() {
  const email = generateRandomEmail();
  let validPayload = { email };

  const otpRes = requestOTP(validPayload);
  if (otpRes.status !== 200) {
    console.error("Failed to request OTP:", otpRes.body);
    return;
  }
  sleep(2); 

  validPayload = {
    email,
    otp: "1234",
    device: generateDeviceDetails(),
  };

  const verifyRes = verifyOTP(validPayload);
  if (verifyRes.status !== 200) {
    console.error("Failed to verify OTP:", verifyRes.body);
    return;
  }
  sleep(3); 

  const accessToken = verifyRes.json().tokens.accessToken;
  const userId = verifyRes.json().user.userId;

  const updateRes = updateUser(accessToken, userId);
  if (updateRes.status !== 200) {
    console.error("Failed to update user:", updateRes.body);
    return;
  }
  sleep(3); 

  const spaceRes = createSpace(accessToken);
  if (spaceRes.status !== 200) {
    console.error("Failed to create space:", spaceRes.body);
    return;
  }
  sleep(3); 

  const appsRes = getAvailableApps(accessToken);
  if (appsRes.status !== 200) {
    console.error("Failed to fetch available apps:", appsRes.body);
    return;
  }
  sleep(3); 

  const spaceId = spaceRes.json().id;
  updateSpace(spaceId, updateSpacePayload(appsRes), accessToken);
  sleep(3); 

  const qrRes = requestQRCode(accessToken);
  if (qrRes.status !== 200) {
    console.error("Failed to request QR code:", qrRes.body);
    return;
  }
  sleep(3); 

  const deepLink = qrRes.json().deepLink;
  const token = deepLink.match(/token=([^&]+)/)?.[1];  


  childDeviceDetails = generateDeviceDetails();
  const randomName = generateRandomAlphabeticName();
  const payload = {
    token,
    username: randomName ,
    device: childDeviceDetails,
  };
  sleep(3)
  const response = verifyUser(payload);
  const childId = response.user.userId
  const childAccessToken = response.tokens.accessToken
  updateUser(childAccessToken, childId)
  sleep(1);
}