import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, locationPayload } from "../utils/utils.js";

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
  // Test Case 1: Make a wish
  let locationRes = http.post(
    `${BASE_URL}/users/devices/location-update`,
    JSON.stringify(locationPayload),
    {
      headers: {
        Authorization: `Bearer ${childAccessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  //console.log("location update response", locationRes.json())

  check(locationRes, {
    "Location update Response: User data validation": (r) => {
      const user = r.json().response;
      return user && user.role && user.name;
    },
    "Location update Response: Contains device data": (r) => {
      const device = r.json().response.device && r.json().response.device[0];
      return (
        device && device.id && device.os && device.appVersion && device.metadata
      );
    },
    "Location update Response: Contains spaces data": (r) => {
      const spaces = r.json().response.spaces;
      return (
        Array.isArray(spaces) && spaces.every((space) => space.id && space.name)
      );
    },
  });

  sleep(1);
}
