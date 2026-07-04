import { DateTime } from "luxon";
import { getSunrise, getSunset } from "sunrise-sunset-js";

function TimeType(time, estTime, schTime) {
  let final, finalText;
  if (time) {
    final = time;
    finalText = "act";
  } else {
    final = estTime ? estTime : schTime;
    finalText = estTime ? "est" : "sch";
  }
  return { finalTime: final.replace(" ", "T") + ":00Z", finalText: finalText };
}

function DayStatus(time, lat, lon, tz) {
  let status;

  try {
    let sunrise = getSunrise(lat, lon);
    let sunset = getSunset(lat, lon);

    sunrise = DateTime.fromJSDate(sunrise, { zone: tz });
    sunset = DateTime.fromJSDate(sunset, { zone: tz });

    sunrise = `${String(sunrise.hour).padStart(2, "0")}:${String(
      sunrise.minute,
    ).padStart(2, "0")}`;
    sunset = `${String(sunset.hour).padStart(2, "0")}:${String(
      sunset.minute,
    ).padStart(2, "0")}`;

    status = "night";
    if (time > sunrise && time < sunset) {
      status = "day";
    }
  } catch {
    status = null;
  }

  return status;
}

export function FormatTimeDiff(seconds) {
  if (seconds > 3600 || seconds < -3600) {
    const hours = Math.floor(seconds / 3600);
    const remainder = Math.floor((seconds - hours * 3600) / 60);

    return {
      time: `${hours ? hours : "--"}h ${remainder ? remainder : "--"}m`,
      sign: seconds > 0 ? "+" : "",
    };
  } else {
    return {
      time: `${Math.floor(seconds / 60) || Math.floor(seconds / 60) === 0 ? Math.floor(seconds / 60) : "---"}m`,
      sign: seconds > 0 ? "+" : "",
    };
  }
}

function StatusColor(time, schTime) {
  let color = "bg-slate-400";
  if (
    time.toSeconds() - DateTime.fromISO(schTime, { zone: "UTC" }).toSeconds() <=
    60
  ) {
    color = "bg-green-400";
  } else if (
    time.toSeconds() - DateTime.fromISO(schTime, { zone: "UTC" }).toSeconds() >
    60
  ) {
    color = "bg-orange-400";
  }

  return {
    color: color,
    var: FormatTimeDiff(
      time.toSeconds() - DateTime.fromISO(schTime, { zone: "UTC" }).toSeconds(),
    ),
  };
}

export function StatusOrProgress(
  flight,
  ogTz,
  dstTz,
  type,
  oLat = null,
  oLon = null,
  dLat = null,
  dLon = null,
) {
  let out,
    outText,
    outFormat,
    inTime,
    inFormat,
    inText,
    outColor,
    inColor,
    outVar,
    inVar;

  const outData = TimeType(
    flight.dep_actual_utc,
    flight.dep_estimated_utc,
    flight.dep_time_utc,
  );
  out = outData.finalTime;
  outText = outData.finalText;

  const inData = TimeType(
    flight.arr_actual_utc,
    flight.arr_estimated_utc,
    flight.arr_time_utc,
  );
  inTime = inData.finalTime;
  inText = inData.finalText;

  if (type === "status") {
    const outDt = DateTime.fromISO(out, { zone: ogTz });
    outFormat = !isNaN(outDt.hour)
      ? `${String(outDt.hour).padStart(2, "0")}:${String(outDt.minute).padStart(
          2,
          "0",
        )},${outDt.weekdayShort}`
      : "--:-- ---";

    const outDayStatus = oLat
      ? DayStatus(outFormat.split(",")[0], oLat, oLon, ogTz)
      : null;

    const inDt = DateTime.fromISO(inTime, { zone: dstTz });
    inFormat = !isNaN(inDt.hour)
      ? `${String(inDt.hour).padStart(2, "0")}:${String(inDt.minute).padStart(
          2,
          "0",
        )},${inDt.weekdayShort}`
      : "--:-- ---";
    const inDayStatus = dLat
      ? DayStatus(inFormat.split(",")[0], dLat, dLon, dstTz)
      : null;

    outColor = StatusColor(
      outDt,
      flight.dep_time_utc
        ? flight.dep_time_utc.replace(" ", "T") + ":00Z"
        : flight.dep_time.utc,
    ).color;

    inColor = StatusColor(
      inDt,
      flight.arr_time_utc
        ? flight.arr_time_utc.replace(" ", "T") + ":00Z"
        : flight.arr_time.utc,
    ).color;

    outVar = !isNaN(outDt.hour)
      ? StatusColor(
          outDt,
          flight.dep_time_utc
            ? flight.dep_time_utc.replace(" ", "T") + ":00Z"
            : flight.dep_time.utc,
        ).var
      : { time: "--", sign: "" };

    inVar = !isNaN(inDt.hour)
      ? StatusColor(
          inDt,
          flight.arr_time_utc
            ? flight.arr_time_utc.replace(" ", "T") + ":00Z"
            : flight.arr_time.utc,
        ).var
      : { time: "--", sign: "" };

    return {
      out_status: {
        color: outColor,
        state: outText,
        formatTime: outFormat.split(",")[0],
        formatDate: outFormat.split(",")[1],
        var: outVar,
        dayStatus: outDayStatus,
      },

      in_status: {
        color: inColor,
        state: inText,
        formatTime: inFormat.split(",")[0],
        formatDate: inFormat.split(",")[1],
        var: inVar,
        dayStatus: inDayStatus,
      },
    };
  } else {
    let timeTotal =
      DateTime.fromISO(inTime, { zone: "UTC" }).toSeconds() -
      DateTime.fromISO(out, { zone: "UTC" }).toSeconds();

    let timeRemaining =
      DateTime.fromISO(inTime, { zone: "UTC" }).toSeconds() -
      DateTime.now().toSeconds();

    const pct = Math.min(
      100,
      Math.max(0, Math.round((1 - timeRemaining / timeTotal) * 100)),
    );

    timeTotal = timeTotal
      ? timeTotal >= 0
        ? `${Math.floor(timeTotal / 3600)}h ${Math.floor(
            (timeTotal - Math.floor(timeTotal / 3600) * 3600) / 60,
          )}m`
        : "0m"
      : "--";

    timeRemaining = timeRemaining
      ? timeRemaining >= 0
        ? `${Math.floor(timeRemaining / 3600)}h ${Math.floor(
            (timeRemaining - Math.floor(timeRemaining / 3600) * 3600) / 60,
          )}m`
        : "0m"
      : "--";

    return { total: timeTotal, remaining: timeRemaining, pct: pct };
  }
}
