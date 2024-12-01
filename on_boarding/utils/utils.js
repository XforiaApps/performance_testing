export const BASE_URL =
  "https://parent-geenee-xforia-dev-999919612837.us-central1.run.app/";

export function generateRandomEmail(domain = "xforia.com") {
  const randomString = Math.random().toString(36).substring(7);
  return `${randomString}-dev@${domain}`;
}// email : 8 digit 

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

  return {
    uuid,
    name: randomName,
    major,
    minor,
  };
}

export const email = generateRandomEmail();
export const otp = "1234";
const deviceDetails = generateDeviceDetails();
export const validPayload = { email: email };
export const verifyPayload = {
  email: email,
  otp: otp,
  device: deviceDetails,
};

export const updatePayload = {
  name: "Add Name",
};

export const gps = {
  lat: 37.7749,
  lng: -122.4194,
  radius: 100,
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
      name: "Test App 1",
      iosBundleId: "com.test.app1",
      androidPackageName: "com.test.app1.android",
      domainName: ["example1.com", "example2.com"],
      id: "app1-id",
    },
    {
      name: "Test App 2",
      iosBundleId: "com.test.app2",
      androidPackageName: "com.test.app2.android",
      domainName: ["example3.com"],
      id: "app2-id",
    },
  ],
  allow: true,
};
