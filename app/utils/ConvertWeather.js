import {
  WiCloudy,
  WiDayCloudy,
  WiDayFog,
  WiDayRain,
  WiDaySnow,
  WiDaySunny,
  WiDaySunnyOvercast,
  WiDayThunderstorm,
  WiNightAltCloudy,
  WiNightAltPartlyCloudy,
  WiNightClear,
  WiNightFog,
  WiNightRain,
  WiNightSnow,
  WiNightThunderstorm,
} from "react-icons/wi";

import { getSunrise, getSunset } from "sunrise-sunset-js";
import { DateTime } from "luxon";

export function ConvertWeather(clouds, codes, info, tz, time) {
  let sunrise = getSunrise(info.info.latitude, info.info.longitude);
  let sunset = getSunset(info.info.latitude, info.info.longitude);

  sunrise = DateTime.fromJSDate(sunrise, { zone: tz });
  sunset = DateTime.fromJSDate(sunset, { zone: tz });

  sunrise = `${String(sunrise.hour).padStart(2, "0")}:${String(
    sunrise.minute,
  ).padStart(2, "0")}`;
  sunset = `${String(sunset.hour).padStart(2, "0")}:${String(
    sunset.minute,
  ).padStart(2, "0")}`;

  let currentTime = `${String(DateTime.now().setZone(tz).hour).padStart(
    2,
    "0",
  )}:${String(DateTime.now().setZone(tz).minute).padStart(2, "0")}`;
  if (time) {
    currentTime = time;
  }

  let night = true;
  if (currentTime > sunrise && currentTime < sunset) night = false;
  let ceiling = "--";

  let condition = "Fair";
  let symbol = night ? (
    <WiNightClear className="text-[55px] text-blue-400" />
  ) : (
    <WiDaySunny className="text-[55px] text-blue-400" />
  );

  clouds.some((cloud) => {
    if (cloud.type === "BKN" || cloud.type === "OVC" || cloud.type === "VV") {
      ceiling = Math.round(cloud.altitude * 100).toLocaleString();
      return true;
    }
  });

  if (codes.length === 0 && clouds.length > 0) {
    clouds.forEach((cloud) => {
      if (cloud.type === "SCT" || cloud.type === "FEW") {
        condition = "Fair";
        symbol = night ? (
          <WiNightAltPartlyCloudy className="text-[55px] text-blue-400" />
        ) : (
          <WiDaySunnyOvercast className="text-[55px] text-blue-400" />
        );
      } else if (cloud.type === "OVC" || cloud.type === "VV") {
        condition = "Overcast";
        symbol = <WiCloudy className="text-[55px] text-blue-400" />;
      } else if (cloud.type === "BKN") {
        condition = "Cloudy";
        symbol = night ? (
          <WiNightAltCloudy className="text-[55px] text-blue-400" />
        ) : (
          <WiDayCloudy className="text-[55px] text-blue-400" />
        );
      }
    });
  } else {
    codes.forEach((code) => {
      if (
        code.repr.includes("RA") ||
        code.repr.includes("DZ") ||
        code.repr.includes("SH")
      ) {
        condition = code.value;
        symbol = night ? (
          <WiNightRain className="text-[55px] text-blue-400" />
        ) : (
          <WiDayRain className="text-[55px] text-blue-400" />
        );
      } else if (
        code.repr.includes("SN") ||
        code.repr.includes("GR") ||
        code.repr.includes("GS") ||
        code.repr.includes("SG") ||
        code.repr.includes("IC") ||
        code.repr.includes("PL")
      ) {
        condition = code.value;
        symbol = night ? (
          <WiNightSnow className="text-[55px] text-blue-400" />
        ) : (
          <WiDaySnow className="text-[55px] text-blue-400" />
        );
      } else if (
        code.repr.includes("FG") ||
        code.repr.includes("BR") ||
        code.repr.includes("HZ") ||
        code.repr.includes("FU") ||
        code.repr.includes("SA") ||
        code.repr.includes("DU")
      ) {
        condition = code.value;
        symbol = night ? (
          <WiNightFog className="text-[55px] text-blue-400" />
        ) : (
          <WiDayFog className="text-[55px] text-blue-400" />
        );
      } else if (code.repr.includes("TS")) {
        condition = code.value;
        symbol = night ? (
          <WiNightThunderstorm className="text-[55px] text-blue-400" />
        ) : (
          <WiDayThunderstorm className="text-[55px] text-blue-400" />
        );
      }
    });
  }
  return {
    ceiling: ceiling,
    symbol: symbol,
    condition: condition,
    sunrise: sunrise,
    sunset: sunset,
  };
}

export function ConvertWind(ws, wg, wUnit, unit) {
  if ((wUnit === "mps" || wUnit === "m/s") & (unit === "av")) {
    ws = Math.round(ws * 1.944);
    wg = wg !== "--" ? Math.round(wg * 1.944) : "--";
  } else if ((wUnit === "mps" || wUnit === "m/s") & (unit === "met")) {
    ws = Math.round(ws * 3.6);
    wg = wg !== "--" ? Math.round(wg * 3.6) : "--";
  } else if ((wUnit === "mps" || wUnit === "m/s") & (unit === "imp")) {
    ws = Math.round(ws * 2.237);
    wg = wg !== "--" ? Math.round(wg * 2.237) : "--";
  } else if (wUnit === "kt" && unit === "met") {
    ws = Math.round(ws * 1.852);
    wg = wg !== "--" ? Math.round(wg * 1.852) : "--";
  } else if (wUnit === "kt" && unit === "imp") {
    ws = Math.round(ws * 1.15);
    wg = wg !== "--" ? Math.round(wg * 1.15) : "--";
  } else if ((wUnit === "kph" || wUnit === "km/h") && unit === "av") {
    ws = Math.round(ws * 0.54);
    wg = wg !== "--" ? Math.round(wg * 0.54) : "--";
  } else if ((wUnit === "kph" || wUnit === "km/h") && unit === "imp") {
    ws = Math.round(ws * 0.62);
    wg = wg !== "--" ? Math.round(wg * 0.62) : "--";
  }

  return {
    ws: ws,
    wg: wg,
  };
}
