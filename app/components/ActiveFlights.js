"use client";
import { useEffect, useState } from "react";
import { IoIosArrowForward } from "react-icons/io";
export default function ActiveFlights({ data, onSetFlightNum, current }) {
  const [flight, setFlight] = useState({ flight_icao: null });
  const [expand, setExpand] = useState(true);
  const flights = data;

  useEffect(() => {
    if (flights && flights.length > 0 && !current) {
      onSetFlightNum(flights[0].flight_icao);
      setFlight({ flight_icao: flights[0].flight_icao });
    } else if (flights && flights.length > 0 && current) {
      const searched = flights.filter(
        (item, i) => item.flight_icao === current,
      );
      if (searched.length === 0) {
        onSetFlightNum(flights[0].flight_icao);
        setFlight({ flight_icao: flights[0].flight_icao });
      }
    }
  }, [flights]);

  return (
    <div
      className={`absolute top-[3vh] md:top-[0vh] right-[1vw] w-[70%] md:w-[35%] ${
        expand ? "h-[30vh]" : "h-[7vh]"
      } flex flex-col justify-items-center items-center`}
      onClick={() => setExpand(!expand)}
    >
      <div className="absolute -top-[3vh] md:top-1 right-2 flex gap-2 items-center z-10">
        <IoIosArrowForward
          className={`${expand ? "rotate-90" : ""} text-[15px] font-bold`}
        />
        <h3 className="text-lg text-blue-300 font-bold">Flights</h3>
      </div>
      <div
        className={`${
          expand ? "flex flex-col gap-2" : "hidden"
        } w-[98%] h-[75%] overflow-auto mt-2 md:mt-10`}
      >
        {flights ? (
          flights.map((flt, i) => {
            return (
              <div
                className={`w-full h-10 z-10 rounded-lg bg-linear-to-br from-slate-800 to-blue-800 mb-4 p-2 flex gap-2 items-center justify-center ${
                  flt.flight_icao === flight.flight_icao ||
                  flt.flight_icao === current
                    ? "border-2 border-slate-200"
                    : ""
                }`}
                key={flt.flight_icao}
                onClick={() => {
                  setFlight({ flight_icao: flt.flight_icao });
                  onSetFlightNum(flt.flight_icao);
                }}
              >
                <p className={`text-slate-300`}>
                  {flt.flight_icao ? flt.flight_icao : "Unknown Carrier"}
                </p>{" "}
                |
                <p className={`text-blue-300 text-sm`}>
                  {flt.status ? flt.status : "N/A"}
                </p>
              </div>
            );
          })
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
