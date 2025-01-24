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

// Test configuration
export const options = {
    vus: 100000, // 100k virtual users
    duration: "1h", // 1 hour test duration
    setupTimeout: "10m", // Allow up to 1 hour for setup to complete
    ext: {
        loadimpact: {
            name: "API Test Suite for 100k Users",
        },
    },
};

const user = generateCustomEmails(1000)
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
    }).filter((info) => info !== null);
    return userInfo;
}

export default function (userInfo) {
    userInfo.forEach((userDetails) => {
        const { accessToken, userId } = userDetails;
        bootup(accessToken, userId);
    });

    sleep(1);
}