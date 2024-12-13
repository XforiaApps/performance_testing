import http from "k6/http";
import { check, sleep } from "k6";
import {
  BASE_URL,
  makeWishPayload,
  grantWishPayload,
  generateRandomAlphabeticName,
  deviceDetails,
} from "../utils/utils.js";

// Test configuration
export const options = {
  vus: 2,
  duration: "1m",
  ext: {
    loadimpact: {
      name: "smoke test",
    },
  },
};
const accessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MzIxMzhiNS01OGQ4LTQ0NjMtYjcwOS1iMjJjYmQ3Y2IxNDEiLCJ0b2tlblR5cGUiOiJhY2Nlc3MiLCJyb2xlIjpbInByaW1hcnkiXSwiZGV2aWNlSWQiOiJhOGE2ZmE1NDZkYjMwZjhiIiwiaWF0IjoxNzM0MDcxNzkyLCJleHAiOjE3MzY2NjM3OTJ9.fGXmuAkfkWZHs5XS5fxQ-QveP0VltPpZnHw-ReqpWiE";
const childAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4ZjFjNDlmOC0xODQ1LTRkYTgtODYyZi1iODkyNTM0OGY4MDkiLCJ0b2tlblR5cGUiOiJhY2Nlc3MiLCJyb2xlIjpbImJhc2ljIl0sImRldmljZUlkIjoic3RyaW5nIiwiaWF0IjoxNzM0MDk3NzU2LCJleHAiOjE3MzY2ODk3NTZ9.M1p0gwTO5KBx2KSGSJ3Lm13ZiDMSpNLcU4UhuYTrgAw";

export default function () {
  // Test Case 6: Request QR Code for Login
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

  // Test Case 7: Getting users using token
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
    device: deviceDetails,
    token,
  };

  // Test Case 8: create a child user
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
  const userId = userVerify.json().user.userId;
  const childAccessToken = userVerify.json().tokens.accessToken;

  // Test Case 1: Make a wish
  let wishRes = http.post(
    `${BASE_URL}/make-a-wish`,
    JSON.stringify(makeWishPayload),
    {
      headers: {
        Authorization: `Bearer ${childAccessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  const wishId = wishRes.json().id;
  //console.log("wishRes", wishRes.json());
  check(wishRes, {
    "Response status is 200": (r) => r.status === 200,
    "Make a wish: Response contains wish id": (r) => {
      const wish = r.json();
      return wish.id;
    },
  });

  // Test Case 2: Get all wishes
  const param = {
    status: "",
  };
  const getWishes = http.get(`${BASE_URL}/get-wishes?search=${param.status}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  //console.log("Get all wishes", getWishes.json())
  check(getWishes, {
    "Get all wishes: response status 200 (OK)": (r) => r.status === 200,
    "Get all wishes response": (r) => {
      const wishes = r.json();
      return wishes.every(
        (wish) =>
          wish.id &&
          wish.appId &&
          wish.appName &&
          wish.iosBundleId &&
          wish.androidPackageName &&
          Array.isArray(wish.domainName) &&
          wish.userId &&
          wish.deviceInfo &&
          wish.deviceInfo.deviceId &&
          wish.deviceInfo.deviceName &&
          wish.deviceInfo.os &&
          wish.deviceInfo.osVersion &&
          wish.deviceInfo.model &&
          wish.userName &&
          wish.circleId &&
          typeof wish.isGranted === "boolean" &&
          typeof wish.isSupervisor === "boolean" &&
          wish.status &&
          wish.createdAt &&
          wish.updatedAt &&
          (wish.duration === null || typeof wish.duration === "number") &&
          (!wish.expiredAt || typeof wish.expiredAt === "string")
      );
    },
  });

  //const userId = getWishes.json().userId;
  // Test Case 3: Get wishes by userId
  const getWisheByUserId = http.get(
    `${BASE_URL}/get-wishes/${userId}?search=${param.status}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  //console.log("getWisheByUserId", getWisheByUserId.json())
  check(getWisheByUserId, {
    "Get wishes by userId: response status 200 (OK)": (r) => r.status === 200,
    "Get wishes by userId: validate response": (r) => {
      const wishes = r.json();
      if (Array.isArray(wishes)) {
        return wishes.every(
          (wish) =>
            wish.id &&
            wish.appId &&
            wish.appName &&
            wish.iosBundleId &&
            wish.androidPackageName &&
            Array.isArray(wish.domainName) &&
            wish.userId &&
            wish.deviceInfo &&
            wish.userName &&
            wish.circleId &&
            wish.isGranted !== undefined &&
            wish.isSupervisor !== undefined &&
            wish.status &&
            wish.createdAt &&
            wish.updatedAt
        );
      } else {
        console.error("Response is not an array:", wishes);
        return false;
      }
    },
  });

  // Test Case 4: Grant a wish
  let grantWishRes = http.post(
    `${BASE_URL}/grant-wish/${wishId}`,
    JSON.stringify(grantWishPayload),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  check(grantWishRes, {
    "Grant Wish: OTP request successful (200)": (r) => r.status === 200,
    "Grant Wish: Response contains success message": (r) =>
      r.json().message === "Wish has been granted",
  });

  sleep(1);
}
