import { sleep } from "k6";
import {
    generateDeviceDetails,
    generateRandomAlphabeticName,
    generateRandomEmail,
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
    verifyUser,
    inviteSupervisor,
    verifySupervisorEmail,
    requestQRCode,
} from "../loadTestHelpers/script.js";

export const options = {
    setupTimeout: '10m', // Allow setup to run for up to 10 minutes
    scenarios: {
        steadyLoad: {
            executor: "constant-arrival-rate",
            rate: 7000, // ~417 users per second to reach 3,000,000 users in 2 hours
            timeUnit: "1s", // New users arrive every second
            duration: "1m", // Test duration of 2 hours
            preAllocatedVUs: 1000, // Pre-allocate enough VUs to handle the load
            maxVUs: 2000, // Allow up to 5000 VUs for peak concurrency
        },
    },
    ext: {
        loadimpact: {
            name: "5000 request per second",
        },
    },
};
export function setup() {
    const email = generateRandomEmail()

    let payload = { email }
    requestOTP(payload);

    payload = {
        email,
        otp: "1234",
        device: generateDeviceDetails()
    }

    const verifyRes = verifyOTP(payload);
    const accessToken = verifyRes.json().tokens.accessToken;
    const userId = verifyRes.json().user.userId;

    updateUser(accessToken, userId);

    const space1 = createSpace(accessToken, 'landmark');
    const space2 = createSpace(accessToken, 'room', space1.json().id);
    const space3 = createSpace(accessToken, 'room', space1.json().id)

    const appsRes = getAvailableApps(accessToken);

    const spaceId1 = space1.json().id;
    const spaceId2 = space2.json().id;
    const spaceId3 = space3.json().id

    updateSpace(spaceId1, updateSpacePayload(appsRes), accessToken);
    updateSpace(spaceId2, updateSpacePayload(appsRes), accessToken);
    updateSpace(spaceId3, updateSpacePayload(appsRes), accessToken);

    const qrRes = requestQRCode(accessToken);
    
    const deepLink = qrRes.json().deepLink;
    const token = deepLink.match(/token=([^&]+)/)?.[1];

    const randomName = generateRandomAlphabeticName();
    const childDeviceDetails = generateDeviceDetails();
    payload = {
        token,
        username: randomName,
        device: childDeviceDetails,
    };
    verifyUser(payload)

    const supervisorName = generateRandomEmail()
    payload = {
        email: generateRandomEmail(),
        name: supervisorName
    }
    const supervisorRes = inviteSupervisor(accessToken, payload)
    const circleId = verifyRes.json().user.circleId
    const deepLinkSupervisor = supervisorRes.json().deepLink;
    const tokenSupervisor = deepLinkSupervisor.match(/token=([^&]+)/)?.[1];
    const hashedName = deepLinkSupervisor.match(/nameHash=([^&]+)/)?.[1];
    payload = {
        circleId,
        token: tokenSupervisor,
        name: hashedName
    }
    const user = verifySupervisorEmail(payload)
    return {
        accessToken,
        userId,
    };

}


export default function (userDetails) {
    const { accessToken, userId } = userDetails;
    const res = bootup(accessToken, userId);
    sleep(1);
}