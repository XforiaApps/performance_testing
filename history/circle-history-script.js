import { sleep } from "k6";
import {
    generateDeviceDetails,
    generateRandomAlphabeticName,
    generateRandomEmail,
    getLocationPayload,
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
    getWishHistory,
    getCirlceHistory,
    locationUpdate,
} from "../loadTestHelpers/script.js";

export const options = {
    setupTimeout: '10m', // Allow setup to run for up to 10 minutes
    scenarios: {
        steadyLoad: {
            executor: "constant-arrival-rate",
            rate: 900, // ~417 users per second to reach 3,000,000 users in 2 hours
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

        // Step 10: Create and verify child user
        const randomName = generateRandomAlphabeticName();
        const childDeviceDetails = generateDeviceDetails();
        payload = {
            token,
            username: randomName,
            device: childDeviceDetails,
        };
        const userVerifyResponse = verifyUser(payload, accessToken)
    
        const childUserId = userVerifyResponse.user.userId
        const childAccessToken = userVerifyResponse.tokens.accessToken;

        const landmarkId = spaceRes.json().id

        const space1 = createSpace(accessToken, 'room', landmarkId);
        if(space1) {
            locationUpdate(childAccessToken, getLocationPayload(space1.json().id, 'enter'))
        }
       

        const space2 = createSpace(accessToken, 'room', landmarkId)
        if(space2) {
            const data = locationUpdate(childAccessToken, getLocationPayload(space2.json().id, 'exit'))
        }

        const space3 = createSpace(accessToken, 'room', landmarkId)
        if(space3) {
            locationUpdate(childAccessToken, getLocationPayload(space3.json().id, 'enter'))
        }

        const space4 = createSpace(accessToken, 'room', landmarkId)
        if(space4) {
            locationUpdate(childAccessToken, getLocationPayload(space4.json().id, 'exit'))
        }

        return {
            accessToken,
            userId,
            parentName,
            childAccessToken,
            childUserId,
            childDeviceId: childDeviceDetails.id
        };

    // return userInfo;
}

export default function (userInfo) {
    const params = { limit: 100, offset: 0 };
    getCirlceHistory(userInfo, params);
    // });

    sleep(1);
}
