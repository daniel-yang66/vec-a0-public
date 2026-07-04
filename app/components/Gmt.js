"use client";
import { useState, useEffect } from "react";
import { DateTime } from "luxon";
export default function Gmt() {
  const [time, setTime] = useState("--:-- --/--");

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(DateTime.now().setZone("UTC").toFormat("HH:mm ccc"));
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  return (
    <p className="md:z-[50] md:fixed md:top-[3vh] md:left-[50vw] md:-translate-x-1/2 md:-translate-y-1/2 font-semibold text-lg text-slate-400 mb-2 md: mb-0 justify-self-center">
      GMT: {time}
    </p>
  );
}
