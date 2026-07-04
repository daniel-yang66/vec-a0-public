"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bearing, distance, point } from "@turf/turf";
import { ConvertAlt, ConvertDist, ConvertSpeed } from "../utils/UnitConversion";
import { TiArrowUpThick } from "react-icons/ti";
import { Notify } from "../utils/Toast";
import { GetAirlineLogos } from "../utils/Database";
export default function NearbyFlts({ flights, unit, coords }) {
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const [logos, setLogos] = useState();

  function HandleFlight(text) {
    if (!text || text.length <= 0) {
      Notify("Not a valid flight number", "err");

      return;
    }
    const params = new URLSearchParams(searchParams);
    text ? params.set("flightno", text) : params.delete("flightno");
    params.delete("route");
    replace(`/?${params.toString()}`);
  }
  async function RetrieveAirlineLogos(iatas) {
    try {
      const logoData = await GetAirlineLogos(iatas);
      setLogos(logoData);
    } catch {
      setLogos(null);
    }
  }

  useEffect(() => {
    if (!flights) return;

    RetrieveAirlineLogos(flights.map((item, i) => String(item.airline_iata)));
  }, [flights]);

  return (
    <div className="flex flex-col gap-2 md:grid md:grid-rows-3 md:grid-flow-col overflow-auto w-[92vw] max-sm:h-[50vh]">
      {flights
        .sort((a, b) => {
          return String(a.flight_icao).localeCompare(String(b.flight_icao));
        })
        .map((item, i) => {
          let planeCoords;
          let brg;
          let dist = "--";
          let logo;
          const userCoords = point([coords.lon, coords.lat]);
          if (item.lng && item.lat) {
            planeCoords = point([item.lng, item.lat]);

            brg = bearing(userCoords, planeCoords);
            dist = ConvertDist(
              unit,
              distance(planeCoords, userCoords, { units: "miles" }),
            );
          }
          if (logos && logos.length > 0) {
            const logoFiltered = logos.filter(
              (log, i) => log.iata === String(item.airline_iata),
            );
            logo = logoFiltered.length > 0 ? logoFiltered[0] : null;
          }

          return (
            <div
              key={i}
              onClick={() => {
                HandleFlight(
                  item.flight_icao || item.flight_iata
                    ? item.flight_icao
                      ? item.flight_icao
                      : item.flight_iata
                    : "--",
                );
              }}
              className="relative grid items-center justify-items-center text-slate-300 text-md font-semibold bg-blue-900 rounded-lg p-2"
            >
              <div className="absolute top-1 left-1">
                <h2 className="text-blue-300 font-bold text-lg">
                  {item.flight_icao || item.flight_iata
                    ? item.flight_icao
                      ? item.flight_icao
                      : item.flight_iata
                    : "--"}
                </h2>
                <h3 className="text-blue-300 font-bold text-md">
                  {item.aircraft_icao ? item.aircraft_icao : "--"}
                </h3>
              </div>

              {logo ? (
                <img
                  src={`${logo.logo}`}
                  alt="Logo"
                  className="rounded-tr-lg rounded-bl-lg absolute top-1 right-1 w-[36px] h-[36px]"
                />
              ) : (
                <></>
              )}
              <p className="text-md text-slate-300 font-semibold mt-6">{`${item.dep_icao || item.dep_iata ? (item.dep_iata ? item.dep_iata : item.dep_icao) : "--"} - ${item.arr_icao || item.arr_iata ? (item.arr_iata ? item.arr_iata : item.arr_icao) : "--"}`}</p>
              <section className="flex gap-4 self-end p-2">
                <div className="flex items-center gap-2">
                  <p className="text-slate-400 font-semibold">Loc:</p>
                  <p>
                    {dist}
                    {unit === "av" || unit === "imp"
                      ? unit === "imp"
                        ? "mi"
                        : "nm"
                      : "km"}
                  </p>
                  {brg ? (
                    <TiArrowUpThick
                      className={`text-blue-400 text-[20px]`}
                      style={{
                        rotate: `${brg}deg`,
                      }}
                    />
                  ) : (
                    <></>
                  )}
                </div>
                <div className="flex flex-none items-center gap-2">
                  <p className="text-slate-400 font-semibold">Alt:</p>
                  <p>
                    {item.alt
                      ? ConvertAlt(
                          unit,
                          item.alt * 3.28,
                          "alt",
                        ).toLocaleString()
                      : "--"}
                    {unit === "av" || unit === "imp" ? "ft" : "m"}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <p className="text-slate-400 font-semibold">SPD:</p>
                  <p>
                    {item.speed ? ConvertSpeed(unit, item.speed * 0.54) : "--"}
                    {unit === "av" || unit === "imp"
                      ? unit === "imp"
                        ? "mph"
                        : "kt"
                      : "kph"}
                  </p>
                </div>
              </section>
            </div>
          );
        })}
    </div>
  );
}
