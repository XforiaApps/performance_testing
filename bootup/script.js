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
    scenarios: {
      rampUp: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
          { duration: '1m', target: 300 },  // Ramp up to 10,000 VUs in 1 minute
        //   { duration: '1m', target: 20000 },  // Ramp up to 20,000 VUs in the next minute
        //   { duration: '1m', target: 30000 },  // Ramp up to 30,000 VUs in the next minute
        //   { duration: '1m', target: 40000 },  // Ramp up to 40,000 VUs in the next minute
        //   { duration: '1m', target: 50000 },  // Ramp up to 50,000 VUs in the next minute
        ],
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
    verifySupervisorEmail(payload)
    return {
        accessToken,
        userId,
    };

}


export default function (userDetails) {
    const { accessToken, userId } = userDetails;
    bootup(accessToken, userId);
    sleep(1);
}