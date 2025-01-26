import { sleep } from "k6";
import {
    generateDeviceDetails,
    generateRandomEmail,
    locationPayload,
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
} from "../loadTestHelpers/script.js";

import {
    generateCustomEmails,
    gps
} from "../utils/utils.js";

// Test configuration
export const options = {
    setupTimeout: '90m', // Allow setup to run for up to 90 minutes
    scenarios: {
        steadyLoad: {
            executor: "constant-arrival-rate",
            rate: 417, // ~417 users per second to reach 1,500,000 users in 1 hour
            timeUnit: "1s", // New users arrive every second
            duration: "1h", // Test duration of 1 hour
            preAllocatedVUs: 3000, // Pre-allocate 3000 VUs (adjust based on capacity)
            maxVUs: 20000, // Allow up to 20,000 VUs
        },
    },
    ext: {
        loadimpact: {
            name: "1,500,000 users over 1 hour",
        },
    },
};

export function setup() {
    const email = generateRandomEmail()
    // const userInfo = user.map((u) => {
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

        // Step 10: Create and verify child user
        const userVerifyPayload = createUserVerifyPayload(token, childId);
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
    // });

    // return userInfo;
}

export default function (userInfo) {
    // userInfo.forEach(async (userDetails) => {
        const { accessToken, childAccessToken } = userInfo;
      
        const wishPayload = {
          appId: 1,
        };
        
        makeAWish(childAccessToken, wishPayload);  // Ensure async call

        // Proceed only if the wish response does not indicate a pre-existing wish
        // if (wishResponse) {
        //   const grantWishPayload = {
        //     duration: 10,
        //     isGranted: true,
        //     isSupervisor: true,
        //   };
        //   grantWish(wishResponse.id, grantWishPayload, accessToken);
        //   const locationData = locationUpdate(childAccessToken, locationPayload)
        // }
    //   });

    sleep(1);
}
