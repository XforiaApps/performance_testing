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
    vus: 2,
    duration: "1m",
    setupTimeout: "2m",
    ext: {
        loadimpact: {
            name: "API Test Suite",
        },
    },
};

export function setup() {
    const users = generateCustomEmails(2);
    const userInfo = users.map((user) => {
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
    })
    return userInfo
}

export default function (userInfo) {
    userInfo.forEach((user) => {
        const { accessToken } = user;
        const params = { search: '', limit: 5, offset: 0 };
        getAvailableApps(accessToken, params);
    });

    sleep(1);
}

