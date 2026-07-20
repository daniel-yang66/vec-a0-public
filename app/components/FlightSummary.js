"use client";
import { PiAirplaneInFlightFill } from "react-icons/pi";
import { useEffect, useRef, useState } from "react";
import { ConvertWeather } from "../utils/ConvertWeather";
import { StatusOrProgress } from "../utils/FlightFunctions";
import { GetAirlineLogo } from "../utils/Database";
import { Notify } from "../utils/Toast";
import { ConvertTemp } from "../utils/UnitConversion";

export default function FlightSummary({ data, weather, tz, unit }) {
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);
  const [symbols, setSymbols] = useState();
  const [progress, setProgress] = useState({ total: "--", rem: "--", pct: 0 });
  const [airline, setAirline] = useState({ name: "--", logo: null });
  const storedAirlines = useRef({});

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
    if (!data || !weather || !tz) return;

    if (!Object.keys(storedAirlines.current).includes(data.airline_iata)) {
      async function RetrieveAirlineLogo() {
        try {
          const airlineInfo = await GetAirlineLogo(data.airline_iata);
          setAirline({
            logo: airlineInfo.length > 0 ? airlineInfo[0].logo : null,
            name: airlineInfo.length > 0 ? airlineInfo[0].name : "--",
          });

          storedAirlines.current[data.airline_iata] = {
            logo: airlineInfo.length > 0 ? airlineInfo[0].logo : null,
            name: airlineInfo.length > 0 ? airlineInfo[0].name : "--",
          };
        } catch {
          Notify("No Airline Found", "err");
          setAirline({
            logo: null,
            name: "--",
          });
        }
      }
      RetrieveAirlineLogo();
    } else {
      setAirline(storedAirlines.current[data.airline_iata]);
    }
    const depSymbol = ConvertWeather(
      weather.origin.latest.clouds,
      weather.origin.latest.wx_codes,
      weather.origin.latest,
      tz.origin,
    ).symbol;
    const arrSymbol = ConvertWeather(
      weather.destination.latest.clouds,
      weather.destination.latest.wx_codes,
      weather.destination.latest,
      tz.destination,
    ).symbol;
    setSymbols({ origin: depSymbol, destination: arrSymbol });

    const progData = StatusOrProgress(
      data,
      tz.origin,
      tz.destination,
      "progress",
    );
    setProgress({
      total: progData.total,
      rem: progData.remaining,
      pct: progData.pct,
    });
  }, [data, weather, tz]);

  if (data && (weather ? weather.origin || weather.destination : false)) {
    return (
      <section
        className={`relative grid justify-items-center h-[23vh] min-[768px]:h-[20vh] min-[1000px]:h-[28vh] lmd:h-[25vh]! min-[768px]:w-[51vw] min-[1000px]:w-[38vw] lmd:w-full! bg-linear-to-br from-slate-950 to-blue-900 rounded-lg p-2 border-2 border-solid border-blue-900 text-slate-300`}
      >
        <p className={`absolute top-1 left-1 text-blue-400 text-sm md:text-lg`}>
          {airline.name}
        </p>
        {airline.logo ? (
          <img
            src={`${airline.logo}`}
            alt="Logo"
            className="rounded-tr-lg rounded-bl-lg absolute top-1 right-1 w-[36px] h-[36px] md:w-[41px] md:h-[41px]"
          />
        ) : (
          <></>
        )}
        <PiAirplaneInFlightFill
          className={`text-blue-400 text-[30px] md:text-[35px]`}
        />

        <div className="w-[335px] flex justify-between -mb-4 md:-mb-8">
          <div className="inline-flex items-top">
            {symbols ? symbols.origin : <></>}
            <p className="text-[14px] font-semibold">{`${ConvertTemp(unit, weather.origin.latest.temperature.value)}\xB0${unit === "met" || unit === "av" ? weather.origin.latest.units.temperature : "F"}`}</p>
          </div>
          <div className="inline-flex items-top -mr-[6px] md:-mr-[11px]">
            {symbols ? symbols.destination : <></>}
            <p className="text-[14px] font-semibold">{`${ConvertTemp(unit, weather.destination.latest.temperature.value)}\xB0${unit === "met" || unit === "av" ? weather.destination.latest.units.temperature : "F"}`}</p>
          </div>{" "}
        </div>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[320px] h-[70px] -mt-[15%] min-[768px]:-mt-[11%] min-[1000px]:-mt-[9%]"
          preserveAspectRatio="none"
        >
          <path
            ref={pathRef}
            d={"M10 60 Q150 3 290 60"}
            fill="none"
            stroke={"oklch(92.9% 0.013 255.508)"}
            strokeWidth="3"
            strokeDasharray="16 5"
            strokeLinecap="round"
          />
          <path
            d={"M10 60 Q150 3 290 60"}
            fill="none"
            stroke={"oklch(84.5% 0.143 164.978)"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={pathLength}
            strokeDashoffset={pathLength - (pathLength * progress.pct) / 100}
          />
          <circle cx={10} cy={60} r={7} fill={"oklch(70.7% 0.165 254.624)"} />
          <circle cx={290} cy={60} r={7} fill={"oklch(79.5% 0.184 86.047)"} />
        </svg>

        <div className={`w-[320px] flex justify-between -mt-4`}>
          <div className="grid justify-items-start">
            <p className="text-lg md:text-2xl">
              {data.dep_iata ? data.dep_iata : data.dep_icao}
            </p>
          </div>
          <div className="grid justify-items-center h-[25px] -mt-6 text-blue-300">
            <p className="text-[23px]">{progress.total}</p>
            <p className="text-[15px]">{`${progress.rem} left`}</p>
          </div>
          <div className="grid justify-items-end">
            <p className="mr-4 text-lg md:text-2xl">
              {data.arr_iata ? data.arr_iata : data.arr_icao}
            </p>
          </div>{" "}
        </div>
      </section>
    );
  } else {
    return <></>;
  }
}
