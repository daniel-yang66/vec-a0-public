"use client";
import DayNight from "./UserDayStatus";

export function RetrieveLocation(darkFunc, coords) {
  if (coords) {
    darkFunc((prev) => {
      return {
        unit: prev.unit,
        refresh: prev.refresh,
        dark: DayNight(coords.lat, coords.lon),
        darkMode: prev.darkMode,
      };
    });
    localStorage.setItem("dark", DayNight(coords.lat, coords.lon));
  } else {
    return false;
  }
}
