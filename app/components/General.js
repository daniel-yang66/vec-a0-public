"use client";
import { useState, useEffect } from "react";
import { WiSunrise, WiSunset } from "react-icons/wi";
import { LuArrowUp } from "react-icons/lu";
import { ConvertWeather, ConvertWind } from "../utils/ConvertWeather";
import { DateTime } from "luxon";
import { ConvertVis, ConvertTemp } from "../utils/UnitConversion";
import clsx from "clsx";
import { motion } from "framer-motion";
import { IoMdTime } from "react-icons/io";
import { TbArrowsRandom } from "react-icons/tb";
const geomagnetism = require("geomagnetism");

export default function General({ stationData, unit, targetTime }) {
  const [wxSummary, setWxSummary] = useState();
  const [magVar, setMagVar] = useState();
  const [wxType, setWxType] = useState("now");
  const [time, setTime] = useState("--:-- ---");

  const GetSliderPosition = () => {
    if (wxType) {
      return wxType === "now" ? 0 : 1;
    }
  };

  useEffect(() => {
    const wxConvert = ConvertWeather(
      stationData.wx.clouds,
      stationData.wx.wx_codes,
      stationData.wx,
      stationData.tz,
    );

    let ws = stationData.wx.wind_speed ? stationData.wx.wind_speed.value : "--";
    let wg = stationData.wx.wind_gust ? stationData.wx.wind_gust.value : "--";
    const wUnit = stationData.wx.units.wind_speed.toLowerCase();
    const wind = ConvertWind(ws, wg, wUnit, unit);
    const model = geomagnetism.model();
    let varData = model.point([
      stationData.wx.info.latitude,
      stationData.wx.info.longitude,
    ]);
    varData = varData.decl ? varData.decl : "--";
    setWxSummary({ summary: wxConvert, wind: wind, windUnit: wUnit });
    setMagVar(varData);
  }, [stationData, unit]);

  useEffect(() => {
    if (!stationData || !stationData.tz) return;
    const interval = setInterval(() => {
      setTime(
        DateTime.now().setZone(stationData.tz).toFormat("HH:mm ccc, 'GMT' Z"),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [stationData]);

  if (stationData && wxSummary) {
    return (
      <div className="w-full h-[86%] md:w-[70%] md:h-full font-semibold text-slate-300 text-md">
        <section className="mb-4">
          <h3 className="text-blue-300 text-md font-bold mb-2">Time</h3>
          <div className="flex gap-2 items-center">
            <div className="h-8 p-2 rounded-lg flex gap-2 items-center justify-center bg-blue-900">
              <IoMdTime className="text-[20px] text-blue-300" />
              <p>{time}</p>
            </div>

            <div className="h-8 p-2 rounded-lg flex gap-2 items-center justify-center bg-blue-900">
              <WiSunrise className="text-[20px] text-yellow-400" />
              <p>{wxSummary.summary.sunrise}</p>
            </div>
            <div className="h-8 p-2 rounded-lg flex gap-2 items-center justify-center bg-blue-900">
              <WiSunset className="text-[20px] text-orange-500" />
              <p>{wxSummary.summary.sunset}</p>
            </div>
          </div>
        </section>
        <section className="mb-4">
          <h3 className="text-blue-300 text-md font-bold mb-2">Geography</h3>
          <div className="grid grid-cols-3 gap-2 items-center h-full">
            <div className="relative h-12 w-full px-2 rounded-lg flex items-end bg-blue-900 overflow-auto">
              <p className="absolute top-1 left-1 text-xs text-slate-400">
                City
              </p>
              <p>{stationData.wx.info.city}</p>
            </div>
            <div className="relative h-12 w-full px-2 rounded-lg flex items-end bg-blue-900 overflow-auto">
              <p className="absolute top-1 left-1 text-xs text-slate-400">
                Country
              </p>
              <p>{stationData.wx.info.country}</p>
            </div>
            <div className="relative h-12 w-24 px-2 rounded-lg flex items-end bg-blue-900 overflow-auto">
              <p className="absolute top-1 left-1 text-xs text-slate-400">
                Elevation
              </p>
              <p>{`${unit === "imp" || unit === "av" ? stationData.wx.info.elevation_ft : stationData.wx.info.elevation_m} ${unit === "imp" || unit === "av" ? "ft" : "m"}`}</p>
            </div>
            <div className="relative h-12 w-full px-2 rounded-lg flex items-end bg-blue-900 overflow-auto">
              <p className="absolute top-1 left-1 text-xs text-slate-400">
                Latitude
              </p>
              <p>{`${Math.abs(stationData.wx.info.latitude).toFixed(2)}\xB0 ${stationData.wx.info.latitude >= 0 ? "N" : "S"}`}</p>
            </div>
            <div className="relative h-12 w-full px-2 rounded-lg flex items-end bg-blue-900 overflow-auto">
              <p className="absolute top-1 left-1 text-xs text-slate-400">
                Longitude
              </p>
              <p>{`${Math.abs(stationData.wx.info.longitude).toFixed(2)}\xB0 ${stationData.wx.info.longitude >= 0 ? "E" : "W"}`}</p>
            </div>
            <div className="relative h-12 w-24 px-2 rounded-lg flex items-end bg-blue-900 overflow-auto">
              <p className="absolute top-1 left-1 text-xs text-slate-400">
                Mag Var
              </p>
              <p>{`${Math.abs(magVar).toFixed(0)}\xB0 ${magVar ? (magVar >= 0 ? "E" : "W") : ""}`}</p>
            </div>
          </div>
        </section>
        <section>
          <h3 className="text-blue-300 text-md font-bold mb-2">Weather</h3>
          <div
            className={`flex w-[50vw] md:w-[23vw] items-center justify-self-center h-6 bg-slate-500 rounded-md relative mb-4`}
          >
            <motion.div
              className="absolute bg-linear-to-br from-slate-900 to-blue-700 rounded-md shadow-sm w-1/2 h-full"
              initial={false}
              animate={{
                x: GetSliderPosition() * 100 + "%",
                width: "50%",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            />

            <div
              onClick={() => {
                setWxType("now");
              }}
              className="flex justify-center items-center transition-colors duration-200 relative z-20 w-1/2"
            >
              <h2>Latest</h2>
            </div>
            <div
              onClick={() => {
                setWxType("fcast");
              }}
              className="flex justify-center items-center transition-colors duration-200 relative z-20 w-1/2"
            >
              <h2>Forecast</h2>
            </div>
          </div>

          {wxType === "now" ? (
            <>
              <div className="flex gap-2 items-center mb-4">
                {wxSummary.summary.symbol}
                <p className="text-lg">{wxSummary.summary.condition}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full">
                <div className="relative h-14 w-full px-2 rounded-lg flex items-end bg-blue-900 overflow-auto">
                  <p className="absolute top-1 left-1 text-sm text-slate-400">
                    Ceil/Vis
                  </p>
                  <div className="absolute flex items-center gap-2 top-0 right-1">
                    <span
                      className={clsx("w-2 h-2 rounded-full", {
                        "bg-green-400": stationData.wx.flight_rules === "VFR",
                        "bg-blue-400": stationData.wx.flight_rules === "MVFR",
                        "bg-red-400": stationData.wx.flight_rules === "IFR",
                        "bg-purple-400": stationData.wx.flight_rules === "LIFR",
                      })}
                    ></span>
                    <p className="text-sm">{stationData.wx.flight_rules}</p>
                  </div>
                  <p>{`${unit === "imp" || unit === "av" || wxSummary.summary.ceiling === "--" ? wxSummary.summary.ceiling : wxSummary.summary.ceiling * 0.3048} ${unit === "imp" || unit === "av" ? "ft" : "m"} / ${ConvertVis(stationData.wx.visibility.value)} ${unit === "met" ? "km" : "sm"}`}</p>
                </div>
                <div className="relative h-14 w-full px-2 rounded-lg flex items-end bg-blue-900 overflow-auto">
                  <p className="absolute top-1 left-1 text-sm text-slate-400">
                    Temp/Dwpt
                  </p>
                  <p>{`${ConvertTemp(unit, stationData.wx.temperature.value)}\xB0${unit === "met" || unit === "av" ? stationData.wx.units.temperature : "F"} / ${ConvertTemp(unit, stationData.wx.dewpoint.value)}\xB0${unit === "met" || unit === "av" ? stationData.wx.units.temperature : "F"}`}</p>
                </div>
                <div className="relative h-14 w-full px-2 rounded-lg flex gap-2 items-end bg-blue-900">
                  <p className="absolute top-1 left-1 text-sm text-slate-400">
                    Wind
                  </p>
                  <p className="max-sm:text-[13px] md:text-[15px]">{`${wxSummary.wind.wg !== "--" ? `${wxSummary.wind.ws}/${wxSummary.wind.wg}` : `${wxSummary.wind.ws}`} ${unit === "av" || unit === "imp" ? (unit === "av" ? "kt" : "mph") : "kph"}, ${stationData.wx.wind_direction.repr !== "VRB" ? (stationData.wx.wind_direction.value ? `${stationData.wx.wind_direction.value}\xB0` : "--") : "VRB"}`}</p>
                  {stationData.wx.wind_direction.repr !== "VRB" ? (
                    <LuArrowUp
                      className={"text-blue-400 text-[15px] md:text-[20px]"}
                      style={{
                        rotate: `${stationData.wx.wind_direction.value ? stationData.wx.wind_direction.value + 180 : 0}deg`,
                      }}
                    />
                  ) : (
                    <TbArrowsRandom className={"text-blue-400 text-[22px]"} />
                  )}
                </div>

                <div className="relative h-14 w-full px-2 rounded-lg flex items-end bg-blue-900 overflow-auto">
                  <p className="absolute top-1 left-1 text-sm text-slate-400">
                    Altimeter
                  </p>
                  <p>{`${stationData.wx.altimeter.value} ${stationData.wx.units.altimeter}`}</p>
                </div>
                <div className="relative h-14 w-full px-2 rounded-lg flex items-end bg-blue-900 overflow-auto">
                  <p className="absolute top-1 left-1 text-sm text-slate-400">
                    Density Alt
                  </p>
                  <p>{`${stationData.wx.density_altitude ? (unit === "imp" || unit === "av" ? stationData.wx.density_altitude.toLocaleString() : Math.round(stationData.wx.density_altitude * 0.3048).toLocaleString()) : "--"} ${unit === "imp" || unit === "av" ? "ft" : "m"}`}</p>
                </div>
                <div className="relative h-14 w-full px-2 rounded-lg flex items-end bg-blue-900 overflow-auto">
                  <p className="absolute top-1 left-1 text-sm text-slate-400">
                    Pressure Alt
                  </p>
                  <p>{`${stationData.wx.pressure_altitude ? (unit === "imp" || unit === "av" ? stationData.wx.pressure_altitude.toLocaleString() : Math.round(stationData.wx.pressure_altitude * 0.3048).toLocaleString()) : "--"} ${unit === "imp" || unit === "av" ? "ft" : "m"}`}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex gap-4 overflow-auto w-[96%]">
              {stationData.fcast.forecast.map((period, i) => {
                let ws = period.wind_speed ? period.wind_speed.value : "--";
                let wg = period.wind_gust ? period.wind_gust.value : "--";
                const wUnit = wxSummary.windUnit;
                const wind = ConvertWind(ws, wg, wUnit, unit);
                const start = DateTime.fromISO(
                  period.transition_start
                    ? period.transition_start.dt
                    : period.start_time.dt,
                  { zone: stationData.tz },
                );
                const end = DateTime.fromISO(period.end_time.dt, {
                  zone: stationData.tz,
                });

                let border = false;
                if (
                  DateTime.fromISO(targetTime, {
                    zone: stationData.tz,
                  }) >= start &&
                  DateTime.fromISO(targetTime, {
                    zone: stationData.tz,
                  }) <= end
                ) {
                  border = true;
                }

                const summary = ConvertWeather(
                  period.clouds,
                  period.wx_codes,
                  stationData.wx,
                  stationData.tz,
                  `${String(start.hour).padStart(2, "0")}:${String(
                    start.minute,
                  ).padStart(2, "0")}`,
                );

                return (
                  <div
                    key={i}
                    className={`w-1/2 md:w-[42%] flex flex-none flex-col gap-2 bg-blue-950 rounded-lg p-2 justify-center items-center overflow-auto ${border ? "border-[5px] border-blue-300 border-solid" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-[2px]">
                        <div className="flex items-baseline gap-[1px]">
                          <h3 className="text-lg text-yellow-500">{`${String(
                            start.hour,
                          ).padStart(2, "0")}`}</h3>
                          <h4 className="text-slate-300 text-sm">{`${
                            start.weekdayShort
                          }`}</h4>
                        </div>
                        -
                        <div className="flex items-baseline gap-[2px]">
                          <h3 className="text-lg text-yellow-500">{`${String(
                            end.hour,
                          ).padStart(2, "0")}`}</h3>
                          <h4 className="text-slate-300 text-sm">{`${
                            end.weekdayShort
                          }`}</h4>
                        </div>
                      </div>
                      <p className="text-slate-300 text-xs">
                        {period.type !== "FROM"
                          ? `${period.type}${period.probability ? (period.probability > 1 ? `${period.probability}%` : `${Math.round(period.probability * 100)}%`) : ""}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {summary.symbol}
                      <p className="text-lg">{summary.condition}</p>
                    </div>
                    <div className="relative h-14 w-full px-2 rounded-lg flex items-end bg-blue-900 overflow-auto">
                      <p className="absolute top-1 left-1 text-sm text-slate-400">
                        Ceil/Vis
                      </p>
                      <div className="absolute flex items-center gap-2 top-0 right-1">
                        <span
                          className={clsx("w-2 h-2 rounded-full", {
                            "bg-green-400": period.flight_rules === "VFR",
                            "bg-blue-400": period.flight_rules === "MVFR",
                            "bg-red-400": period.flight_rules === "IFR",
                            "bg-purple-400": period.flight_rules === "LIFR",
                          })}
                        ></span>
                        <p className="text-sm">{period.flight_rules}</p>
                      </div>
                      <p>{`${unit === "imp" || unit === "av" || summary.ceiling === "--" ? summary.ceiling : summary.ceiling * 0.3048} ${unit === "imp" || unit === "av" ? "ft" : "m"} / ${period.visibility ? period.visibility.repr : "--"}`}</p>
                    </div>

                    <div className="relative h-14 w-full px-2 rounded-lg flex gap-2 items-end bg-blue-900">
                      <p className="absolute top-1 left-1 text-sm text-slate-400">
                        Wind
                      </p>
                      <p className="text-[15px]">{`${wind.wg !== "--" ? `${wind.ws ? wind.ws : "--"}/${wind.wg ? wind.wg : "--"}` : `${wind.ws ? wind.ws : "--"}`} ${unit === "av" || unit === "imp" ? (unit === "av" ? "kt" : "mph") : "kph"}, ${period.wind_direction && period.wind_direction.repr === "VRB" ? "VRB" : period.wind_direction && period.wind_direction.value ? `${period.wind_direction.value}\xB0` : "--"}`}</p>
                      {period.wind_direction &&
                      period.wind_direction.repr == "VRB" ? (
                        <TbArrowsRandom
                          className={"text-blue-400 text-[15px] md:text-[22px]"}
                        />
                      ) : (
                        <LuArrowUp
                          className={"text-blue-400 text-[15px] md:text-[20px]"}
                          style={{
                            rotate: `${period.wind_direction && period.wind_direction.value ? period.wind_direction.value + 180 : 0}deg`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  } else {
    return <div className="w-full h-full"></div>;
  }
}
