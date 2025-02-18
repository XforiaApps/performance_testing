import { sleep } from "k6";
import {
    requestOTP,
    verifyOTP,
    updateUser,
    createSpace,
    getAvailableApps,
    requestQRCode,
    updateSpace,
    verifyUser,
    inviteSupervisor,
    verifySupervisorEmail,
} from "../loadTestHelpers/script.js";
import { generateRandomEmail, generateDeviceDetails, generateRandomAlphabeticName, updateSpacePayload, } from "../utils/utils.js";


export const options = {
    setupTimeout: '10m', // Allow setup to run for up to 10 minutes
    scenarios: {
        steadyLoad: {
            executor: "constant-arrival-rate",
            rate: 5000, // ~417 users per second to reach 3,000,000 users in 2 hours
            timeUnit: "1s", // New users arrive every second
            duration: "5m", // Test duration of 2 hours
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
    const circleId = verifyRes.json().user.circleId

    return { accessToken, circleId }
}

export default function (userDetails) {
    const { accessToken, circleId } = userDetails;

    const supervisorName = generateRandomEmail();
    let payload = {
        email: generateRandomEmail(),
        name: supervisorName
    };

    const supervisorRes = inviteSupervisor(accessToken, payload);

    if (!supervisorRes || !supervisorRes.json) {
        console.error("Error: inviteSupervisor response is invalid");
        return;
    }

    const supervisorData = supervisorRes.json();
    const deepLinkSupervisor = supervisorData.deepLink;
    console.log("deepLinkSupervisor", deepLinkSupervisor)
    if (!deepLinkSupervisor) {
        console.error("Error: deepLinkSupervisor is missing in response");
        return;
    }
    const tokenSupervisor = deepLinkSupervisor.match(/token=([^&]+)/)?.[1];
    const hashedName = deepLinkSupervisor.match(/nameHash=([^&]+)/)?.[1];

    if (!tokenSupervisor || !hashedName) {
        console.error("Error: Missing token or hashed name from deepLinkSupervisor");
        return;
    }

    payload = {
        circleId,
        token: tokenSupervisor,
        name: hashedName
    };

    verifySupervisorEmail(payload);
}
