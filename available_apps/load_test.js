import http from "k6/http";
import { check, sleep } from "k6";

import {
  BASE_URL,
  otp,
  user,
  generateRandomAlphabeticName,
  generateChildDeviceDetails,
  generateRandomBeacon,
  gps,
  meta,
  apps,
  generateDeviceDetails,
} from "../utils/source.js";

let childUserId = null;
let spaceCreated = false;
let parentDeviceDetails = null;
let childDeviceDetails = null;

// Test configuration
export const options = {
  stages: [
    { duration: "1m", target: 200 }, // Ramp-up to 200 VUs over 1 minute
    { duration: "5m", target: 200 }, // Maintain 200 VUs for 5 minutes
    { duration: "1m", target: 0 },   // Ramp-down to 0 VUs over 1 minute
  ],
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

    // check(validRes, {
    //   "Valid Email: OTP request successful (200)": (r) => r.status === 200,
    //   "Valid Email: Response contains success message": (r) =>
    //     r.json().message === "OTP send successfully",
    // });

    if (!parentDeviceDetails) {
      parentDeviceDetails = generateDeviceDetails();
    }

    // Test Case 2: verify otp(login)
    let verifyRes = http.post(
      `${BASE_URL}/auth/email/verify-otp`,
      JSON.stringify({
        email: u.email,
        otp: otp,
        device: parentDeviceDetails,
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
    return {accessToken}
    // check(verifyRes, {
    //   "Verify OTP: OTP verification successful (200)": (r) => r.status === 200,
    //   "Verify OTP: Response contains user data": (r) => {
    //     const user = r.json().user;
    //     return user && user.userId && user.email && user.circleId && user.role;
    //   },
    //   "Verify OTP: Response contains space data": (r) => {
    //     const space = r.json().space;
    //     return (
    //       space &&
    //       space.id &&
    //       space.type &&
    //       space.name &&
    //       space.beacon &&
    //       space.beacon.id
    //     );
    //   },
    //   "Verify OTP: Response contains device data": (r) => {
    //     const device = r.json().device;
    //     return (
    //       device &&
    //       device.id &&
    //       device.os &&
    //       device.appVersion &&
    //       device.metadata
    //     );
    //   },
    //   "Verify OTP: Response contains tokens": (r) => {
    //     const tokens = r.json().tokens;
    //     return tokens && tokens.accessToken && tokens.refreshToken;
    //   },
    //   "Verify OTP: User is new or existing": (r) => {
    //     return r.json().isNewUser === false || r.json().isNewUser === true;
    //   },
    // });
  });

  //console.log("userInfo", userInfo);
  return userInfo;
}

export default function (userInfo) {
  
  userInfo.map((user) => {
    const {accessToken} = user
    // GET request to /available-apps
    const params = {
      search: "",
      limit: 5,
      offset: 0,
    };

    const res = http.get(
      `${BASE_URL}/available-apps?search=${params.search}&limit=${params.limit}&offset=${params.offset}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    check(res, {
      "Response status is 200": (r) => r.status === 200,
      "Response contains apps array": (r) => Array.isArray(r.json().apps),
      "Apps array has the expected properties": (r) => {
        const apps = r.json().apps;
        return apps.every(
          (app) =>
            app.id &&
            app.name &&
            app.iosBundleId &&
            app.androidPackageName &&
            app.developerName &&
            Array.isArray(app.domainName) &&
            app.domainName.length > 0
        );
      },
      "Apps array respects the limit parameter": (r) =>
        r.json().apps.length <= params.limit,
    });
  })
  sleep(1);
}
