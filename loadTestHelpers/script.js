import http from "k6/http";
import { check, sleep } from "k6";
import {
  BASE_URL,
  updatePayload,
  generateRandomBeacon,
  gps,
  generateDeviceDetails,
  generateRandomAlphabeticName,
} from "../utils/utils.js";

export function requestOTP(payload) {
  const res = http.post(
    `${BASE_URL}/auth/email/request-otp`,
    JSON.stringify(payload),
    { headers: { "Content-Type": "application/json" } }
  );

  check(res, {
    "Valid Email: OTP request successful (200)": (r) => r.status === 200,
    "Valid Email: Response contains success message": (r) =>
      r.json().message === "OTP send successfully",
  });

  return res;
}

export function verifyOTP(payload) {
  const res = http.post(
    `${BASE_URL}/auth/email/verify-otp`,
    JSON.stringify({
      ...payload
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  check(res, {
    "Verify OTP: OTP verification successful (200)": (r) => r.status === 200,
    "Verify OTP: Response contains user data": (r) => {
      const user = r.json().user;
      return user && user.userId && user.email && user.circleId && user.role;
    },

    "Verify OTP: Response contains tokens": (r) => {
      const tokens = r.json().tokens;
      return tokens && tokens.accessToken && tokens.refreshToken;
    },
    "Verify OTP: User is new or existing": (r) => {
      return r.json().isNewUser === false || r.json().isNewUser === true;
    },
  });

  return res;
}

export function updateUser(accessToken, userId) {
  const res = http.put(
    `${BASE_URL}/user/${userId}`,
    JSON.stringify(updatePayload),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  // Check if the response has a valid body
  if (!res || !res.body) {
    console.log("Response Body ==>", res.body)
    console.log("Response Status ==>", res.status)
    console.error("Space Create: Empty or no response body");
    return null; // Return null or handle the error as needed
  }

  let jsonResponse;
  try {
    jsonResponse = res.json();
  } catch (error) {
    console.error(
      `Space Create: Failed to parse JSON. Status: ${res.status}, Body: ${res.body}`
    );
    return null; // Return null or handle the error as needed
  }

  check(res, {
    "User Update: Response contains updated user data": (r) => {
      const updatedUser = r.json();
      return (
        updatedUser &&
        updatedUser.name &&
        updatedUser.id &&
        updatedUser.role &&
        (updatedUser.isManaged === true || updatedUser.isManaged === false)
      );
    }
  });

  return res;
}

export function inviteSupervisor(accessToken, payload) {
  const res = http.post(
    `${BASE_URL}/user/invite-supervisor`,
    JSON.stringify(payload),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  check(res, {
    "Supervisor Invitation: Contain status 200": (r) => res.status === 200,
    "Supervisor Invitation: Contains message and deeplink": (r) => {
      const message = res.message
      const deepLink = res.deepLink
      return { message, deepLink }
    },
  });

  return res
}

export function verifySupervisorEmail(payload) {
  const res = http.get(
    `${BASE_URL}/auth/user/supervisor-verify/${payload.circleId}?token=${payload.token}&nameHash=${payload.name}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  check(res, {
    "Supervisor Verify: Contain status 200": (r) => r.status === 200,
    "Supervisor Verify: Contains message": (r) => r.json().message === 'Email verified successfully'
  });

  return res
}

export function createSpace(accessToken, spaceType = 'landmark', spaceId = '') {
  let spacePayload = {}
  if (spaceType === 'room') {
    const beacon = generateRandomBeacon();
    spacePayload = {
      name: generateRandomAlphabeticName(6),
      landmarkId: spaceId,
      beacon,
      type: "room",
    };
  } else {
    spacePayload = {
      name: generateRandomAlphabeticName(6),
      type: "landmark",
      gps,
    };
  }
  const res = http.post(
    `${BASE_URL}/spaces`,
    JSON.stringify(spacePayload),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!res || !res.body) {
    console.error("Space Create: Empty or no response body");
    return null; // Return null or handle the error as needed
  }

  let jsonResponse;
  try {
    jsonResponse = res.json();
  } catch (error) {
    console.error(
      `Space Create: Failed to parse JSON. Status: ${res.status}, Body: ${res.body}`
    );
    return null; // Return null or handle the error as needed
  }

  // Validate response content
  check(res, {
    "Space Create: Contains space ID": (r) => jsonResponse.id !== undefined,
    "Space Create: Contains space name": (r) => jsonResponse.name !== null,
    "Space Create: Contains GPS data (optional)": () => {
      const gps = jsonResponse.gps;
      return !gps || (gps.lat && gps.lng && gps.radius && gps.address);
    },
    // "Space Create: Contains beacons (optional)": () => {
    //   const beacons = jsonResponse.beacon;

    //   if (jsonResponse.type === "room") {
    //     if (!Array.isArray(beacons) || beacons.length === 0) {
    //       return false;
    //     }
    //     return beacons.every((beacon) => {
    //       return (
    //         beacon.id &&
    //         beacon.beaconType &&
    //         beacon.uuid &&
    //         beacon.major &&
    //         beacon.minor
    //       );
    //     });
    //   } else if (jsonResponse.type === "landmark") {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // },
  });

  return res;
}


export function getAvailableApps(accessToken) {
  const params = { search: "", limit: 30, offset: 0 };
  const res = http.get(
    `${BASE_URL}/available-apps`,
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
      return apps.every((app) => {
        return (
          app.icon !== undefined &&
          app.id &&
          app.category &&
          app.name &&
          app.iosBundleId &&
          app.androidPackageName &&
          app.developerName &&
          app.domainName &&
          Array.isArray(app.domainName) && app.domainName.length > 0
        );
      });
    },
    "Apps array respects the limit parameter": (r) =>
      r.json().apps.length <= params.limit,
  });
  return res;
}

export function updateSpace(spaceId, updateSpacePayload, accessToken) {
  const res = http.patch(
    `${BASE_URL}/spaces/${spaceId}`,
    JSON.stringify(updateSpacePayload),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  check(res, {
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
  return res
}

export function requestQRCode(accessToken) {
  const res = http.get(`${BASE_URL}/user/login-qr`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  check(res, {
    "QR Code Login: Response status 200 (OK)": (r) => r.status === 200,
    "QR Code Login: Response contains QR code URL": (r) =>
      r.json().qrcode !== null,
    "QR Code Login: Response contains deep link": (r) =>
      r.json().deepLink !== null,
  });



  return res;
}

export function checkIfChildAlreadyExists(token, accessToken) {
  const res = http.get(`${BASE_URL}/auth/users/${token}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  const existingUsers = res.json();
  if (
    Array.isArray(existingUsers) &&
    existingUsers.length > 0 &&
    existingUsers[0].id
  ) {
    return existingUsers[0].id;
  } else {
    return null;
  }
}


export function createUserVerifyPayload(token, userId) {
  const randomName = generateRandomAlphabeticName(5);
  return {
    token,
    userId,
    username: !userId ? randomName : undefined,
    device: generateDeviceDetails(),
  };
}

export function verifyUser(payload) {
  const response = http.post(
    `${BASE_URL}/auth/user/verify`,
    JSON.stringify(payload),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const res = response.json()
  check(response, {
    "User Verify: Response status is 200": (r) => r.status === 200,
    "User Verify: Response contains user data": (r) => {
      const user = r.json().user;
      if (user) {
        return user.userId && user.name && user.role;
      }
      return false;
    },
    "User Verify: Response contains tokens": (r) => {
      const tokens = r.json().tokens;
      return tokens && tokens.accessToken && tokens.refreshToken;
    },
  });

  return res;
}

export function createDevice(userId, childDeviceDetails, accessToken) {
  const response = http.post(
    `${BASE_URL}/users/${userId}/devices`,
    JSON.stringify(childDeviceDetails),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response;
}

export function bootup(accessToken, userId) {
  const bootupRes = http.get(`${BASE_URL}/user/bootup`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  try {
    const data = bootupRes.json();
    check(data, {
      "Bootup: Response contains user data": (r) => {
        const user = r.users && r.users[0];
        return user ? r.id && r.role && r.name : true;
      },
      "Bootup: Response contains device data": (r) => {
        const device = r.device && r.device[0];
        return device
          ? device.id && device.os && device.appVersion && device.metadata
          : true;
      },
      "Bootup: Response contains spaces data": (r) => {
        const spaces = r.spaces;
        return spaces && spaces.length > 0 && spaces[0].id && spaces[0].name;
      },
      "Bootup: Response contains features": (r) => {
        const features = r.features;
        return features
          ? features.additionalProp1 && features.additionalProp1.id
          : true;
      },
      "Bootup: Response contains active wishes": (r) => {
        const activeWish = r.activeWish;
        return (
          !activeWish || (Array.isArray(activeWish) && activeWish.length >= 0)
        );
      },
    });
    return bootupRes;
  } catch (err) {
    console.error(
      `Error parsing JSON response for userId ${userId}:`,
      err
    );
    return null;
  }
}

export function getWishHistory(userDetails, params) {
  const { accessToken } = userDetails;

  const wishHistory = http.get(
    `${BASE_URL}/wish-history?limit=${params.limit}&offset=${params.offset}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  check(wishHistory, {
    'Wish History: response status 200 (OK)': (r) => r.status === 200,
    'Wish History response': (r) => {
      const wishes = r.json();
      return wishes.every((wish) => {
        return (
          // Non-optional required fields
          !!wish.id,
          !!wish.wishId,
          !!wish.appId,
          !!wish.userId,
          !!wish.appName,
          !!wish.circleId,
          !!wish.status,
          !!wish.createdAt,
          !!wish.updatedAt,
          typeof wish.isGranted === 'boolean',

          // Optional fields - different validation approach
          wish.deviceInfo === undefined || (
            wish.deviceInfo.deviceId !== undefined &&
            wish.deviceInfo.deviceName !== undefined &&
            wish.deviceInfo.os !== undefined &&
            wish.deviceInfo.osVersion !== undefined &&
            wish.deviceInfo.model !== undefined
          ),

          wish.studentId === undefined || wish.studentId !== null,

          wish.spaces === undefined ||
          wish.spaces === null ||
          (Array.isArray(wish.spaces) &&
            (wish.spaces.length === 0 ||
              wish.spaces.every(space =>
                typeof space === 'string' ||
                (typeof space === 'object' &&
                  space.id !== undefined &&
                  space.name !== undefined)
              )
            )
          ),

          (wish.duration === null || typeof wish.duration === 'number'),
          (!wish.expiredAt || typeof wish.expiredAt === 'string')
        );
      });
    },
  });
}


export function getCirlceHistory(userDetails, params) {
  const { accessToken, childUserId, childDeviceId } = userDetails;

  // Test Case: Get all circle history
  const circleHistory = http.get(
    `${BASE_URL}/circle-history?limit=${params.limit}&offset=${params.offset}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  check(circleHistory, {
    'Get all space history: response status 200 (OK)': (r) => r.status === 200,
    'Get all space history response': (r) => {
      const spaceHistory = r.json();
      return (
        Array.isArray(spaceHistory) &&
        spaceHistory.every((sh) =>
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
          Array.isArray(sh.allowApps) &&
          Array.isArray(sh.blockedApps) &&
          sh.createdAt &&
          sh.updatedAt
        )
      );
    },
  });

  // Test Case: Get circle history by userId
  const userCircleHistory = http.get(
    `${BASE_URL}/user/${childUserId}/device/${childDeviceId}/history?limit=${params.limit}&offset=${params.offset}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  check(userCircleHistory, {
    'Get all space history: response by user status 200 (OK)': (r) => r.status === 200,
    'Get all space history response by user': (r) => {
      const spaceHistory = r.json();
      if (Array.isArray(spaceHistory) && spaceHistory.length === 0) {
        return true;
      }
      return (
        Array.isArray(spaceHistory) &&
        spaceHistory.every((sh) =>
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
          Array.isArray(sh.allowApps) &&
          Array.isArray(sh.blockedApps) &&
          sh.createdAt &&
          sh.updatedAt
        )
      );
    },
  });
}


// Function to perform location update and validate the response
export function locationUpdate(childAccessToken, locationPayload) {
  const locationRes = http.post(
    `${BASE_URL}/users/devices/location-update`,
    JSON.stringify(locationPayload),
    {
      headers: {
        Authorization: `Bearer ${childAccessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  // Perform checks on the response
  check(locationRes, {
    "Location update Response: User data validation": (r) => {
      const user = r.json()?.response;
      return user && user.role && user.name;
    },
    "Location update Response: Contains device data": (r) => {
      const device = r.json()?.response?.device?.[0];
      return device
        ? device.id && device.os && device.appVersion && device.metadata
        : true;
    },
    "Location update Response: Contains spaces data": (r) => {
      const spaces = r.json()?.response?.spaces;
      return (
        Array.isArray(spaces) &&
        spaces.every((space) => space.id && space.name)
      );
    },
  });

  return locationRes;
}

export function makeAWish(childToken, wishPayload) {
  const wishResponse = http.post(`${BASE_URL}/make-a-wish`,
    JSON.stringify(wishPayload), {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${childToken}`,
    }
  });
  const responseJson = wishResponse.json();
  // Check if the message indicates that the wish request already exists or is expired
  if (responseJson.hasOwnProperty("message")) {
    return null;
  }

  // Perform checks on the wishResponse as usual
  check(wishResponse, {
    "Wish Created - Status 200": (r) => r.status === 200,
    "Wish Created - Has ID": (r) => r.json().id !== undefined,
    "Wish Created - autoApproved is false": (r) => r.json().autoApproved === false,
    "Wish Created - isSchoolWish is false": (r) => r.json().isSchoolWish === false,
    "Wish Created - expiredAt is valid date": (r) => {
      const expiredAt = new Date(r.json().expiredAt);
      return !isNaN(expiredAt.getTime());
    },
  });

  return responseJson;  // Return the full response JSON for further use
}

export function grantWish(wishId, grantPayload, accessToken) {
  const res = http.post(`${BASE_URL}/grant-wish/${wishId}`,
    JSON.stringify(grantPayload),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

  check(res, {
    "Wish Granted - Status 200": (r) => r.status === 200,
    "Wish Granted - Message Match": (r) => r.json().message === "Wish has been rejected",
  });

  return res;
}

export function getWishes(accessToken) {
  const res = http.get(`${BASE_URL}/get-wishes`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    check(res, {
      "Status is 200": (r) => r.status === 200
    });
  
    let json = res.json();
    check(json, {
      "Response is an array": (data) => Array.isArray(data),
      "Response is not empty": (data) => data.length > 0,
    });
    
    if (Array.isArray(json)) {
      for (const item of json) {
        check(item, {
          "Item has required fields": (obj) =>
            obj.hasOwnProperty("id") &&
            obj.hasOwnProperty("appId") &&
            obj.hasOwnProperty("appName") &&
            obj.hasOwnProperty("iosBundleId") &&
            obj.hasOwnProperty("androidPackageName") &&
            obj.hasOwnProperty("domainName") &&
            obj.hasOwnProperty("userId") &&
            obj.hasOwnProperty("userName") &&
            obj.hasOwnProperty("circleId") &&
            obj.hasOwnProperty("isGranted") &&
            obj.hasOwnProperty("isSupervisor") &&
            obj.hasOwnProperty("status") &&
            obj.hasOwnProperty("createdAt") &&
            obj.hasOwnProperty("updatedAt"),
  
          "Spaces field is optional but must be an array if present": (obj) =>
            !obj.hasOwnProperty("spaces") || Array.isArray(obj.spaces),
  
          "DeviceInfo is optional but must have required fields if present": (obj) =>
            !obj.hasOwnProperty("deviceInfo") ||
            (obj.deviceInfo &&
              obj.deviceInfo.hasOwnProperty("deviceId") &&
              obj.deviceInfo.hasOwnProperty("model") &&
              obj.deviceInfo.hasOwnProperty("osVersion") &&
              obj.deviceInfo.hasOwnProperty("deviceName") &&
              obj.deviceInfo.hasOwnProperty("os")),
  
          "Duration is optional but must be a number if present": (obj) =>
            !obj.hasOwnProperty("duration") || typeof obj.duration === "number",
  
          "ExpiredAt is optional but must be a valid date string if present": (obj) =>
            !obj.hasOwnProperty("expiredAt") ||
            (typeof obj.expiredAt === "string" && !isNaN(Date.parse(obj.expiredAt))),
        });
      }
    }
  }


// export function setupUser(userCounts) {
//   let parentDeviceDetails = null;
//   let childDeviceDetails = null;
//   let spaceCreated = false;

//   const users = generateCustomEmails(userCounts);

//   const userInfo = users.map((user) => {
//     if (!parentDeviceDetails) {
//       parentDeviceDetails = generateDeviceDetails();
//     }

//     // Step 1: Request OTP
//     const otpPayload = { email: user.email };
//     requestOTP(otpPayload);

//     // Step 2: Verify OTP
//     const verifyPayload = { email: user.email, otp: '1234' };
//     const verifyRes = verifyOTP(verifyPayload);
//     const accessToken = verifyRes.json().tokens.accessToken;
//     const userId = verifyRes.json().user.userId;
//     const deviceId = verifyRes.json().deviceId;

//     // Step 3: Update parent name
//     const updateRes = updateUser(accessToken, userId);
//     const parentName = updateRes.json().name;

//     // Step 4: Create Space (only if not created)
//     if (!spaceCreated) {
//       const spaceRes = createSpace(accessToken);
//       const appsRes = getAvailableApps(accessToken);

//       const spaceId = spaceRes.json().id;
//       updateSpace(
//         spaceId,
//         {
//           name: generateRandomAlphabeticName(6),
//           type: 'room',
//           gps,
//           beacon: spaceRes.json().beacon,
//           apps: appsRes.json().apps,
//         },
//         accessToken
//       );

//       spaceCreated = true;
//     }

//     // Step 5: Request QR Code for Login
//     const qrCodeRes = requestQRCode(accessToken);
//     const deepLink = qrCodeRes.json().deepLink;
//     const token = deepLink.match(/token=([^&]+)/)?.[1];

//     // Step 6: Check existing child
//     let childId = checkIfChildAlreadyExists(token, accessToken);

//     // Step 7: Create and verify child user
//     if (!childDeviceDetails) {
//       childDeviceDetails = generateDeviceDetails();
//     }

//     const userVerifyPayload = createUserVerifyPayload(token, childId, childDeviceDetails);
//     const userVerifyResponse = verifyUser(userVerifyPayload, accessToken);

//     const childAccessToken = userVerifyResponse.json().tokens.accessToken;
//     const childUserId = userVerifyResponse.json().user.userId;
//     const childDeviceId = userVerifyResponse.json().deviceId;

//     return {
//       accessToken,
//       userId,
//       parentName,
//       deviceId,
//       childAccessToken,
//       childUserId,
//       childDeviceId,
//     };
//   });

//   return userInfo;
// }

