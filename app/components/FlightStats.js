"use client";
import { useMemo } from "react";
import { FaPlane } from "react-icons/fa";
import { IoMdBusiness } from "react-icons/io";

export default function FlightStats({ flights }) {
  const stats = useMemo(() => {
    const total = flights.length;
    const airlines = new Set(flights.map((f) => f.airline_iata).filter(Boolean))
      .size;

    const counts = new Map();
    for (const f of flights) {
      if (!f.arr_iata) continue;
      const key = f.arr_iata;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const destinations = [...counts.entries()]
      .map(([key, count]) => {
        return { key, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return {
      total,
      airlines,
      destinations,
      maxRoute: destinations[0]?.count || 1,
    };
  }, [flights]);

  const card =
    "rounded-xl border border-blue-400/20 bg-slate-900/60 p-3 flex flex-col justify-between";
  const head = "flex items-center gap-2 text-blue-400";
  const label = "text-[10px] font-bold uppercase tracking-wider text-slate-400";
  const value = "mt-1 text-2xl font-extrabold text-blue-200 tabular-nums";

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className={card}>
          <div className={head}>
            <FaPlane className="text-[14px]" />
            <p className={label}>Flights Tracked</p>
          </div>
          <p className={value}>{stats.total.toLocaleString()}</p>
        </div>

        <div className={card}>
          <div className={head}>
            <IoMdBusiness className="text-[14px]" />
            <p className={label}>Air Carriers</p>
          </div>
          <p className={value}>{stats.airlines.toLocaleString()}</p>
        </div>
      </div>
      <div className="rounded-xl border border-blue-400/20 bg-slate-900/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">
            Top destinations
          </h3>
        </div>
        {stats.destinations.length === 0 ? (
          <p className="text-xs font-medium text-slate-500">Not enough data</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {stats.destinations.map((r, i) => (
              <li key={`${r.key}`}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 text-[10px] font-extrabold text-blue-300">
                      {i + 1}
                    </span>
                    <span className="text-sm font-extrabold tracking-wide text-slate-200">
                      {r.key}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {r.count} {r.count === 1 ? "flt" : "flts"}
                  </span>
                </div>
                <div className="h-[5px] w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-amber-400"
                    style={{ width: `${(r.count / stats.maxRoute) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
