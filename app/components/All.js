"use client";

import { useEffect, useState, useRef } from "react";
import { point, buffer, bbox } from "@turf/turf";
import Loading from "./Loading";
import Map from "./Map";
import ActiveFlights from "./ActiveFlights";
import FlightSummary from "./FlightSummary";
import FlightTimes from "./FlightTimes";
import AirportWeather from "../api/AirportWeather";
import FlightDetails from "./FlightDetails";
import NearbyFlts from "./NearbyFlights";
import Gmt from "./Gmt";
import Settings from "./Settings";
import { motion } from "framer-motion";
import { Notify } from "../utils/Toast";
import { GetTimeOfDay } from "../utils/General";
import { RetrieveLocation } from "../utils/GetLocation";
import { IoMdSettings } from "react-icons/io";
import NearbyFlights from "../api/ProximityFlights";
import RealTime from "../api/Flights";
import tz_lookup from "tz-lookup";

export default function All({ flightNo, route }) {
  const [flight, setFlight] = useState();
  const [existing, setExisting] = useState([]);
  const [type, setType] = useState("map");
  const [flightNum, setFlightNum] = useState();
  const [stationData, setStationData] = useState();
  const [details, setDetails] = useState("off");
  const [userCoords, setUserCoords] = useState();
  const [nearbyFlights, setNearbyFlights] = useState();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    unit: "av",
    dark: false,
    refresh: "off",
    darkMode: "off",
  });
  const [settingsClose, setSettingsClose] = useState(true);
  const [trigger, setTrigger] = useState(0);
  const param = useRef({ flt: null, rt: null });
  const autoRefresh = useRef(false);
  const lastStationRefresh = useRef(Date.now());
  const loadingTracker = useRef(0);
  const stationRef = useRef({});
  const refreshTracker = useRef(0);
  const prevFlightNum = useRef();

  function startLoading() {
    if (autoRefresh.current) return;
    loadingTracker.current += 1;
    setLoading(true);
  }
  function stopLoading() {
    if (loadingTracker.current === 0) return;
    loadingTracker.current -= 1;
    if (loadingTracker.current === 0) {
      setLoading(false);
    }
  }

  const GetSliderPosition = () => {
    if (type) {
      return type === "map" ? 0 : 1;
    }
  };

  async function GetNearbyFlights(lat1, lon1, lat2, lon2) {
    try {
      if (!autoRefresh.current) {
        startLoading();
      }

      const flights = await NearbyFlights(lat1, lon1, lat2, lon2);
      setNearbyFlights(flights);
    } catch {
      return;
    } finally {
      stopLoading();
    }
  }
  async function GetStationWeather(airport) {
    if (
      Object.hasOwn(stationRef.current, airport) &&
      (Date.now() - lastStationRefresh.current) / 60000 < 10
    ) {
      return stationRef.current[airport].weather;
    }
    // console.log("hellostation");
    const stationInfo = await AirportWeather(airport);
    const name = stationInfo.latest.info.city;
    const tz = tz_lookup(
      stationInfo.latest.info.latitude,
      stationInfo.latest.info.longitude,
    );
    stationRef.current[airport] = {
      name: name,
      tz: tz,
      weather: stationInfo,
    };
    return stationInfo;
  }
  async function RetrieveStationData(data) {
    startLoading();
    try {
      const [depWx, arrWx] = await Promise.all([
        GetStationWeather(data.dep_icao),
        GetStationWeather(data.arr_icao),
      ]);
      const ogTz = tz_lookup(
        depWx.latest.info.latitude,
        depWx.latest.info.longitude,
      );
      const dstTz = tz_lookup(
        arrWx.latest.info.latitude,
        arrWx.latest.info.longitude,
      );

      setStationData({
        names: {
          origin: depWx.latest.info.city,
          destination: arrWx.latest.info.city,
        },
        tz: { origin: ogTz, destination: dstTz },
        weather: { origin: depWx, destination: arrWx },
      });
    } catch {
      return;
    } finally {
      stopLoading();
    }
  }

  async function GetData(flt, rt) {
    if (!autoRefresh.current) {
      setExisting([]);
      setFlight(null);
      setFlightNum(null);
      setStationData(null);
      startLoading();
    }

    try {
      // console.log("helloflt");
      let flightData;
      if (!rt) {
        flightData = await RealTime(null, null, flt);
      } else {
        flightData = await RealTime(rt.split(",")[0], rt.split(",")[1], null);
      }
      if (!flightData || flightData.length === 0) return;

      if (autoRefresh.current) {
        setExisting(flightData);
        setTrigger((prev) => (prev === 0 ? 1 : 0));
      } else {
        setExisting(flightData);
      }

      RetrieveStationData(flightData[0]);
    } catch (err) {
      Notify(`Failed to retrieve flight info`, "err");
    } finally {
      stopLoading();
    }
  }
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoords({ lat: latitude, lon: longitude });
          const center = point([longitude, latitude]);
          const buffered = buffer(center, 100, { units: "nauticalmiles" });
          const [minLon, minLat, maxLon, maxLat] = bbox(buffered);
          GetNearbyFlights(minLat, minLon, maxLat, maxLon);
        },

        (error) => {
          return;
        },
      );
    } else {
      return;
    }

    const savedUnit = localStorage.getItem("unit");
    const savedRefresh = localStorage.getItem("refresh");
    const savedDark = localStorage.getItem("dark");
    const savedDarkMode = localStorage.getItem("darkMode");
    setSettings({
      unit: savedUnit ? savedUnit : "av",
      refresh: savedRefresh ? savedRefresh : "off",
      dark: savedDark === "true" ? true : false,
      darkMode: savedDarkMode ? savedDarkMode : "auto",
    });

    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserCoords({ lat: latitude, lon: longitude });
          },

          (error) => {
            return;
          },
        );
      } else {
        return;
      }
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (settings.darkMode !== "auto") return;
    RetrieveLocation(setSettings, userCoords);
    const interval = setInterval(() => {
      RetrieveLocation(setSettings, userCoords);
    }, 60000);

    return () => clearInterval(interval);
  }, [settings.darkMode, userCoords]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (settings.refresh === "on") {
        autoRefresh.current = true;
        refreshTracker.current += 1;
        GetData(param.current.flt, param.current.rt);
        if (!flightNo && !route && userCoords) {
          const center = point([userCoords.lon, userCoords.lat]);
          const buffered = buffer(center, 100, { units: "nauticalmiles" });
          const [minLon, minLat, maxLon, maxLat] = bbox(buffered);
          GetNearbyFlights(minLat, minLon, maxLat, maxLon);
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [settings.refresh]);

  useEffect(() => {
    settings.dark
      ? (document.body.className =
          "p-[2px] w-screen h-screen bg-linear-to-br from-slate-900 to-blue-800 m-0 font-sans")
      : (document.body.className =
          "p-[2px] w-screen h-screen bg-linear-to-br from-slate-900 to-blue-500 m-0 font-sans");
  }, [settings.dark]);

  useEffect(() => {
    param.current = { flt: flightNo, rt: route };
    autoRefresh.current = false;
    GetData(flightNo, route);
  }, [flightNo, route]);

  useEffect(() => {
    if (!flightNum) return;
    if (flightNum !== prevFlightNum.current) {
      autoRefresh.current = false;
    }
    prevFlightNum.current = flightNum;
    const flight = existing.filter((item) => {
      return item.flight_icao === flightNum;
    });

    setFlight(flight[0]);
    RetrieveStationData(flight[0]);
  }, [flightNum, trigger]);

  if (loading) {
    return <Loading />;
  } else if (!flightNo && !route) {
    return nearbyFlights && nearbyFlights.length > 0 ? (
      <div
        className={`grid gap-4 justify-items-center font-bold text-blue-300`}
      >
        <div className="grid justify-items-center gap-2">
          <h1 className="text-[30px] md:text-[37px]">{`Good ${GetTimeOfDay()}`}</h1>
          <h2 className="text-[23px] md:text-[30px]">Welcome to VecA0</h2>
          <div
            onClick={() => setSettingsClose(false)}
            className="flex gap-2 items-center justify-center rounded-lg bg-blue-400 w-24 h-8"
          >
            <IoMdSettings className="text-[20px] text-blue-900" />
            <p className="text-slate-900 text-md font-semibold">Settings</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-center">
          <h3 className="text-[25px] text-blue-300 font-semibold">
            Nearby Flights
          </h3>
          <NearbyFlts
            flights={nearbyFlights}
            unit={settings.unit}
            coords={userCoords}
          />
        </div>
        {!settingsClose ? (
          <Settings
            autoRefresh={autoRefresh}
            settings={settings}
            onSetSettings={setSettings}
            dark={settings.dark}
            onSetSettingsClose={setSettingsClose}
          />
        ) : (
          <></>
        )}
      </div>
    ) : (
      <div
        className={`md:absolute md:top-[50vh] md:left-[50vw] md:-translate-x-1/2 md:-translate-y-1/2 grid gap-2 justify-items-center font-bold text-blue-300`}
      >
        <h1 className="text-[30px] md:text-[37px]">{`Good ${GetTimeOfDay()}`}</h1>
        <h2 className="text-[23px] md:text-[30px]">Welcome to VecA0</h2>
        <div
          onClick={() => setSettingsClose(false)}
          className="flex gap-2 items-center justify-center rounded-lg bg-blue-400 w-24 h-8"
        >
          <IoMdSettings className="text-[20px] text-blue-900" />
          <p className="text-slate-900 text-md font-semibold">Settings</p>
        </div>
      </div>
    );
  } else if (existing.length > 0 || flight) {
    return (
      <div className="grid gap-[2vh] mx-auto w-fit items-center relative text-slate-300 font-semibold">
        <Gmt />

        <div
          className={`flex w-[50vw] md:hidden phl:flex! items-center justify-self-center h-6 bg-slate-500 rounded-md relative mb-2`}
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
              setType("map");
            }}
            className="flex justify-center items-center transition-colors duration-200 relative z-20 w-1/2"
          >
            <h2>Map</h2>
          </div>
          <div
            onClick={() => {
              setType("flt");
            }}
            className="flex justify-center items-center transition-colors duration-200 relative z-20 w-1/2"
          >
            <h2>Info</h2>
          </div>
        </div>
        <div className="flex flex-col gap-[2vh] lmd:flex-row lmd:items-start lmd:gap-[1vw]">
          <div
            className={`${
              type === "map" ? "max-sm:hidden" : ""
            } h-[55vh] min-[768px]:h-[28vh] min-[1000px]:h-[39vh] lmd:h-[80vh]! lmd:w-[38vw]! w-[98vw] flex flex-col gap-[2vh] overflow-auto`}
          >
            <div
              onClick={() => setSettingsClose(false)}
              className="flex gap-2 items-center justify-center rounded-lg bg-blue-400 w-24 h-8"
            >
              <IoMdSettings className="text-[20px] text-blue-900" />
              <p className="text-slate-900 text-md font-semibold">Settings</p>
            </div>
            <div className="flex flex-col md:flex-row lmd:flex-col! gap-4">
              <FlightSummary
                data={flight}
                weather={stationData ? stationData.weather : null}
                tz={stationData ? stationData.tz : null}
                unit={settings.unit}
              />

              <FlightTimes
                data={flight}
                tz={stationData ? stationData.tz : null}
                wx={stationData ? stationData.weather : null}
              />
            </div>
            <FlightDetails
              unit={settings.unit}
              flight={flight}
              onSetDetails={setDetails}
              details={details}
              flightNo={flightNo}
              route={route}
              stationData={stationData}
              dark={settings.dark}
              refreshTracker={refreshTracker}
            />
            {!settingsClose ? (
              <Settings
                autoRefresh={autoRefresh}
                settings={settings}
                onSetSettings={setSettings}
                dark={settings.dark}
                onSetSettingsClose={setSettingsClose}
              />
            ) : (
              <></>
            )}
          </div>

          <div
            className={`
  ${
    type !== "map"
      ? "max-sm:opacity-0 max-sm:max-h-0 max-sm:pointer-events-none"
      : ""
  }
  relative overflow-hidden
  rounded-lg w-[98vw] h-[75vh] min-[768px]:h-[53vh] min-[1000px]:h-[45vh]
  lmd:w-[58vw]! lmd:h-[80vh]! lmd:mt-[calc(2rem+2vh)]
`}
          >
            <ActiveFlights
              data={existing}
              current={flightNum}
              onSetFlightNum={setFlightNum}
            />
            <Map
              flight={flight}
              details={details}
              airports={stationData ? stationData.weather : null}
              onSetDetails={setDetails}
              onSetType={setType}
              unit={settings.unit}
              flightNo={flightNo}
              route={route}
              refreshTracker={refreshTracker}
            />
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <h1
        className={`absolute top-[50vh] left-[50vw] -translate-x-1/2 -translate-y-1/2 grid gap-2 justify-items-center font-bold text-blue-300 text-[30px] md:text-[37px]`}
      >
        No Active Flights
      </h1>
    );
  }
}
