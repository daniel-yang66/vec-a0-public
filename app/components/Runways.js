"use client";

import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { useRef, useEffect, useState } from "react";
import { LuArrowUp } from "react-icons/lu";
import { IoIosArrowForward } from "react-icons/io";
import { Windcomponent } from "../utils/Math";
import { ConvertWind } from "../utils/ConvertWeather";
import { motion } from "framer-motion";
const geomagnetism = require("geomagnetism");
import "../globals.css";
import { TbArrowsRandom } from "react-icons/tb";

export default function Runways({ info, runways, unit }) {
  const map = useRef(null);
  const mapContainer = useRef(null);
  const sources = useRef(0);
  const popups = useRef([]);
  const [done, setDone] = useState(false);
  const [activeRwy, setActiveRwy] = useState();
  const [calcRwy, setCalcRwy] = useState("0");
  const [activeRwyData, setActiveRwyData] = useState();
  const [expand, setExpand] = useState(true);

  const GetSliderPosition = () => {
    if (calcRwy) {
      return calcRwy === "1" ? 1 : 0;
    }
  };

  useEffect(() => {
    if (map.current) return;
    maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_TILER_TOKEN;

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.TOPO_V4.DARK,
      center: [-114, 33],
      zoom: 2,
      navigationControl: false,
      geolocateControl: false,
      scaleControl: false,
    });

    map.current.on("load", () => {
      setDone(true);
    });

    return () => {
      map.current.remove();
    };
  }, []);

  useEffect(() => {
    if (!runways || !done) return;

    if (sources.current > 0) {
      for (let i = 0; i < sources.current; i++) {
        map.current.removeLayer(`runway${i}`);
        map.current.removeSource(`runway${i}`);
      }
    }

    if (popups.current.length > 0) {
      popups.current.forEach((p) => p.remove());
    }
    sources.current = 0;
    popups.current = [];
    setActiveRwyData(null);

    runways.forEach((rwy, i) => {
      if (
        rwy.le_longitude_deg &&
        rwy.le_latitude_deg &&
        rwy.he_longitude_deg &&
        rwy.he_latitude_deg &&
        rwy.closed === 0
      ) {
        sources.current += 1;

        const popupLe = new maptilersdk.Popup({
          closeButton: false,
          closeOnClick: false,
          className: "transparent-popup",
          offset: [0, -18],
          anchor: "bottom",
        })
          .setLngLat([rwy.le_longitude_deg, rwy.le_latitude_deg])
          .setHTML(`<div class="rwy-label">${rwy.le_ident}</div>`)
          .addTo(map.current);

        const popupHe = new maptilersdk.Popup({
          closeButton: false,
          closeOnClick: false,
          className: "transparent-popup",
          offset: [0, -18],
          anchor: "bottom",
        })
          .setLngLat([rwy.he_longitude_deg, rwy.he_latitude_deg])
          .setHTML(`<div class="rwy-label">${rwy.he_ident}</div>`)
          .addTo(map.current);
        popups.current = [...popups.current, popupHe, popupLe];

        map.current.addSource(`runway${i}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
                [rwy.he_longitude_deg, rwy.he_latitude_deg],
                [rwy.le_longitude_deg, rwy.le_latitude_deg],
              ],
            },
          },
        });

        map.current.addLayer({
          id: `runway${i}`,
          type: "line",
          source: `runway${i}`,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "lightskyblue",
            "line-width": 4,
          },
        });
        map.current.flyTo({
          center: [info.wx.info.longitude, info.wx.info.latitude],
          speed: 0.7,
          zoom: 13,
        });
      }
    });
  }, [runways, done]);

  useEffect(() => {
    if (!activeRwy || activeRwy === "" || !info) return;

    const data = info.wx.info.runways.filter((item, i) => {
      return (
        `${item.ident1.padStart(3, "0")}/${item.ident2.padStart(3, "0")}` ===
        activeRwy
      );
    })[0];

    const metrics = runways.filter((item, i) => {
      return (
        `${item.le_ident.padStart(3, "0")}/${item.he_ident.padStart(3, "0")}` ===
          activeRwy ||
        `${item.he_ident.padStart(3, "0")}/${item.le_ident.padStart(3, "0")}` ===
          activeRwy
      );
    })[0];
    const model = geomagnetism.model();
    let varData = model.point([info.wx.info.latitude, info.wx.info.longitude]);
    varData = varData.decl ? varData.decl : 0;

    let slope = "--";
    let lda = "--";
    if (
      metrics.he_elevation_ft &&
      metrics.le_elevation_ft &&
      metrics.length_ft
    ) {
      if (
        (calcRwy === "0"
          ? data.ident1.padStart(3, "0")
          : data.ident2.padStart(3, "0")) === metrics.le_ident.padStart(3, "0")
      ) {
        slope = (
          ((metrics.he_elevation_ft - metrics.le_elevation_ft) /
            metrics.length_ft) *
          100
        ).toFixed(2);
        lda =
          unit === "av" || unit === "imp"
            ? (
                data.length_ft - metrics.le_displaced_threshold_ft
              ).toLocaleString()
            : Math.round(
                (data.length_ft - metrics.le_displaced_threshold_ft) * 0.3048,
              ).toLocaleString();
      } else if (
        (calcRwy === "0"
          ? data.ident1.padStart(3, "0")
          : data.ident2.padStart(3, "0")) === metrics.he_ident.padStart(3, "0")
      ) {
        slope = (
          ((metrics.le_elevation_ft - metrics.he_elevation_ft) /
            metrics.length_ft) *
          100
        ).toFixed(2);
        lda =
          unit === "av" || unit === "imp"
            ? (
                data.length_ft - metrics.he_displaced_threshold_ft
              ).toLocaleString()
            : Math.round(
                (data.length_ft - metrics.he_displaced_threshold_ft) * 0.3048,
              ).toLocaleString();
      }
    }
    let vrbWind = false;

    if (info.wx.wind_direction.repr === "VRB") {
      vrbWind = true;
    }
    const windComp = Windcomponent(
      info.wx.wind_direction.value ? info.wx.wind_direction.value + varData : 0,
      calcRwy === "0" ? data.bearing1 : data.bearing2,
    );
    const windValue =
      info.wx.wind_speed &&
      info.wx.wind_speed.value &&
      info.wx.wind_speed.value !== 0
        ? ConvertWind(
            info.wx.wind_speed ? info.wx.wind_speed.value : "--",
            info.wx.wind_gust ? info.wx.wind_gust.value : "--",
            info.wx.units.wind_speed,
            unit,
          )
        : 0;

    setActiveRwyData({
      data: data,
      lda: lda,
      slope: slope,
      metrics: metrics,
      wc: windComp,
      wv: windValue,
      vrb: vrbWind,
    });
  }, [activeRwy, calcRwy]);

  return (
    <div className="relative">
      <div
        id="map-container"
        ref={mapContainer}
        className="rounded-lg w-[96vw] md:w-[50vw] h-[50vh] md:h-[60vh]"
      />

      <div className="flex flex-col gap-2 absolute top-1 left-1">
        <div
          className=" flex gap-2 items-center"
          onClick={() => setExpand(!expand)}
        >
          <IoIosArrowForward
            className={`${expand ? "rotate-90" : ""} text-[15px] font-bold`}
          />
          <h3
            className={`text-md
                      text-blue-400
                     font-bold`}
          >
            Options
          </h3>
        </div>

        <div className={` ${expand ? "flex flex-col gap-2" : "hidden"}`}>
          <select
            onChange={(e) => setActiveRwy(e.target.value)}
            className={`h-6 bg-blue-400 text-center text-slate-900 font-semibold rounded-lg hover:cursor-pointer px-2 text-sm`}
          >
            <option value={""}>Select</option>
            {info.wx.info.runways.map((item, i) => {
              return (
                <option
                  value={`${item.ident1.padStart(3, "0")}/${item.ident2.padStart(3, "0")}`}
                  key={item.ident1}
                >{`${item.ident1} / ${item.ident2}`}</option>
              );
            })}
          </select>
          {activeRwyData && activeRwy !== "" ? (
            <div className="flex flex-col gap-2 p-2 bg-blue-900 rounded-lg font-semibold text-slate-300 text-md">
              <div className="flex gap-2 items-baseline">
                <p className="text-sm text-slate-400">Len:</p>
                <p>
                  {unit === "av" || unit === "imp"
                    ? activeRwyData.data.length_ft.toLocaleString()
                    : Math.round(
                        activeRwyData.data.length_ft * 0.3048,
                      ).toLocaleString()}
                  {unit === "av" || unit === "imp" ? " ft" : " m"}
                </p>
              </div>
              <div className="flex gap-2 items-baseline">
                <p className="text-sm text-slate-400">Wid:</p>
                <p>
                  {unit === "av" || unit === "imp"
                    ? activeRwyData.data.width_ft.toLocaleString()
                    : Math.round(
                        activeRwyData.data.width_ft * 0.3048,
                      ).toLocaleString()}
                  {unit === "av" || unit === "imp" ? " ft" : " m"}
                </p>
              </div>
              <div className="flex gap-2 items-baseline">
                <p className="text-sm text-slate-400">Surf:</p>
                <p>
                  {activeRwyData.data.surface
                    ? activeRwyData.data.surface.toUpperCase()
                    : "N/A"}
                </p>
              </div>
              <div className="flex gap-2 items-baseline">
                <p className="text-sm text-slate-400">Lights:</p>
                <p>{activeRwyData.data.lights ? "True" : "False"}</p>
              </div>

              <div
                className={`flex w-full items-center justify-self-center h-6 bg-slate-500 rounded-md relative mt-2 mb-2 font-semibold`}
              >
                <motion.div
                  className="absolute bg-linear-to-br from-slate-700 to-blue-700 rounded-md shadow-sm w-1/2 h-full "
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
                    setCalcRwy("0");
                  }}
                  className="flex justify-center items-center transition-colors duration-200 relative z-20 w-1/2"
                >
                  <div className="flex gap-2 items-center">
                    {activeRwyData.data.ident1}
                  </div>
                </div>
                <div
                  onClick={() => {
                    setCalcRwy("1");
                  }}
                  className="flex justify-center items-center transition-colors duration-200 relative z-20 w-1/2"
                >
                  <div className="flex gap-2 items-center">
                    {activeRwyData.data.ident2}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 items-baseline">
                <p className="text-sm text-slate-400">LDA:</p>
                <p>
                  {activeRwyData.lda}
                  {unit === "av" || unit === "imp" ? " ft" : " m"}
                </p>
              </div>
              <div className="flex gap-2 items-baseline">
                <p className="text-sm text-slate-400">Slope:</p>
                <p>{`${activeRwyData.slope} %`}</p>
              </div>

              {!activeRwyData.vrb ? (
                <div className="flex gap-2 items-center">
                  <div className="flex items-center">
                    <LuArrowUp
                      className="text-[18px] text-slate-400"
                      style={{
                        rotate: `${activeRwyData.wc.h <= 0 ? "" : "-"}90deg`,
                      }}
                    />
                    <p>
                      {Math.abs(
                        Math.round(
                          (activeRwyData.wv.wg !== "--"
                            ? activeRwyData.wv.wg
                            : activeRwyData.wv.ws) * activeRwyData.wc.h,
                        ) || 0,
                      )}
                      {unit === "av" || unit === "imp"
                        ? unit === "av"
                          ? "kt"
                          : "mph"
                        : "kph"}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <LuArrowUp
                      className={`text-[18px] ${activeRwyData.wc.v <= 0 ? "text-red-400" : "text-emerald-400"}`}
                      style={{
                        rotate: `${activeRwyData.wc.v <= 0 ? 0 : 180}deg`,
                      }}
                    />
                    <p>
                      {Math.abs(
                        Math.round(
                          (activeRwyData.wv.wg !== "--"
                            ? activeRwyData.wv.wg
                            : activeRwyData.wv.ws) * activeRwyData.wc.v,
                        ) || 0,
                      )}
                      {unit === "av" || unit === "imp"
                        ? unit === "av"
                          ? "kt"
                          : "mph"
                        : "kph"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <p>
                    Wind:{" "}
                    {activeRwyData.wv.wg !== "--"
                      ? activeRwyData.wv.wg
                      : activeRwyData.wv.ws}
                    {unit === "av" || unit === "imp"
                      ? unit === "av"
                        ? "kt"
                        : "mph"
                      : "kph"}
                  </p>
                  <TbArrowsRandom className="text-[22px] text-blue-400" />
                </div>
              )}
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}
