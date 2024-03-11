import suncalc from "suncalc";
import { formatDate } from "@/util";

export function getSunAttri(
  latitude: number,
  longitude: number,
  dateTime: Date
) {
  const sunPosition = suncalc.getPosition(dateTime, latitude, longitude);
  const pitch = sunPosition.altitude;
  const yaw = sunPosition.azimuth;

  const sunTimes = suncalc.getTimes(dateTime, latitude, longitude);

  const current = dateTime.getTime();
  // 日出
  const sunrise = sunTimes.sunrise.getTime();
  // 正午
  const solarNoon = sunTimes.solarNoon.getTime();
  // 日落
  const sunset = sunTimes.sunset.getTime();
  // 光照时间
  const timeInterval = sunset - sunrise;
  // 当前时间距离日出的时间
  const timeFromSunrise = current - sunrise;

  let lightWeight = 0;
  if (timeFromSunrise > 0 && timeFromSunrise < timeInterval) {
    // 上午
    if (timeFromSunrise < solarNoon - sunrise) {
      lightWeight = timeFromSunrise / (solarNoon - sunrise);
    } else {
      // 下午
      lightWeight = 1 - (dateTime.getTime() - solarNoon) / (sunset - solarNoon);
    }
  }

  return {
    direction: [
      Math.cos(pitch) * Math.cos(yaw),
      Math.sin(pitch),
      Math.cos(pitch) * Math.sin(yaw),
    ] as [number, number, number],
    weight: lightWeight,
  };
}
