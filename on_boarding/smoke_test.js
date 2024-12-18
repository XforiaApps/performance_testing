import http from "k6/http";
import { check, sleep } from "k6";
import {
  BASE_URL,
  otp,
  generateRandomBeacon,
  gps,
  meta,
  apps,
  user,
  generateRandomAlphabeticName,
  generateChildDeviceDetails,
  generateDeviceDetails,
} from "../utils/source.js";

// Test configuration
export const options = {
  vus: 100,
  duration: "1m",
  ext: {
    loadimpact: {
      name: "smoke test",
    },
  },
};

export default function setup() {
  user.map((u) => {
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

    // Test Case 4: Create Space

    const beacon = generateRandomBeacon();
    //  console.log("Generated Beacon:", JSON.stringify(beacon));
    const randomSpaceName = generateRandomAlphabeticName(6);
    const spacePayload = {
      name: randomSpaceName,
      type: "room",
      gps,
      beacon: {
        beaconType: "fixed",
        ...beacon,
        meta,
      },
    };

    const spaceRes = http.post(
      `${BASE_URL}/spaces`,
      JSON.stringify(spacePayload),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    //console.log("space details", spaceRes.json());
    check(spaceRes, {
      "Space Create: Contains space ID": (r) => r.json().id !== undefined,
      "Space Create: Contains space name": (r) => r.json().name !== null,
      "Space Create: Contains GPS data (optional)": (r) => {
        const gps = r.json().gps;
        return !gps || (gps.lat && gps.lng && gps.radius && gps.address);
      },
      "Space Create: Contains beacons (optional)": (r) => {
        const response = r.json();
        const beacons = response.beacon;

        if (response.type === "room") {
          if (!Array.isArray(beacons) || beacons.length === 0) {
            return false;
          }
          return beacons.every((beacon) => {
            return (
              beacon.id &&
              beacon.beaconType &&
              beacon.uuid &&
              beacon.major &&
              beacon.minor &&
              beacon.meta &&
              beacon.meta.firmwareVersion &&
              beacon.meta.manufacturer &&
              beacon.meta.batteryLevel &&
              beacon.meta.rssi &&
              beacon.meta.location &&
              beacon.meta.tags
            );
          });
        } else if (response.type === "landmark") {
          return true;
        } else {
          return false;
        }
      },
    });

    // Test Case 5 :  GET request to /available-apps
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

    // Test Case 6: Add Apps to the Space (Using PATCH request)
    const spaceId = spaceRes.json().id;

    const updateSpacePayload = {
      name: randomSpaceName,
      type: "room",
      gps,
      beacon: {
        beaconType: "fixed",
        ...beacon,
        meta,
      },
      ...apps,
    };
    // console.log("spaceId", spaceId);
    const updateSpaceRes = http.patch(
      `${BASE_URL}/spaces/${spaceId}`,
      JSON.stringify(updateSpacePayload),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    //console.log("update space", updateSpaceRes.json());
    check(updateSpaceRes, {
      "Space Update: Apps added successfully (200)": (r) => r.status === 200,
      "Space Update: Response contains updated space data": (r) => {
        const space = r.json();
        return (
          space &&
          space.id &&
          (Array.isArray(space.apps) || space.apps === null)
        );
      },
    });

    // Test Case 7: Request QR Code for Login
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

    // Test Case 8: Getting users using token
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

    // Test Case 9: create a child user
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
    const childAccessToken = userVerify.json().tokens.accessToken;
    const childUserId = userVerify.json().user.userId;
    const childDeviceId = userVerify.json().device.id;

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
  //return userInfo

  sleep(1);
}
