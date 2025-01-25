import { sleep } from "k6";
import {
    generateDeviceDetails,
    updateSpacePayload,
} from "../utils/utils.js";
import {
    bootup,
    requestOTP,
    verifyOTP,
    updateUser,
    createSpace,
    getAvailableApps,
    updateSpace,
    requestQRCode,
    checkIfChildAlreadyExists,
    createUserVerifyPayload,
    verifyUser,
} from "../loadTestHelpers/script.js";

import {
    generateCustomEmails,
} from "../utils/utils.js";

export const options = {
    setupTimeout: '90m', // Allow setup to run for up to 90 minutes
    scenarios: {
      steadyLoad: {
        executor: "constant-arrival-rate",
        rate: 84, // ~84 users per second to reach 300,000 users in 1 hour
        timeUnit: "1s", // New users arrive every second
        duration: "1h", // Test duration of 1 hour
        preAllocatedVUs: 1000, // Pre-allocate 1000 VUs (adjust based on capacity)
        maxVUs: 10000, // Allow up to 10,000 VUs
      },
    },
    ext: {
      loadimpact: {
        name: "300,000 users over 1 hour",
      },
    },
};


const user = generateCustomEmails(100)
export function setup() {
    let childDeviceDetails = null;
    const userInfo = user.map((u) => {
        let payload = {
            email: u.email
        }
        // Step 1: Request OTP
        requestOTP(payload);

        payload = {
            email: u.email,
            otp: "1234",
            device: generateDeviceDetails()
        }
        // Step 2: Verify OTP
        const verifyRes = verifyOTP(payload);
        const accessToken = verifyRes.json().tokens.accessToken;
        const userId = verifyRes.json().user.userId;

        // Step 3: Update parent name
        const updateRes = updateUser(accessToken, userId);
        const parentName = updateRes.json().name;

        // Step 4: Create Space (only if not created)
        const spaceRes = createSpace(accessToken);
        
        // Check if spaceRes is valid and has the required properties
        if (!spaceRes || !spaceRes.json() || !spaceRes.json().id) {
            console.error("Failed to create space or space ID is missing.");
            return null; // Prevent returning incomplete userInfo
        }

        // Step 5: Get available apps
        const appsRes = getAvailableApps(accessToken);

        // Step 6: Update space with apps
        const spaceId = spaceRes.json().id;
        updateSpace(spaceId, updateSpacePayload(appsRes), accessToken);

        // Step 7: Request QR Code for Login
        const qrCodeRes = requestQRCode(accessToken);
        const deepLink = qrCodeRes.json().deepLink;
        const token = deepLink.match(/token=([^&]+)/)?.[1];

        // Step 8: Check existing child
        let childId = checkIfChildAlreadyExists(token, accessToken);

        // Step 9: Create child device details if not exists
        childDeviceDetails = generateDeviceDetails();

        // Step 10: Create and verify child user
        const userVerifyPayload = createUserVerifyPayload(token, childId, childDeviceDetails);
        const userVerifyResponse = verifyUser(userVerifyPayload, accessToken);
        const childAccessToken = userVerifyResponse.json().tokens.accessToken;
        const childUserId = userVerifyResponse.json().user.userId;

        return {
            accessToken,
            userId,
            parentName,
            childAccessToken,
            childUserId,
        };
    }).filter((info) => info !== null); // Filter out invalid user info

    return userInfo;
}


export default function (userInfo) {
    userInfo.forEach((userDetails) => {
        const { accessToken, userId } = userDetails;
        bootup(accessToken, userId);
    });

    sleep(1);
}