import http from "k6/http";
import { check, sleep } from "k6";
import {
  BASE_URL,
  generateRandomBeacon,
  generateRandomAlphabeticName,
  gps,
  meta,
  apps,
  deviceDetails,
  devicePayload,
  makeWishPayload,
  grantWishPayload,
  updateDevicePayload,
  updateDevicePermissionPayload,
  updatePayload,
  unInstallPayload,
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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTljYzMzOC1mYmFjLTRiNzItOTEwMy04ZmE4Y2VhNDZhY2MiLCJ0b2tlblR5cGUiOiJhY2Nlc3MiLCJyb2xlIjpbInByaW1hcnkiXSwiZGV2aWNlSWQiOiJzcmluaXZhczEiLCJpYXQiOjE3MzM5OTMwMjMsImV4cCI6MTczNjU4NTAyM30.F8GjsaUEbMzhDRh8YEly5ap2y4s6oTWk6NxQu7k5_dk";

export default function () {
  // Test Case 1: Create Space
  const beacon = generateRandomBeacon();
  //  console.log("Generated Beacon:", JSON.stringify(beacon));
  const randomSpaceName = generateRandomAlphabeticName(6);
  const spacePayload = {
    name: randomSpaceName,
    landmarkId: "1234",
    type: "room",
    ...gps,
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
  const spaceId = spaceRes.json().id;
  // Test Case 2 :  GET request to /available-apps
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

  // Test Case 4: Get a space details
  const getSpaceRes = http.get(`${BASE_URL}/spaces/${spaceId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  //console.log("space details", getSpaceRes.json());
  check(getSpaceRes, {
    "Get a space by id: Contains space ID": (r) => r.json().id !== undefined,
    "Get a space by id: Contains space name": (r) => r.json().name !== null,
    "Get a space by id: Contains GPS data (optional)": (r) => {
      const gps = r.json().gps;
      return !gps || (gps.lat && gps.lng && gps.radius && gps.address);
    },
    "Get a space by id: Contains beacons (optional)": (r) => {
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

  // Test Case 5: Get all spaces
  const getAllSpaceRes = http.get(`${BASE_URL}/spaces`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  //console.log("space details", getAllSpaceRes.json());
  check(getAllSpaceRes, {
    "Response status is 200": (r) => r.status === 200,
    "All spaces have required fields": (r) => {
      const spaces = r.json();
      return spaces.every((space) => {
        return (
          space.id &&
          space.name &&
          space.type &&
          space.isManaged !== undefined &&
          space.landmarkId !== undefined && // Allow null for `landmarkId`
          space.allow !== undefined &&
          (space.gps === null ||
            (space.gps.lat !== undefined && space.gps.lng !== undefined)) &&
          (Array.isArray(space.beacon) || space.beacon === null) &&
          (Array.isArray(space.apps) || space.apps === null)
        );
      });
    },
  });

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
  //console.log("child token:", childAccessToken)
  // Test Case 9: update a user
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
  //console.log("update user:", updateRes.json());
  check(updateRes, {
    "User Update: Response contains updated user data": (r) => {
      const updatedUser = r.json();
      return (
        updatedUser &&
        updatedUser.name === updatePayload.name &&
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

  // Test Case 10: Get a  user by id
  let getRes = http.get(`${BASE_URL}/user/${userId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  //console.log("update user:", updateRes.json());
  check(getRes, {
    "Get a user: Response contains  user data": (r) => {
      const getRes = r.json();
      return (
        getRes &&
        getRes.name &&
        getRes.id &&
        getRes.role &&
        (getRes.isManaged === true || getRes.isManaged === false) &&
        Array.isArray(getRes.rules)
      );
    },
    "User: Response contains device data": (r) => {
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
    "User : Response contains rules data": (r) => {
      const rules = r.json().rules;
      if (!Array.isArray(rules)) {
        return false;
      }
      return true;
    },
  });

  // // Test Case: Get all users
  // let getAllRes = http.get(`${BASE_URL}/users`, {
  //     headers: {
  //       Authorization: `Bearer ${accessToken}`,
  //       "Content-Type": "application/json",
  //     }
  //   });

  //   if (!getAllRes || !getAllRes.body) {
  //     console.error("Request Failed: The response body is null or the request timed out.");
  //   } else {
  //     try {
  //       const users = getAllRes.json();
  //       console.log("Get all users:", users);

  //       check(getAllRes, {
  //         "Response status is 200": (r) => r.status === 200,
  //         "All users: Response contains valid users": (r) => {
  //           if (!Array.isArray(users) || users.length === 0) {
  //             console.error("Users data is missing or invalid:", users);
  //             return false;
  //           }

  //           return users.every((user) => {
  //             return (
  //               user.id &&
  //               user.name &&
  //               user.role &&
  //               (user.isManaged === true || user.isManaged === false) &&
  //               Array.isArray(user.rules) &&
  //               user.rules.every((rule) => {
  //                 return (
  //                   rule.id &&
  //                   rule.spaceId &&
  //                   rule.allow !== undefined &&
  //                   rule.space &&
  //                   rule.space.id &&
  //                   rule.space.name &&
  //                   rule.space.type &&
  //                   (rule.space.gps === null || (rule.space.gps.lat !== undefined && rule.space.gps.lng !== undefined)) &&
  //                   (Array.isArray(rule.space.beacon) || rule.space.beacon === null) &&
  //                   (Array.isArray(rule.apps) || rule.apps === null)
  //                 );
  //               }) &&
  //               Array.isArray(user.device) &&
  //               user.device.every((device) => {
  //                 return (
  //                   device.id &&
  //                   device.os &&
  //                   device.appVersion &&
  //                   device.metadata &&
  //                   device.metadata.model &&
  //                   device.metadata.osVersion &&
  //                   device.metadata.deviceName &&
  //                   device.metadata.batteryLevel !== undefined &&
  //                   device.permissions &&
  //                   device.permissions.location &&
  //                   device.permissions.camera &&
  //                   device.permissions.bluetooth &&
  //                   device.permissions.pushNotification &&
  //                   device.permissions.localNotification &&
  //                   device.permissions.screenTime &&
  //                   device.permissions.nearby &&
  //                   device.permissions.motionActivity
  //                 );
  //               })
  //             );
  //           });
  //         },
  //       });
  //     } catch (error) {
  //       console.error("Error parsing JSON response:", error);
  //     }
  //   }

  // Test Case 12: create a new device
  const deviceRes = http.post(
    `${BASE_URL}/users/${userId}/devices`,
    JSON.stringify({
      ...devicePayload,
      deviceId: Math.random().toString(36).substring(7),
    }),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  //console.log("device Info", deviceRes.json());
  check(deviceRes, {
    "create a device: Response status 200 (OK)": (r) => r.status === 200,
    "create a device response: Response contains device data": (r) => {
      const device = r.json();
      return (
        device &&
        device.id &&
        device.os &&
        device.appVersion &&
        device.metadata &&
        device.permissions
      );
    },
  });
  const deviceId = deviceRes.json().id;

  // Test Case 13: update a device
  const updateDeviceRes = http.put(
    `${BASE_URL}/users/${userId}/devices/${deviceId}`,
    JSON.stringify(updateDevicePayload),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  //console.log("userVerify", userVerify.json());
  check(updateDeviceRes, {
    "update device: Response status 200 (OK)": (r) => r.status === 200,
    "update device response: Response contains device data": (r) => {
      const device = r.json();
      return (
        device &&
        device.id &&
        device.os &&
        device.appVersion &&
        device.metadata &&
        device.permissions
      );
    },
  });

  //   // Test Case 14: update a device permissions
  //   const updateDevicePermRes = http.put(
  //     `${BASE_URL}/users/${userId}/devices/${deviceId}/update-permission`,
  //     JSON.stringify(updateDevicePermissionPayload),
  //     {
  //       headers: {
  //         Authorization: `Bearer ${accessToken}`,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  //   console.log("permission payload", JSON.stringify(updateDevicePermissionPayload))
  //   console.log("updateDevicePermRes", updateDevicePermRes.json());
  //   check(updateDevicePermRes, {
  //     "update device permissions: Response status 200 (OK)": (r) => r.status === 200,
  //     "update device response permissions: Response contains device data": (r) => {
  //       const device = r.json();
  //       return device && device.id && device.os && device.permissions;
  //     },
  //   });

  // Test Case 15: Get a device information
  const getDeviceRes = http.get(
    `${BASE_URL}/users/${userId}/devices/${deviceId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  //console.log("userVerify", userVerify.json());
  check(getDeviceRes, {
    "Get a  device: Response status 200 (OK)": (r) => r.status === 200,
    "Get a  device response: Response contains device data": (r) => {
      const device = r.json();
      return (
        device &&
        device.id &&
        device.os &&
        device.appVersion &&
        device.metadata &&
        device.permissions
      );
    },
  });

  // Test Case 16: Get all device by user information
  const getAllDeviceRes = http.get(`${BASE_URL}/users/${userId}/devices`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  //console.log("userVerify", userVerify.json());
  check(getAllDeviceRes, {
    "Get all devices by userId: Response status 200 (OK)": (r) =>
      r.status === 200,
    "Get all  device by userId response: Response contains device data": (
      r
    ) => {
      const device = r.json();
      return device.every(
        (d) => d && d.id && d.os && d.appVersion && d.metadata && d.permissions
      );
    },
  });

  //   // Test Case 17: Make a wish
  //   let wishRes = http.post(
  //     `${BASE_URL}/make-a-wish`,
  //     JSON.stringify(makeWishPayload),
  //     {
  //       headers: {
  //         Authorization: `Bearer ${childAccessToken}`,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  //   const wishId = wishRes.json().id;
  //   //console.log("wishRes", wishRes.json());
  //   check(wishRes, {
  //     "Response status is 200": (r) => r.status === 200,
  //     "Make a wish: Response contains wish id": (r) => {
  //       const wish = r.json();
  //       return wish.id;
  //     },
  //   });

  //   // Test Case 18: Get all wishes
  //   const param = {
  //     status: "",
  //   };
  //   const getWishes = http.get(`${BASE_URL}/get-wishes?search=${param.status}`, {
  //     headers: {
  //       Authorization: `Bearer ${accessToken}`,
  //       "Content-Type": "application/json",
  //     },
  //   });
  //   //console.log("Get all wishes", getWishes.json())
  //   check(getWishes, {
  //     "Get all wishes: response status 200 (OK)": (r) => r.status === 200,
  //     "Get all wishes response": (r) => {
  //       const wishes = r.json();
  //       return wishes.every(
  //         (wish) =>
  //           wish.id &&
  //           wish.appId &&
  //           wish.appName &&
  //           wish.iosBundleId &&
  //           wish.androidPackageName &&
  //           Array.isArray(wish.domainName) &&
  //           wish.userId &&
  //           wish.deviceInfo &&
  //           wish.deviceInfo.deviceId &&
  //           wish.deviceInfo.deviceName &&
  //           wish.deviceInfo.os &&
  //           wish.deviceInfo.osVersion &&
  //           wish.deviceInfo.model &&
  //           wish.userName &&
  //           wish.circleId &&
  //           typeof wish.isGranted === "boolean" &&
  //           typeof wish.isSupervisor === "boolean" &&
  //           wish.status &&
  //           wish.createdAt &&
  //           wish.updatedAt &&
  //           (wish.duration === null || typeof wish.duration === "number") &&
  //           (!wish.expiredAt || typeof wish.expiredAt === "string")
  //       );
  //     },
  //   });

  //   // Test Case 19: Get wishes by userId
  //   const getWisheByUserId = http.get(
  //     `${BASE_URL}/get-wishes/${userId}?search=${param.status}`,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${accessToken}`,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  //   //console.log("getWisheByUserId", getWisheByUserId.json())
  //   check(getWisheByUserId, {
  //     "Get wishes by userId: response status 200 (OK)": (r) => r.status === 200,
  //     "Get wishes by userId": (r) => {
  //       const wishes = r.json();
  //       return wishes.every(
  //         (wish) =>
  //           wish.id &&
  //           wish.appId &&
  //           wish.appName &&
  //           wish.iosBundleId &&
  //           wish.androidPackageName &&
  //           Array.isArray(wish.domainName) &&
  //           wish.userId &&
  //           wish.deviceInfo &&
  //           wish.deviceInfo.deviceId &&
  //           wish.deviceInfo.deviceName &&
  //           wish.deviceInfo.os &&
  //           wish.deviceInfo.osVersion &&
  //           wish.deviceInfo.model &&
  //           wish.userName &&
  //           wish.circleId &&
  //           typeof wish.isGranted === "boolean" &&
  //           typeof wish.isSupervisor === "boolean" &&
  //           wish.status &&
  //           wish.createdAt &&
  //           wish.updatedAt &&
  //           (wish.duration === null || typeof wish.duration === "number") &&
  //           (!wish.expiredAt || typeof wish.expiredAt === "string")
  //       );
  //     },
  //   });

  //   // Test Case 20: Grant a wish
  //   let grantWishRes = http.post(
  //     `${BASE_URL}/grant-wish/${wishId}`,
  //     JSON.stringify(grantWishPayload),
  //     {
  //       headers: {
  //         Authorization: `Bearer ${accessToken}`,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );

  //   check(grantWishRes, {
  //     "Grant Wish: OTP request successful (200)": (r) => r.status === 200,
  //     "Grant Wish: Response contains success message": (r) =>
  //       r.json().message === "Wish has been granted",
  //   });

  // Test Case 21: Delete a device information
  //console.log("checking", userId, deviceId);
  const removeDeviceRes = http.del(
    `${BASE_URL}/users/${userId}/devices/${deviceId}`,
    null,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  //console.log("remove device details", removeDeviceRes.json());
  check(removeDeviceRes, {
    "Remove a  device: Response status 200 (OK)": (r) => r.status === 200,
    "Remove a  device response: Response contains deviceId": (r) => {
      return deviceId;
    },
  });

  //   // Test Case 22: Delete a device information
  //   const removeSpaceRes = http.del(`${BASE_URL}/spaces/${spaceId}`, {
  //     headers: {
  //       Authorization: `Bearer ${accessToken}`,
  //     },
  //   });
  //   console.log("removeSpaceRes", removeSpaceRes.json());
  //   check(removeSpaceRes, {
  //     "Remove a space: Response status 200 (OK)": (r) => r.status === 200,
  //     "Remove a  space response: Response contains space Id": (r) => {
  //       return spaceId;
  //     },
  //   });

  //   // Test Case 23: Delete a user information
  //   const removeUserRes = http.del(`${BASE_URL}/user/${userId}`, {
  //     headers: {
  //       Authorization: `Bearer ${accessToken}`,
  //     },
  //   });
  //   console.log("removeUserRes", removeUserRes.json());
  //   check(removeUserRes, {
  //     "Remove a user: Response status 200 (OK)": (r) => r.status === 200,
  //     "Remove a  user response: Response contains user Id": (r) => {
  //       const user = r.json();
  //       return user.id && user.circleId && user.role && user.name;
  //     },
  //   });

  //   // Test Case 24: Uninstall the app request
  //   const uninstallRes = http.post(
  //     `${BASE_URL}/user/unistall-app`,
  //     JSON.stringify(unInstallPayload),
  //     {
  //       headers: {
  //         Authorization: `Bearer ${accessToken}`,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  //   console.log("uninstallRes", uninstallRes.json());
  //   check(uninstallRes, {
  //     "uninstall the app: OTP request successful (200)": (r) => r.status === 200,
  //     "uninstall the app: Response contains success message": (r) =>
  //       r.json().message === "OTP verified successfully",
  //   });

  //   // Test Case 25: Delete a user information
  //   const removeAllRes = http.del(`${BASE_URL}/user/remove`, {
  //     headers: {
  //       Authorization: `Bearer ${accessToken}`,
  //     },
  //   });
  //   console.log("removeAllRes", removeAllRes.json());
  //   check(removeAllRes, {
  //     "remove the all data: OTP request successful (200)": (r) =>
  //       r.status === 200,
  //     "remove the all data: Response contains success message": (r) =>
  //       r.json().message ===
  //       "Circle and all associated data deleted successfully",
  //   });

  sleep(1);
}
