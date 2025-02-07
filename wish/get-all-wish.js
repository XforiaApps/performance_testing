import { sleep } from "k6";
import {
    generateDeviceDetails,
    generateRandomEmail,
    updateSpacePayload,
} from "../utils/utils.js";
import {
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
    makeAWish,
    grantWish,
    createDevice,
    locationUpdate,
    getWishes,
} from "../loadTestHelpers/script.js";

export const options = {
    setupTimeout: '10m', // Allow setup to run for up to 10 minutes
    scenarios: {
        steadyLoad: {
            executor: "constant-arrival-rate",
            rate: 7000, // ~417 users per second to reach 3,000,000 users in 2 hours
            timeUnit: "1s", // New users arrive every second
            duration: "1m", // Test duration of 2 hours
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
        device: generateDeviceDetails(),
    }

    // Step 2: Verify OTP
    const verifyRes = verifyOTP(payload);
    const accessToken = verifyRes.json().tokens.accessToken;
    const userId = verifyRes.json().user.userId;


    // Step 3: Update parent name
    updateUser(accessToken, userId);

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


    // Step 10: Create and verify child user
    const wishPayload = {
        appId: 1,
    };
    const userVerifyPayload1 = createUserVerifyPayload(token);
    const userVerifyResponse1 = verifyUser(userVerifyPayload1, accessToken);
    const childAccessToken1 = userVerifyResponse1.tokens.accessToken;
    makeAWish(childAccessToken1, wishPayload)

    const userVerifyPayload2 = createUserVerifyPayload(token);
    const userVerifyResponse2 = verifyUser(userVerifyPayload2, accessToken);
    const childAccessToken2 = userVerifyResponse2.tokens.accessToken;
    makeAWish(childAccessToken2, wishPayload)

    const userVerifyPayload3 = createUserVerifyPayload(token);
    const userVerifyResponse3 = verifyUser(userVerifyPayload3, accessToken);
    const childAccessToken3 = userVerifyResponse3.tokens.accessToken;
    makeAWish(childAccessToken3, wishPayload)

    const userVerifyPayload4 = createUserVerifyPayload(token);
    const userVerifyResponse4 = verifyUser(userVerifyPayload4, accessToken);
    const childAccessToken4 = userVerifyResponse4.tokens.accessToken;
    makeAWish(childAccessToken4, wishPayload)


    const userVerifyPayload5 = createUserVerifyPayload(token);
    const userVerifyResponse5 = verifyUser(userVerifyPayload5, accessToken);
    const childAccessToken5 = userVerifyResponse5.tokens.accessToken;
    makeAWish(childAccessToken5, wishPayload)


    return {
        accessToken,
    };
}

export default async function (userInfo) {
    const { accessToken } = userInfo;

    getWishes(accessToken)
    sleep(1);
}
