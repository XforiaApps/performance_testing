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

export const options = {
    setupTimeout: '10m', // Allow setup to run for up to 10 minutes
    scenarios: {
        steadyLoad: {
            executor: "constant-arrival-rate",
            rate: 7000, // ~417 users per second to reach 3,000,000 users in 2 hours
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

export function setup() {
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

    return { accessToken }

}

export default function (userInfo) {
    const { accessToken } = userInfo;
    const params = { search: '', limit: 20, offset: 0 };
    getAvailableApps(accessToken, params);

    sleep(1);
}

