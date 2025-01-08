import http from "k6/http";
import { check, sleep } from "k6";
import {
  BASE_URL,
  validPayload,
  verifyPayload,
  updatePayload,
  generateRandomBeacon,
  generateUUID,
  gps,
  meta,
  apps,
  deviceDetails,
  generateDeviceDetails,
  generateRandomAlphabeticName,
} from "../utils/utils.js";

let childUserId = null;
let spaceCreated = false;
let parentDeviceDetails = null;
let childDeviceDetails = null;

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 10000 }, // Ramp-up to 200 VUs over 1 minute
    { duration: "3m", target: 10000 }, // Maintain 200 VUs for 5 minutes
    { duration: "30s", target: 0 },   // Ramp-down to 0 VUs over 1 minute
  ],
};

export default function () {
  // Test Case 1: Request a otp
  let validRes = http.post(
    `${BASE_URL}/auth/email/request-otp`,
    JSON.stringify(validPayload),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if(validRes.status !== 200) {
    console.log("status", validRes.status, "payload",validPayload, "response", validRes.json())
  }
  check(validRes, {
    "Valid Email: OTP request successful (200)": (r) => r.status === 200,
    "Valid Email: Response contains success message": (r) =>
      r.json().message === "OTP send successfully",
  });

  if (!parentDeviceDetails) {
    parentDeviceDetails = generateDeviceDetails();
  }

  sleep (100);
  
  // Test Case 2: verify otp(login)
  let verifyRes = http.post(
    `${BASE_URL}/auth/email/verify-otp`,
    JSON.stringify({
      ...verifyPayload,
      device: parentDeviceDetails,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if(verifyRes.status !== 200) {
    console.log("status = ", verifyRes.status, ", paload = ",verifyPayload, ", response = ", verifyRes.json())
  }
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
        device && device.id && device.os && device.appVersion && device.metadata
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

  const accessToken = verifyRes.json().tokens.accessToken; // access token

  const userId = verifyRes.json().user.userId; // userId

  // Test Case 3: Enter Parent name
  let updateRes = http.put(
    `${BASE_URL}/user/${userId}`,
    JSON.stringify(updatePayload),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  if(updateRes.status !== 200) {
    console.log("paload",updatePayload)
    console.log("response", updateRes.json())
  }
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
  if (!spaceCreated) {
    const beacon = generateRandomBeacon();
    //  console.log("Generated Beacon:", JSON.stringify(beacon));
    const randomSpaceName = generateRandomAlphabeticName(6);
    const spacePayload = {
      name: randomSpaceName,
      landmarkId : generateUUID(),
      type: "room",
      gps,
      beacon: {
        beaconType: "fixed",
        ...beacon,
        meta,
      },
    };

    // Test Case 4: Create Space
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
    if(spaceRes.status !== 200) {
      console.log("paload",spacePayload)
      console.log("response", spaceRes.json())
    }
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

    sleep (100);
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

    const updateSpacePayload = {
      name: randomSpaceName,
      beacon: {
        beaconType: "fixed",
        ...beacon,
        meta,
      },
      ...apps,
    };

    sleep (100);
    // Test Case 6: Add Apps to the Space (Using PATCH request)
    const spaceId = spaceRes.json().id;
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
    if(updateSpaceRes.status !== 200) {
      console.log("paload",updateSpacePayload)
      console.log("response", updateSpaceRes.json())
    }
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
  }
  spaceCreated = true;
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

  if (!childUserId) {
    // Step 1: Check if the child user already exists
    const existingUsersResponse = http.get(`${BASE_URL}/auth/users/${token}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const existingUsers = existingUsersResponse.json();

    if (
      Array.isArray(existingUsers) &&
      existingUsers.length > 0 &&
      existingUsers[0].id
    ) {
      childUserId = existingUsers[0].id;
      console.log(`Using existing child user with ID: ${childUserId}`);
    } else {
      console.log("No existing child user found. A new user will be created.");
    }
  }
  if (!childDeviceDetails) {
    childDeviceDetails = generateDeviceDetails();
  }
  const randomName = generateRandomAlphabeticName(5);

  const userVerifyPayload = {
    token,
    userId: childUserId,
    username: !childUserId ? randomName : undefined,
    device: childDeviceDetails,
  };

  sleep (100);
  const userVerifyResponse = http.post(
    `${BASE_URL}/auth/user/verify`,
    JSON.stringify(userVerifyPayload),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  if(userVerifyResponse.status !== 200) {
    console.log("paload",userVerifyPayload)
    console.log("response", userVerifyResponse.json())
  }
  check(userVerifyResponse, {
    "User Verify: Response status is 200": (r) => r.status === 200,
    "User Verify: Response contains user data": (r) => {
      const user = r.json().user;
      if (user) {
        childUserId = user.userId;
        return user.userId && user.name && user.role;
      }
      return false;
    },
    "User Verify: Response contains device data": (r) => {
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
    "User Verify: Response contains tokens": (r) => {
      const tokens = r.json().tokens;
      return tokens && tokens.accessToken && tokens.refreshToken;
    },
  });

  sleep(100);
}
