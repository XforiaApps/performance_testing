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
    createUserVerifyPayload,
    verifyUser,
    makeAWish,
    grantWish,
} from "../loadTestHelpers/script.js";

// Constants
const TARGET_RPS = 1000;
const TEST_DURATION = "10m";
const WISH_DURATION = 1;  // 1 minute

export const options = {
    setupTimeout: "60m",
    scenarios: {
        high_load: {
            executor: "ramping-arrival-rate",
            preAllocatedVUs: 100,
            maxVUs: 1000,
            stages: [
                { duration: "1m", target: 100 },    // Ramp up to 100 RPS
                { duration: "2m", target: 500 },    // Ramp up to 500 RPS
                { duration: "5m", target: 1000 },   // Ramp up to 1000 RPS
                { duration: "2m", target: 1000 },   // Stay at 1000 RPS
            ],
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        http_req_failed: ['rate<0.01'],
    },
};

export function setup() {
    const users = [];
    const totalUsers = 1000;  // Create 1000 users for the test

    console.log(`Setting up ${totalUsers} users for load test`);
    
    for (let i = 0; i < totalUsers; i++) {
        try {
            const email = generateRandomEmail();
            
            // Parent user creation
            const otpResponse = requestOTP({ email });
            if (!otpResponse) {
                console.error(`Failed to request OTP for user ${i}`);
                continue;
            }

            const verifyResponse = verifyOTP({
                email,
                otp: "1234",
                device: generateDeviceDetails(),
            });

            if (!verifyResponse || !verifyResponse.json()) {
                console.error(`Failed to verify OTP for user ${i}`);
                continue;
            }

            const { tokens, user } = verifyResponse.json();
            const accessToken = tokens.accessToken;
            const userId = user.userId;

            // Update user profile
            updateUser(accessToken, userId);

            // Create and setup space
            const spaceResponse = createSpace(accessToken);
            if (!spaceResponse || !spaceResponse.json()) {
                console.error(`Failed to create space for user ${i}`);
                continue;
            }

            const spaceId = spaceResponse.json().id;
            const appsResponse = getAvailableApps(accessToken);
            
            updateSpace(
                spaceId, 
                updateSpacePayload(appsResponse), 
                accessToken
            );

            // Create child users
            const childAccessTokens = [];
            for (let j = 0; j < 16; j++) {
                try {
                    const qrResponse = requestQRCode(accessToken);
                    if (!qrResponse || !qrResponse.json()) {
                        console.error(`Failed to get QR code for child ${j} of user ${i}`);
                        continue;
                    }

                    const deepLink = qrResponse.json().deepLink;
                    const token = deepLink.match(/token=([^&]+)/)?.[1];

                    if (!token) {
                        console.error(`Failed to extract token from deepLink for child ${j} of user ${i}`);
                        continue;
                    }

                    const verifyPayload = createUserVerifyPayload(token);
                    const verifyUserResponse = verifyUser(verifyPayload, accessToken);

                    if (!verifyUserResponse || !verifyUserResponse.tokens) {
                        console.error(`Failed to verify child ${j} of user ${i}`);
                        continue;
                    }

                    childAccessTokens.push(verifyUserResponse.tokens.accessToken);
                } catch (error) {
                    console.error(`Error creating child ${j} for user ${i}: ${error.message}`);
                }
            }

            users.push({ accessToken, childAccessTokens });

            if ((i + 1) % 100 === 0) {
                console.log(`Created ${i + 1} users`);
            }
        } catch (error) {
            console.error(`Error creating user ${i}: ${error.message}`);
        }
    }

    console.log(`Successfully created ${users.length} users`);
    return users;
}

export default function (users) {
    if (!users || users.length === 0) {
        console.error('No users available for testing');
        return;
    }

    const userIndex = __VU % users.length;
    const user = users[userIndex];

    if (!user || !user.childAccessTokens || user.childAccessTokens.length === 0) {
        console.error(`Invalid user data for VU ${__VU}`);
        return;
    }

    try {
        for (let i = 0; i < user.childAccessTokens.length; i++) {

        // Select a random child user
        const childToken =  user.childAccessTokens[i];

        // Make wish
        const wishResponse = makeAWish(childToken, { 
            appId: 1,
            duration: WISH_DURATION
        });

        if (!wishResponse || !wishResponse.id) {
            console.error(`Failed to create wish for VU ${__VU}`);
            return;
        }

        // Small delay before granting wish
        sleep(1);  

        // Grant wish
        const grantResponse = grantWish(
            wishResponse.id, 
            {
                duration: WISH_DURATION,
                isGranted: true,
                isSupervisor: true
            }, 
            user.accessToken
        );

        if (!grantResponse) {
            console.error(`Failed to grant wish for VU ${__VU}`);
        }
    }
    } catch (error) {
        console.error(`Error in test iteration for VU ${__VU}: ${error.message}`);
    }
}