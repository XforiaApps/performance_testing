export const BASE_URL = "https://pgapi-dev.pp.klava.app";
// export const BASE_URL='http://localhost:3000'
export function generateRandomEmail(domain = "xforia.com") {
  const randomString = Math.random().toString(36).substring(7); // Random alphanumeric string
  const timestamp = Date.now(); // Current timestamp in milliseconds
  return `${randomString}-dev@${domain}`;
}


export function generateRandomAlphabeticName(length = 8) {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz"; // Define alphabetic characters
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
//generate random device details
export function generateDeviceDetails() {
  return {
    id: Math.random().toString(36).substring(7),
    os: "ios",
    appVersion: "1.0.0",
    metadata: {
      model: "Pixel 6",
      osVersion: "12.0",
      deviceName: "Pixel 6 Device",
      batteryLevel: 80,
    },
    permissions: {
      location: { name: "location", android: true, ios: true, history: [] },
      camera: { name: "camera", android: true, ios: true, history: [] },
      bluetooth: { name: "bluetooth", android: true, ios: true, history: [] },
      pushNotification: {
        name: "pushNotification",
        android: true,
        ios: true,
        history: [],
      },
      accessibilityService: {
        name: "accessibilityService",
        android: true,
        ios: true,
        history: [],
      },
      nearby: { name: "nearby", android: true, ios: true, history: [] },
      motionActivity: {
        name: "motionActivity",
        android: true,
        ios: true,
        history: [],
      },
    },
  };
}

export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Random beacon generator
const generatedUUIDs = new Set();

export function generateRandomBeacon() {
  let uuid;
  do {
    uuid = generateUUID();
  } while (generatedUUIDs.has(uuid));

  generatedUUIDs.add(uuid);

  const randomName = `Beacon_${Math.random().toString(36).substring(2, 8)}`;
  const major = Math.floor(Math.random() * 65536);
  const minor = Math.floor(Math.random() * 65536);
  const beaconType = 'fixed'

  return {
    uuid,
    name: randomName,
    major,
    minor,
    beaconType
  };
}

export const email = generateRandomEmail();
export const otp = "1234";
export const deviceDetails = generateDeviceDetails();
export const validPayload = { email: email };
export const verifyPayload = {
  email: email,
  otp: otp,
};

export const updatePayload = {
  name: generateRandomAlphabeticName(),
};

export function updateSpacePayload(appsRes) {
  return {
    name: generateRandomAlphabeticName(6),
    apps: appsRes.json().apps,
    allow: false
  }
  
}


const getRandomLatLng = () => {
 // Latitude ranges from -90 to 90
 const lat = Math.random() * 180 - 90;
    
 // Longitude ranges from -180 to 180
 const lng = Math.random() * 360 - 180;
 
 // Return the latitude and longitude as an object
 return { lat, lng };
};

export const gps = {
  ...getRandomLatLng(),
  radius: 50,
  address: "123 Test St, Test City",
};

export const meta = {
  batteryLevel: "80%",
  rssi: "-65",
  macAddress: "00:11:22:33:44:55",
  serialNumber: "SN12345",
  manufacturer: "Test Manufacturer",
  firmwareVersion: "1.2.3",
  location: "Room A",
  tags: "tag1,tag2",
};

export const apps = {
  apps: [
    {
      name: "netflix",
      iosBundleId: "com.netflix.Netflix",
      androidPackageName: "com.netflix.mediaclient",
      domainName: ["netflix.com", "www.netflix.com"],
      id: "1",
    },
    {
      name: "instagram",
      iosBundleId: "com.burbn.instagram",
      androidPackageName: "com.instagram.android",
      domainName: ["instagram.com"],
      id: "2",
    },
  ],
  allow: true,
};

// export const verifyUserPayload = {
//   username: "testUser",
//   device: {
//     id: "device12345",
//     os: "android",
//     appVersion: "1.0.0",
//     metadata: {
//       model: "Pixel 5",
//       osVersion: "12.0",
//       deviceName: "Test Device",
//       batteryLevel: 85,
//     },
//   },
// };

export function generateRandomNumber() {
  return Math.floor(Math.random() * 6) + 1;
}

export const makeWishPayload = {
  appId: generateRandomNumber(),
  device_info: {
    osVersion: "12.0",
    deviceName: "Pixel 6",
    os: "android",
    deviceId: Math.random().toString(36).substring(7),
    model: "Pixel 6",
  }
};

export const grantWishPayload = {
  duration: 10,
  isGranted: true,
  isSupervisor: true,
};

export const getLocationPayload = (spaceId, eventType) => {
  return {
    spaceId,
    eventType,
    lastZonesSyncedTime: new Date(),
  }
}

export const updateDevicePayload = {
  os: "ios",
  appVersion: "2.0.0",
  metadata: {
    model: "Pixel 7",
    osVersion: "14.0",
    deviceName: "Pixel 7 Device",
    batteryLevel: 70,
  },
};

export const updateDevicePermissionPayload = {
  
    permissions: {
      location: {
        android: true,
        ios: true
      },
      camera: {
        android: true,
        ios: true
      },
      bluetooth: {
        android: true,
        ios: true
      },
      pushNotification: {
        android: true,
        ios: true
      },
      accessibilityService: {
        android: true,
        ios: true
      },
      nearby: {
        android: true,
        ios: true
      },
      motionActivity: {
        android: true,
        ios: true
      }
    }
  }

export const unInstallPayload = {
  email: 'berna-dev@xforia.com',
  otp: '1234',
};

export const devicePayload = {
  os: "ios",
  appVersion: "1.0.0",
  metadata: {
    model: "Pixel 6",
    osVersion: "12.0",
    deviceName: "Pixel 6 Device",
    batteryLevel: 80,
  }
}

export const generateCustomEmails = (count) => {
  const SUFFIX = '-dev@xforia.com';
  const emails = new Set();

  while (emails.size < count) {
    // Generate a timestamp-based unique identifier
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const prefix = `user${timestamp}${randomSuffix}`;

    const email = `${prefix}${SUFFIX}`;
    emails.add(email); // Ensure uniqueness
  }

  // Convert the Set into an array of objects with "email" key
  return Array.from(emails).map((email) => ({ email }));
};



