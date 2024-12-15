
 export const user = [
    { email: "kcoultish0-dev@xforia.com" },
    { email: "mmacterrelly1-dev@xforia.com" },
    { email: "tosgorby2-dev@xforia.com" },
    { email: "sodhams3-dev@xforia.com" },
    { email: "dboame4-dev@xforia.com" },
    { email: "cwraxall5-dev@xforia.com" },
    { email: "jstuchburie6-dev@xforia.com" },
    { email: "scanner7-dev@xforia.com" },
    { email: "lgaythor8-dev@xforia.com" },
    { email: "bmaslin9-dev@xforia.com" },
    { email: "rmeiklejohna-dev@xforia.com" },
    { email: "fughettib-dev@xforia.com" },
    { email: "nbilbrookec-dev@xforia.com" },
    { email: "akhidrd-dev@xforia.com" },
    { email: "ibickerdickee-dev@xforia.com" },
    { email: "rstraceyf-dev@xforia.com" },
    { email: "mchildsg-dev@xforia.com" },
    { email: "wpearsonh-dev@xforia.com" },
    { email: "fcronei-dev@xforia.com" },
    { email: "rskamellj-dev@xforia.com" },
    { email: "nnorthernk-dev@xforia.com" },
    { email: "jsellwoodl-dev@xforia.com" },
    { email: "lfencottm-dev@xforia.com" },
    { email: "kmcjuryn-dev@xforia.com" },
    { email: "dlightwingo-dev@xforia.com" },
    { email: "dpoldenp-dev@xforia.com" },
    { email: "jprendergrassq-dev@xforia.com" },
    { email: "kspottiswoodr-dev@xforia.com" },
    { email: "ccreboes-dev@xforia.com" },
    { email: "hmannevillet-dev@xforia.com" },
    { email: "bocarranu-dev@xforia.com" },
    { email: "aduignanv-dev@xforia.com" },
    { email: "jchopyw-dev@xforia.com" },
    { email: "rstannasx-dev@xforia.com" },
    { email: "hsabatery-dev@xforia.com" },
    { email: "rwheelbandz-dev@xforia.com" },
    { email: "bdaguanno10-dev@xforia.com" },
    { email: "pgotthard11-dev@xforia.com" },
    { email: "lreitenbach12-dev@xforia.com" },
    { email: "bmeake13-dev@xforia.com" },
    { email: "nwilbor14-dev@xforia.com" },
    { email: "jformby15-dev@xforia.com" },
    { email: "lkincey16-dev@xforia.com" },
    { email: "moleszkiewicz17-dev@xforia.com" },
    { email: "dmooring18-dev@xforia.com" },
    { email: "dmatijasevic19-dev@xforia.com" },
    { email: "gcardwell1a-dev@xforia.com" },
    { email: "tminchindon1b-dev@xforia.com" },
    { email: "ccave1c-dev@xforia.com" },
    { email: "uhailes1d-dev@xforia.com" },
  ];
  
  export const BASE_URL = "https://pgapi-dev.pp.klava.app";
  
  export function generateRandomEmail(domain = "xforia.com") {
    const randomString = Math.random().toString(36).substring(7);
    return `${randomString}-dev@${domain}`;
  } // email : 8 digit
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
  }  //generate random device details
  export function generateChildDeviceDetails() {
    return {
      id: Math.random().toString(36).substring(9),
      os: "android",
      appVersion: "23.0.0",
      metadata: {
        model: "S23 ultra",
        osVersion: "24.0",
        deviceName: "s23 device",
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
  export const deviceDetails = generateDeviceDetails();
  export const childDeviceDetails = generateChildDeviceDetails()
  export const validPayload = { email: email };
  export const verifyPayload = {
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
    },
  };
  
  export const grantWishPayload = {
    duration: 10,
    isGranted: true,
    isSupervisor: true,
  };
  
  export const locationPayload = {
    spaceId: "",
    eventType: "",
    lastZonesSyncedTime: "",
  };
  
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
        ios: true,
      },
      camera: {
        android: true,
        ios: true,
      },
      bluetooth: {
        android: true,
        ios: true,
      },
      pushNotification: {
        android: true,
        ios: true,
      },
      accessibilityService: {
        android: true,
        ios: true,
      },
      nearby: {
        android: true,
        ios: true,
      },
      motionActivity: {
        android: true,
        ios: true,
      },
    },
  };
  
  export const unInstallPayload = {
    email: "berna-dev@xforia.com",
    otp: "1234",
  };
  
  export const devicePayload = {
    os: "ios",
    appVersion: "1.0.0",
    metadata: {
      model: "Pixel 6",
      osVersion: "12.0",
      deviceName: "Pixel 6 Device",
      batteryLevel: 80,
    },
  };