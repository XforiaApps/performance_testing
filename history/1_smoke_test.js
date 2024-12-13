import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL } from "../utils/utils.js";

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
const childAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMzM5MWU2Zi0xODA1LTQxNzgtOWMwNC0zOTY1N2Y4MjY3ODIiLCJ0b2tlblR5cGUiOiJhY2Nlc3MiLCJyb2xlIjpbImJhc2ljIl0sImRldmljZUlkIjoic3JpMSIsImlhdCI6MTczNDAwMzQyNywiZXhwIjoxNzM2NTk1NDI3fQ.yIoki85X85X_RmQdIVQbOvpkINZRyR7fAYSiFsoWy0M";
const userId = "9a472b62-97ef-4aff-be70-52f2c95d36a3";
const deviceId = "tid7sr";
export default function () {
  // Test Case 1: Get wish history
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
  //console.log("Get all wishes", wishHistory.json())
  check(wishHistory, {
    "Get all wishes: response status 200 (OK)": (r) => r.status === 200,
    "Get all wishes response": (r) => {
      const wishes = r.json();
      return wishes.every(
        (wish) =>
          wish.id &&
          wish.wishId &&
          wish.appId &&
          wish.status &&
          wish.createdAt &&
          wish.isSupervisor &&
          wish.duration &&
          wish.userId &&
          wish.circleId &&
          wish.appName &&
          typeof wish.isGranted === "boolean" &&
          wish.username &&
          wish.updatedAt &&
          (!wish.expiredAt || typeof wish.expiredAt === "string") &&
          wish.deviceInfo &&
          wish.deviceInfo.deviceId &&
          wish.deviceInfo.deviceName &&
          wish.deviceInfo.os &&
          wish.deviceInfo.osVersion &&
          wish.deviceInfo.model
      );
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
    "Get all space history: response status 200 (OK)": (r) => r.status === 200,
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
    `${BASE_URL}//user/${userId}/device/${deviceId}/history?limit=${params.limit}&offset=${params.offset}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  //console.log("userCircleHistory", userCircleHistory.json())
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

  sleep(1);
}
