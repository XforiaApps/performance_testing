import { sleep } from "k6";
import {
    generateDeviceDetails,
    generateRandomAlphabeticName,
    generateRandomEmail,
    getLocationPayload,
    updateSpacePayload,
} from "../utils/utils.js";
import {
    requestOTP,
    verifyOTP,
    updateUser,
    createSpace,
    getAvailableApps,
    updateSpace,
    createUserVerifyPayload,
    verifyUser,
    locationUpdate,
    requestQRCode,
} from "../loadTestHelpers/script.js";

export const options = {
    setupTimeout: '10m', // Allow setup to run for up to 10 minutes
    scenarios: {
        steadyLoad: {
            executor: "constant-arrival-rate",
            rate: 3000, // ~417 users per second to reach 3,000,000 users in 2 hours
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

// const user = generateCustomEmails(100)
export function setup() {
    const email = generateRandomEmail()
    let payload = {
        email
    }
    // Step 1: Request OTP
    requestOTP(payload);

    payload = {
        email,
        otp: "1234",
        device: generateDeviceDetails()
    }
    // Step 2: Verify OTP
    const verifyRes = verifyOTP(payload);
    const accessToken = verifyRes.json().tokens.accessToken;
    const userId = verifyRes.json().user.userId;

    // Step 3: Update parent name
    const updateRes = updateUser(accessToken, userId);

    // Step 4: Create Space (only if not created)
    const spaceRes = createSpace(accessToken);

    // add one more room space beacon

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

    // Step 9: Create child device details if not exists
    const childDeviceDetails = generateDeviceDetails();
    const randomName = generateRandomAlphabeticName();
    payload = {
        token,
        username: randomName,
        device: childDeviceDetails,
    };

    // Step 10: Create and verify child user
    const userVerifyResponse = verifyUser(payload);
    const childAccessToken = userVerifyResponse.tokens.accessToken;

    return {
        childAccessToken,
        spaceId
    };

}

let state = 'enter'
export default function (userInfo) {
    const { childAccessToken, spaceId } = userInfo
    if (state === 'enter') {
        locationUpdate(childAccessToken, getLocationPayload(spaceId, 'enter'))
    } else {
        locationUpdate(childAccessToken, getLocationPayload(spaceId, 'exit'))
    }

    sleep(1);
}
