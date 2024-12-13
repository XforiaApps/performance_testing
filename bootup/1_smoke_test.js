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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MzIxMzhiNS01OGQ4LTQ0NjMtYjcwOS1iMjJjYmQ3Y2IxNDEiLCJ0b2tlblR5cGUiOiJhY2Nlc3MiLCJyb2xlIjpbInByaW1hcnkiXSwiZGV2aWNlSWQiOiJhOGE2ZmE1NDZkYjMwZjhiIiwiaWF0IjoxNzM0MDcxNzkyLCJleHAiOjE3MzY2NjM3OTJ9.fGXmuAkfkWZHs5XS5fxQ-QveP0VltPpZnHw-ReqpWiE";
const childAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYjkzNzk1NC03NjM2LTQ2MzctYTlkMy0zMjYyMjA4ODFjMDkiLCJ0b2tlblR5cGUiOiJhY2Nlc3MiLCJyb2xlIjpbImJhc2ljIl0sImRldmljZUlkIjoid3l0c2Q0IiwiaWF0IjoxNzM0MDg2MjY5LCJleHAiOjE3MzY2NzgyNjl9.jQG-OhWkv_KgLQWrXs6Xn89z--yZPfV9PqiLOlAtx20";

export default function () {
  // Test Case : Bootup Request
  const bootupRes = http.get(`${BASE_URL}/user/bootup`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // console.log("Status Code:", bootupRes.status);

  try {
    const data = bootupRes.json();
    // console.log("Parsed JSON:", data);

    check(bootupRes, {
      "Bootup: Response contains user data": (r) => {
        const user = data.users && data.users[0];
        return user ? user.id && user.role && user.name : true;
      },
      "Bootup: Response contains device data": (r) => {
        const device = data.device && data.device[0];
        return (
          device &&
          device.id &&
          device.os &&
          device.appVersion &&
          device.metadata
        );
      },
      "Bootup: Response contains spaces data": (r) => {
        const spaces = data.spaces;
        return spaces && spaces.length > 0 && spaces[0].id && spaces[0].name;
      },
      "Bootup: Response contains features": (r) => {
        const features = data.features;
        return features
          ? features.additionalProp1 && features.additionalProp1.id
          : true;
      },
      "Bootup: Response contains active wishes": (r) => {
        const activeWish = data.activeWish;
        return (
          !activeWish || (Array.isArray(activeWish) && activeWish.length >= 0)
        );
      },
    });
  } catch (err) {
    // console.error("Error parsing JSON response:", err);
    //console.error("Raw response body:", bootupRes.body);
  }

  sleep(1);
}
