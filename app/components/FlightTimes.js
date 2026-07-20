import { FaPlaneDeparture, FaPlaneArrival } from "react-icons/fa";
import { StatusOrProgress } from "../utils/FlightFunctions";
import { LuMoon, LuSunMedium } from "react-icons/lu";

export default function FlightTimes({ data, tz, wx }) {
  if (!data || !tz || !wx) return;
  const timeData = StatusOrProgress(
    data,
    tz.origin,
    tz.destination,
    "status",
    wx.origin.latest.info.latitude,
    wx.origin.latest.info.longitude,
    wx.destination.latest.info.latitude,
    wx.destination.latest.info.longitude,
  );

  return (
    <section
      className={`min-[768px]:h-[20vh] min-[1000px]:h-[28vh] lmd:h-auto! lmd:flex-1 min-[768px]:w-[48vw] min-[1000px]:w-[40vw] lmd:w-full! flex flex-col gap-2 flex gap-4 text-sm md:text-md md:mr-2 text-slate-300 overflow-auto`}
    >
      <div className="h-full p-2 rounded-lg flex flex-col gap-2 bg-blue-900 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-4 h-4 flex-none rounded-full ${timeData.out_status.color}`}
            ></span>
            <h3 className="text-slate-300 text-lg">
              Departure{" "}
              {`(${timeData.out_status.var.time.replace("+", "").replace("-", "")}${timeData.out_status.var.sign === "+" ? " late" : " early"})`}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-lg text-blue-300">
              {timeData.out_status.formatDate}
            </p>
            {timeData.out_status.dayStatus ? (
              timeData.out_status.dayStatus === "day" ? (
                <LuSunMedium className="text-2xl text-orange-300" />
              ) : (
                <LuMoon className="text-2xl text-purple-400" />
              )
            ) : (
              <></>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <FaPlaneDeparture
                className={`md:text-[30px] text-[24px] text-blue-400`}
              />
              <p className="text-3xl text-blue-300">{`${timeData.out_status.formatTime}`}</p>
              <p className="text-slate-400 text-lg">{`Terminal ${
                data.dep_terminal ? data.dep_terminal : "--"
              }, Gate ${data.dep_gate ? data.dep_gate : "--"}`}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-full p-2 rounded-lg flex flex-col gap-2 bg-blue-900 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-4 h-4 flex-none rounded-full ${timeData.in_status.color}`}
            ></span>
            <h3 className="text-slate-300 text-lg">
              Arrival{" "}
              {`(${timeData.in_status.var.time.replace("+", "").replace("-", "")}${timeData.in_status.var.sign === "+" ? " late" : " early"})`}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-lg text-blue-300">
              {timeData.in_status.formatDate}
            </p>
            {timeData.in_status.dayStatus ? (
              timeData.in_status.dayStatus === "day" ? (
                <LuSunMedium className="text-2xl text-orange-300" />
              ) : (
                <LuMoon className="text-2xl text-purple-400" />
              )
            ) : (
              <></>
            )}
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <FaPlaneArrival
              className={`md:text-[30px] text-[24px] text-yellow-500`}
            />
            <p className="text-3xl text-blue-300">{`${timeData.in_status.formatTime}`}</p>
            <p className="text-slate-400 text-lg">{`Terminal ${
              data.arr_terminal ? data.arr_terminal : "--"
            }, Gate ${data.arr_gate ? data.arr_gate : "--"}`}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
