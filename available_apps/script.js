import { sleep } from "k6";
import {
    generateDeviceDetails,
    generateRandomEmail,
} from "../utils/utils.js";
import {
    requestOTP,
    verifyOTP,
    getAvailableApps,
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
    // const users = generateCustomEmails(2);
    // const userInfo = users.map((user) => {
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
            device: generateDeviceDetails()
        }
        // Step 2: Verify OTP
        const verifyRes = verifyOTP(validPayload);
        if (verifyRes.status !== 200) {
            console.error("Failed to verify OTP:", verifyRes.body);
            return;
        }

        const accessToken = verifyRes.json().tokens.accessToken;
        verifyRes.json().user.userId;

        return {accessToken}
    // })
    // return userInfo
}

export default function (userInfo) {
    // userInfo.forEach((user) => {
        const { accessToken } = userInfo;
        const params = { search: '', limit: 5, offset: 0 };
        getAvailableApps(accessToken, params);
    // });

    sleep(1);
}

