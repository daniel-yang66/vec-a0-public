"use client";
import Blur from "./Blur";
import { useState, useEffect } from "react";
import { IoMdCloseCircle } from "react-icons/io";
export default function Settings({
  autoRefresh,
  onSetSettings,
  settings,
  onSetSettingsClose,
  dark,
}) {
  const [unitActive, setUnitActive] = useState(settings.unit);
  const [refreshActive, setRefreshActive] = useState(settings.refresh);
  const [darkActive, setDarkActive] = useState(settings.darkMode);

  useEffect(() => {
    setUnitActive(settings.unit);
    setRefreshActive(settings.refresh);
    setDarkActive(settings.darkMode);
  }, [settings]);

  return (
    <>
      <Blur />
      <div
        className={`fixed top-[33vh] min-[768px]:top-[35vh] min-[1000px]:top-[30vh] left-[2vw] md:left-[30vw] z-40 flex flex-col gap-2 items-center justify-center w-[96vw] h-[34vh] min-[768px]:h-[30vh] md:w-[40vw] min-[1000px]:h-[40vh] rounded-lg bg-linear-to-br ${dark ? "from-slate-900 to-blue-800" : "from-slate-900 to-blue-500"} border-2 border-solid border-slate-400 p-2`}
      >
        <IoMdCloseCircle
          className="text-[30px] absolute top-1 right-1 text-red-500"
          onClick={() => onSetSettingsClose(true)}
        />
        <div className="flex flex-col gap-2 items-center">
          <p className="text-blue-300 text-lg font-semibold">Units</p>
          <div className="flex gap-2">
            <span
              onClick={() => {
                setUnitActive("av");
                onSetSettings((prev) => {
                  return {
                    unit: "av",
                    refresh: prev.refresh,
                    dark: prev.dark,
                    darkMode: prev.darkMode,
                  };
                });
                localStorage.setItem("unit", "av");
              }}
              className={`grid items-center justify-items-center text-slate-900 ${unitActive === "av" ? "bg-blue-400" : "bg-slate-400"} font-semibold rounded-lg hover:cursor-pointer text-md px-2`}
            >
              Aviation
            </span>
            <span
              onClick={() => {
                setUnitActive("imp");
                onSetSettings((prev) => {
                  return {
                    unit: "imp",
                    refresh: prev.refresh,
                    dark: prev.dark,
                    darkMode: prev.darkMode,
                  };
                });
                localStorage.setItem("unit", "imp");
              }}
              className={`grid items-center justify-items-center text-slate-900 ${unitActive === "imp" ? "bg-blue-400" : "bg-slate-400"} font-semibold rounded-lg hover:cursor-pointer text-md px-2`}
            >
              Imperial
            </span>
            <span
              onClick={() => {
                setUnitActive("met");
                onSetSettings((prev) => {
                  return {
                    unit: "met",
                    refresh: prev.refresh,
                    dark: prev.dark,
                    darkMode: prev.darkMode,
                  };
                });
                localStorage.setItem("unit", "met");
              }}
              className={`grid items-center justify-items-center text-slate-900 ${unitActive === "met" ? "bg-blue-400" : "bg-slate-400"} font-semibold rounded-lg hover:cursor-pointer text-md px-2`}
            >
              Metric
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-center">
          <p className="text-blue-300 text-lg font-semibold">Auto Refresh</p>
          <div className="flex gap-2">
            <span
              onClick={() => {
                setRefreshActive("off");
                autoRefresh.current = "off";
                onSetSettings((prev) => {
                  return {
                    unit: prev.unit,
                    refresh: "off",
                    dark: prev.dark,
                    darkMode: prev.darkMode,
                  };
                });
                localStorage.setItem("refresh", "off");
              }}
              className={`grid items-center justify-items-center text-slate-900 ${refreshActive === "off" ? "bg-blue-400" : "bg-slate-400"} font-semibold rounded-lg hover:cursor-pointer text-md px-2`}
            >
              Off
            </span>
            <span
              onClick={() => {
                setRefreshActive("on");
                autoRefresh.current = "on";
                onSetSettings((prev) => {
                  return {
                    unit: prev.unit,
                    refresh: "on",
                    dark: prev.dark,
                    darkMode: prev.darkMode,
                  };
                });
                localStorage.setItem("refresh", "on");
              }}
              className={`grid items-center justify-items-center text-slate-900 ${refreshActive === "on" ? "bg-blue-400" : "bg-slate-400"} font-semibold rounded-lg hover:cursor-pointer text-md px-2`}
            >
              On
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-center">
          <p className="text-blue-300 text-lg font-semibold">Dark Mode</p>
          <div className="flex gap-2">
            <span
              onClick={() => {
                setDarkActive("auto");
                onSetSettings((prev) => {
                  return {
                    unit: prev.unit,
                    refresh: prev.refresh,
                    dark: prev.dark,
                    darkMode: "auto",
                  };
                });
                localStorage.setItem("darkMode", "auto");
              }}
              className={`grid items-center justify-items-center text-slate-900 ${darkActive === "auto" ? "bg-blue-400" : "bg-slate-400"} font-semibold rounded-lg hover:cursor-pointer text-md px-2`}
            >
              Auto
            </span>
            <span
              onClick={() => {
                setDarkActive("off");
                onSetSettings((prev) => {
                  return {
                    unit: prev.unit,
                    refresh: prev.refresh,
                    dark: false,
                    darkMode: "off",
                  };
                });
                localStorage.setItem("dark", false);
                localStorage.setItem("darkMode", "off");
              }}
              className={`grid items-center justify-items-center text-slate-900 ${darkActive === "off" ? "bg-blue-400" : "bg-slate-400"} font-semibold rounded-lg hover:cursor-pointer text-md px-2`}
            >
              Off
            </span>
            <span
              onClick={() => {
                setDarkActive("on");
                onSetSettings((prev) => {
                  return {
                    unit: prev.unit,
                    refresh: prev.refresh,
                    dark: true,
                    darkMode: "on",
                  };
                });
                localStorage.setItem("dark", true);
                localStorage.setItem("darkMode", "on");
              }}
              className={`grid items-center justify-items-center text-slate-900 ${darkActive === "on" ? "bg-blue-400" : "bg-slate-400"} font-semibold rounded-lg hover:cursor-pointer text-md px-2`}
            >
              On
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
