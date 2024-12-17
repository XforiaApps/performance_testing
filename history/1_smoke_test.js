import http from "k6/http";
import { check, sleep } from "k6";
import {
  BASE_URL,
  otp,
  user,
  generateRandomAlphabeticName,
  generateChildDeviceDetails,
  generateDeviceDetails,
} from "../utils/source.js";

// Test configuration
export const options = {
  vus: 10,
  duration: "1m",
  ext: {
    loadimpact: {
      name: "smoke test",
    },
  },
};

export function setup() {
  const userInfo = user.map((u) => {
    // Test Case 1: Request a otp
    let validRes = http.post(
      `${BASE_URL}/auth/email/request-otp`,
      JSON.stringify({
        email: u.email,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    check(validRes, {
      "Valid Email: OTP request successful (200)": (r) => r.status === 200,
      "Valid Email: Response contains success message": (r) =>
        r.json().message === "OTP send successfully",
    });

    // Test Case 2: verify otp(login)
    let verifyRes = http.post(
      `${BASE_URL}/auth/email/verify-otp`,
      JSON.stringify({
        email: u.email,
        otp: otp,
        device: generateDeviceDetails(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const accessToken = verifyRes.json().tokens.accessToken; // access token
    // console.log("accessToken", accessToken)
    const userId = verifyRes.json().user.userId; // userId
    const deviceId = verifyRes.json().device.id;
    check(verifyRes, {
      "Verify OTP: OTP verification successful (200)": (r) => r.status === 200,
      "Verify OTP: Response contains user data": (r) => {
        const user = r.json().user;
        return user && user.userId && user.email && user.circleId && user.role;
      },
      "Verify OTP: Response contains space data": (r) => {
        const space = r.json().space;
        return (
          space &&
          space.id &&
          space.type &&
          space.name &&
          space.beacon &&
          space.beacon.id
        );
      },
      "Verify OTP: Response contains device data": (r) => {
        const device = r.json().device;
        return (
          device &&
          device.id &&
          device.os &&
          device.appVersion &&
          device.metadata
        );
      },
      "Verify OTP: Response contains tokens": (r) => {
        const tokens = r.json().tokens;
        return tokens && tokens.accessToken && tokens.refreshToken;
      },
      "Verify OTP: User is new or existing": (r) => {
        return r.json().isNewUser === false || r.json().isNewUser === true;
      },
    });

    // Test Case 3: Enter Parent name
    let updateRes = http.put(
      `${BASE_URL}/user/${userId}`,
      JSON.stringify({
        name: generateRandomAlphabeticName(8),
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const parentName = updateRes.json().name;
    //console.log("update user:", updateRes.json());
    check(updateRes, {
      "User Update: Response contains updated user data": (r) => {
        const updatedUser = r.json();

        return (
          updatedUser &&
          updatedUser.name &&
          updatedUser.id &&
          updatedUser.role &&
          (updatedUser.isManaged === true || updatedUser.isManaged === false) &&
          Array.isArray(updatedUser.rules)
        );
      },
      "User Update: Response contains device data": (r) => {
        const deviceArray = r.json().device;
        if (
          !deviceArray ||
          !Array.isArray(deviceArray) ||
          deviceArray.length === 0
        ) {
          console.error("Device data is missing or empty:", deviceArray);
          return false;
        }

        const device = deviceArray[0];
        return (
          device &&
          device.id &&
          device.os &&
          device.appVersion &&
          device.metadata &&
          device.metadata.model &&
          device.metadata.osVersion &&
          device.metadata.deviceName &&
          device.metadata.batteryLevel !== undefined &&
          device.permissions &&
          device.permissions.location &&
          device.permissions.camera &&
          device.permissions.bluetooth &&
          device.permissions.pushNotification
        );
      },
      "User Update: Response contains rules data": (r) => {
        const rules = r.json().rules;
        if (!Array.isArray(rules)) {
          return false;
        }
        return true;
      },
    });

    // Test Case 4: Request QR Code for Login
    const qrCodeRes = http.get(`${BASE_URL}/user/login-qr`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    //console.log("qr code", qrCodeRes.json());
    const deepLink = qrCodeRes.json().deepLink;
    const token = deepLink.match(/token=([^&]+)/)?.[1];

    //console.log("Token:", token);
    check(qrCodeRes, {
      "QR Code Login: Response status 200 (OK)": (r) => r.status === 200,
      "QR Code Login: Response contains QR code URL": (r) =>
        r.json().qrcode !== null,
      "QR Code Login: Response contains deep link": (r) =>
        r.json().deepLink !== null,
    });

    //  // Test Case 5: Getting users using token
    const authUsersResponse = http.get(`${BASE_URL}/auth/users/${token}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    //console.log("token verfiy", authUsersResponse.json());
    check(authUsersResponse, {
      "Response contains child user array": (r) => Array.isArray(r.json()),
      "Child users array is empty or has the expected properties": (r) => {
        const users = r.json();
        return (
          Array.isArray(users) &&
          (users.length === 0 || users.every((u) => u.id && u.name && u.role))
        );
      },
    });

    const randomName = generateRandomAlphabeticName(5);
    const userVerifyPayload = {
      username: randomName,
      device: generateChildDeviceDetails(),
      token,
    };

    // Test Case 6: create a child user
    const userVerify = http.post(
      `${BASE_URL}/auth/user/verify`,
      JSON.stringify(userVerifyPayload),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const childAccessToken = userVerify.json().tokens.accessToken;
    const childUserId = userVerify.json().user.userId;
    const childDeviceId = userVerify.json().device.id;
    //console.log("userVerify", userVerify.json());
    check(userVerify, {
      "user verify: Response status 200 (OK)": (r) => r.status === 200,
      "user verify: Response contains user data": (r) => {
        const user = r.json().user;
        return (
          user &&
          user.userId &&
          user.role &&
          user.name &&
          typeof user.isManaged === "boolean"
        );
      },
      "user verify: Response contains device data": (r) => {
        const device = r.json().device;
        return (
          device &&
          device.id &&
          device.os &&
          device.appVersion &&
          device.metadata &&
          device.permissions
        );
      },
      "user verify: Response contains tokens": (r) => {
        const tokens = r.json().tokens;
        return tokens && tokens.accessToken && tokens.refreshToken;
      },
    });
    return {
      accessToken,
      userId,
      parentName,
      deviceId,
      childAccessToken,
      childUserId,
      childDeviceId,
    };
  });

  //console.log("userInfo", userInfo);
  return userInfo;
}

export default function (userInfo) {
  // Test Case 1: Get wish history
  userInfo.forEach((userDetails) => {
    const { accessToken, userId, deviceId, childUserId, childDeviceId } =
      userDetails;

    const params = {
      limit: 10,
      offset: 0,
    };
    const wishHistory = http.get(
      `${BASE_URL}/wish-history?limit=${params.limit}&offset=${params.offset}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    //console.log("Wish history", wishHistory.json())
    check(wishHistory, {
      "Wish History: response status 200 (OK)": (r) => r.status === 200,
      "Wish History response": (r) => {
        const wishes = r.json();
        return wishes.every((wish) => {
          return (
            wish.id &&
            wish.wishId &&
            wish.appId &&
            wish.userId &&
            wish.appName &&
            wish.deviceInfo &&
            wish.deviceInfo.deviceId &&
            wish.deviceInfo.deviceName &&
            wish.deviceInfo.os &&
            wish.deviceInfo.osVersion &&
            wish.deviceInfo.model &&
            wish.username &&
            wish.circleId &&
            typeof wish.isGranted === "boolean" &&
            wish.status &&
            wish.createdAt &&
            wish.updatedAt &&
            (wish.duration === null || typeof wish.duration === "number") &&
            (!wish.expiredAt || typeof wish.expiredAt === "string")
          );
        });
      },
    });
    

    // Test Case 2: Get space history
    const circleHistory = http.get(
      `${BASE_URL}/circle-history?limit=${params.limit}&offset=${params.offset}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    //console.log("circleHistory", circleHistory.json());
    check(circleHistory, {
      "Get all space history: response status 200 (OK)": (r) =>
        r.status === 200,
      "Get all space history response": (r) => {
        const spaceHistory = r.json();

        if (Array.isArray(spaceHistory) && spaceHistory.length === 0) {
          return true;
        }
        return (
          Array.isArray(spaceHistory) &&
          spaceHistory.every(
            (sh) =>
              sh.id &&
              sh.userId &&
              sh.circleId &&
              sh.name &&
              sh.role &&
              sh.deviceId &&
              sh.deviceOs &&
              sh.spaceId &&
              sh.spaceName &&
              sh.spaceType &&
              sh.eventType &&
              sh.eventData &&
              sh.eventData.name &&
              sh.eventData.status &&
              Array.isArray(sh.allowApps) &&
              Array.isArray(sh.blockedApps) &&
              sh.createdAt &&
              sh.updatedAt
          )
        );
      },
    });

    // Test Case 3: Get space history by userId
    const userCircleHistory = http.get(
      `${BASE_URL}//user/${childUserId}/device/${childDeviceId}/history?limit=${params.limit}&offset=${params.offset}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    // console.log("userCircleHistory", userCircleHistory.json())
    check(userCircleHistory, {
      "Get all space history: response by user status 200 (OK)": (r) =>
        r.status === 200,
      "Get all space history response by user": (r) => {
        const spaceHistory = r.json();

        if (Array.isArray(spaceHistory) && spaceHistory.length === 0) {
          return true;
        }
        return (
          Array.isArray(spaceHistory) &&
          spaceHistory.every(
            (sh) =>
              sh.id &&
              sh.userId &&
              sh.circleId &&
              sh.name &&
              sh.role &&
              sh.deviceId &&
              sh.deviceOs &&
              sh.spaceId &&
              sh.spaceName &&
              sh.spaceType &&
              sh.eventType &&
              sh.eventData &&
              sh.eventData.name &&
              sh.eventData.status &&
              Array.isArray(sh.allowApps) &&
              Array.isArray(sh.blockedApps) &&
              sh.createdAt &&
              sh.updatedAt
          )
        );
      },
    });
  });

  sleep(1);
}
