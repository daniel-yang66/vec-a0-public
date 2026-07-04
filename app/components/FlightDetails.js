"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Blur from "./Blur";
import { GetRunways } from "../utils/Database";
import { IoMdCloseCircle } from "react-icons/io";
import Loading from "./Loading";
import { Notify } from "../utils/Toast";
import Atis from "../api/Atis";
import Charts from "../api/Charts";
import AtisInfo from "./AtisInfo";
import General from "./General";
import Runways from "./Runways";
import Notams from "./Notams";
import Notam from "../api/Notam";

export default function FlightDetails({
  onSetDetails,
  flight,
  details,
  unit,
  stationData,
  dark,
  refreshTracker,
}) {
  const [charts, setCharts] = useState();
  const [activeChart, setActiveChart] = useState();
  const [viewType, setViewType] = useState("general");
  const [atis, setAtis] = useState();
  const [notams, setNotams] = useState();
  const [runways, setRunways] = useState({ dep: null, arr: null });
  const [airport, setAirport] = useState("dep");
  const [loading, setLoading] = useState(false);
  const loadingTracker = useRef(0);
  const refreshTrackerInternal = useRef(0);

  const GetSliderPositionAirport = () => {
    return airport === "dep" ? 0 : 1;
  };

  function startLoading() {
    loadingTracker.current += 1;
    setLoading(true);
  }
  function stopLoading() {
    loadingTracker.current = Math.max(0, loadingTracker.current - 1);
    if (loadingTracker.current === 0) {
      setLoading(false);
    }
  }

  async function GetAtisCharts(dep, arr) {
    // console.log("helloatis");
    startLoading();

    try {
      try {
        const chartDataDep = await Charts(dep);
        const chartDataArr = await Charts(arr);

        setCharts({
          dep: chartDataDep && chartDataDep.charts ? chartDataDep.charts : null,
          arr: chartDataArr && chartDataArr.charts ? chartDataArr.charts : null,
        });
      } catch {
        Notify("Failed to get aerodrome charts", "err");
      }

      try {
        const atisDep = await Atis(dep);
        const atisArr = await Atis(arr);

        setAtis({
          dep:
            atisDep && atisDep[0] && atisDep[0].datis
              ? atisDep[0].datis.split(".")
              : null,
          arr:
            atisArr && atisArr[0] && atisArr[0].datis
              ? atisArr[0].datis.split(".")
              : null,
        });
      } catch {
        Notify("Failed to get ATIS", "err");
      }
    } catch {
      Notify("Failed to get ATIS and Charts", "err");
    } finally {
      stopLoading();
    }
  }
  async function GetNotam(dep, arr) {
    // console.log("hellonotam");

    startLoading();

    try {
      const notamDep = await Notam(dep);
      const notamArr = await Notam(arr);

      setNotams({
        dep: notamDep && notamDep.notams ? notamDep.notams : null,
        arr: notamArr && notamArr.notams ? notamArr.notams : null,
      });
    } catch {
      Notify("Failed to get NOTAMS", "err");
    } finally {
      stopLoading();
    }
  }

  async function RetrieveRunwayData(dep, arr) {
    startLoading();

    try {
      const data = await GetRunways(dep, arr);
      setRunways({ dep: data.origin, arr: data.destination });
    } catch {
      Notify("Failed to get runway data", "err");
    } finally {
      stopLoading();
    }
  }

  useEffect(() => {
    if (details === "off") return;

    let refresh = false;
    if (refreshTrackerInternal.current !== refreshTracker.current) {
      refresh = true;
    }
    if (refresh) {
      GetAtisCharts(flight.dep_icao, flight.arr_icao);
      GetNotam(flight.dep_icao, flight.arr_icao);
      refreshTrackerInternal.current = refreshTracker.current;
    } else {
      if (!charts || !atis) {
        GetAtisCharts(flight.dep_icao, flight.arr_icao);
      }

      if (viewType === "notams" && !notams) {
        GetNotam(flight.dep_icao, flight.arr_icao);
      }

      if (!runways.dep && viewType === "rwy") {
        RetrieveRunwayData(flight.dep_icao, flight.arr_icao);
      }
    }
  }, [flight, details, viewType, unit]);

  if (!loading && details === "on") {
    return (
      <>
        <Blur />
        <section
          className={`fixed top-[7vh] min-[768px]:top-[10vh] min-[1000px]:top-[7vh] left-[2vw] md:left-[6vw] z-40 flex flex-col gap-2 items-center w-[96vw] h-[85vh] min-[768px]:h-[75vh] md:w-[88vw] min-[1000px]:h-[85vh] rounded-lg bg-linear-to-br ${dark ? "from-slate-900 to-blue-800" : "from-slate-900 to-blue-500"} border-2 border-solid border-slate-400 p-2 text-slate-300 text-md`}
        >
          <IoMdCloseCircle
            className="text-[30px] absolute top-1 right-1 text-red-500"
            onClick={() => onSetDetails("off")}
          />

          <section
            className={`w-full h-[95%] flex flex-col md:flex-row flex-none gap-4 justify-center md:items-center overflow-auto`}
          >
            <div className="flex flex-row md:flex-col gap-2 max-sm:h-[9vh] md:h-[95%] w-full md:w-[25%] overflow-auto">
              <div
                className={`flex flex-none w-24 md:w-full items-center justify-self-center h-8 bg-slate-500 rounded-md relative mb-4 font-semibold`}
              >
                <motion.div
                  className="absolute bg-linear-to-br from-slate-700 to-blue-700 rounded-md shadow-sm w-1/2 h-full "
                  initial={false}
                  animate={{
                    x: GetSliderPositionAirport() * 100 + "%",
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
                    setAirport("dep");
                  }}
                  className="flex justify-center items-center transition-colors duration-200 relative z-20 w-1/2"
                >
                  <div className="flex gap-2 items-center">DEP</div>
                </div>
                <div
                  onClick={() => {
                    setAirport("arr");
                  }}
                  className="flex justify-center items-center transition-colors duration-200 relative z-20 w-1/2"
                >
                  <div className="flex gap-2 items-center">ARR</div>
                </div>
              </div>
              <div
                className={` flex-none w-20 md:w-full h-8 rounded-lg bg-blue-500 text-slate-900 grid items-center justify-items-center font-semibold ${viewType === "general" ? "border-solid border-2 border-slate-300" : ""}`}
                onClick={() => setViewType("general")}
              >
                Airport
              </div>
              <div
                className={`flex-none w-20 md:w-full h-8 rounded-lg bg-blue-500 text-slate-900 grid items-center justify-items-center font-semibold ${viewType === "atis" ? "border-solid border-2 border-slate-300" : ""}`}
                onClick={() => setViewType("atis")}
              >
                D-ATIS
              </div>
              <div
                className={`flex-none w-20 md:w-full h-8 rounded-lg bg-blue-500 text-slate-900 grid items-center justify-items-center font-semibold ${viewType === "notams" ? "border-solid border-2 border-slate-300" : ""}`}
                onClick={() => setViewType("notams")}
              >
                NOTAMs
              </div>

              <div
                className={`flex-none w-20 md:w-full h-8 rounded-lg bg-blue-500 text-slate-900 grid items-center justify-items-center font-semibold ${viewType === "charts" ? "border-solid border-2 border-slate-300" : ""}`}
                onClick={() => setViewType("charts")}
              >
                Charts
              </div>
              <div
                className={`flex-none w-20 md:w-full h-8 rounded-lg bg-blue-500 text-slate-900 grid items-center justify-items-center font-semibold ${viewType === "rwy" ? "border-solid border-2 border-slate-300" : ""}`}
                onClick={() => setViewType("rwy")}
              >
                Runways
              </div>
            </div>
            <span
              className={
                " bg-linear-to-r md:bg-linear-to-b from-slate-600 to-blue-500 max-sm:invisible w-[98%] md:w-[5px] h-[8px] md:h-[98%] rounded-md"
              }
            ></span>
            {viewType === "general" && (
              <General
                stationData={
                  airport === "dep"
                    ? {
                        wx: stationData.weather.origin.latest,
                        fcast: stationData.weather.origin.forecast,
                        tz: stationData.tz.origin,
                      }
                    : {
                        wx: stationData.weather.destination.latest,
                        fcast: stationData.weather.destination.forecast,
                        tz: stationData.tz.destination,
                      }
                }
                unit={unit}
                targetTime={
                  airport === "dep" ? flight.dep_time_utc : flight.arr_time_utc
                }
              />
            )}
            {viewType === "atis" && atis && (
              <AtisInfo atis={airport === "dep" ? atis.dep : atis.arr} />
            )}
            {viewType === "notams" && notams && (
              <Notams notams={airport === "dep" ? notams.dep : notams.arr} />
            )}

            {viewType === "charts" && (
              <div className="flex flex-col gap-4 w-full h-[90%]">
                <select
                  onChange={(e) => {
                    setActiveChart(e.target.value);
                    setViewType("charts");
                  }}
                  className={`flex-none w-20 md:w-full h-8 rounded-lg bg-blue-400 text-slate-900 text-center font-semibold`}
                >
                  <option className="text-md text-center" value={""}>
                    Select Chart
                  </option>
                  {charts &&
                    (airport === "dep" ? charts.dep : charts.arr) &&
                    Object.entries(
                      airport === "dep" ? charts.dep : charts.arr,
                    ).map(([k, v], i) => {
                      return (
                        <optgroup
                          key={i}
                          className="text-lg font-bold text-slate-900 mb-2"
                          label={k.replace("_", " ").toUpperCase()}
                        >
                          {v.map((item, i) => {
                            return (
                              <option
                                key={i}
                                value={`${item.pdf_url}||${item.chart_name}`}
                                className="text-md text-center"
                              >
                                {item.chart_name}
                              </option>
                            );
                          })}
                        </optgroup>
                      );
                    })}
                </select>
                {activeChart && (
                  <object
                    data={activeChart.split("||")[0]}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                  ></object>
                )}
              </div>
            )}

            {viewType === "rwy" && (
              <Runways
                info={
                  airport === "dep"
                    ? {
                        wx: stationData.weather.origin.latest,
                        tz: stationData.tz.origin,
                      }
                    : {
                        wx: stationData.weather.destination.latest,
                        tz: stationData.tz.destination,
                      }
                }
                runways={airport === "dep" ? runways.dep : runways.arr}
                unit={unit}
              />
            )}
          </section>
        </section>
      </>
    );
  } else if (loading) {
    return <Loading />;
  } else {
    return <></>;
  }
}
