import { getSunrise, getSunset } from "sunrise-sunset-js";
import { DateTime } from "luxon";
export default function DayNight(lat, lon) {
  let sunrise = getSunrise(lat, lon);
  let sunset = getSunset(lat, lon);

  sunrise = DateTime.fromJSDate(sunrise);
  sunset = DateTime.fromJSDate(sunset);

  sunrise = `${String(sunrise.hour).padStart(2, "0")}:${String(
    sunrise.minute
  ).padStart(2, "0")}`;
  sunset = `${String(sunset.hour).padStart(2, "0")}:${String(
    sunset.minute
  ).padStart(2, "0")}`;

  let currentTime = `${String(DateTime.now().hour).padStart(2, "0")}:${String(
    DateTime.now().minute
  ).padStart(2, "0")}`;

  let night = true;
  if (currentTime > sunrise && currentTime < sunset) night = false;

  return night;
}
