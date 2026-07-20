"use client";

import * as maptilersdk from "@maptiler/sdk";
import { RadarLayer, WindLayer, TemperatureLayer } from "@maptiler/weather";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { useRef, useEffect, useState, memo } from "react";
import { greatCircle, point, buffer, bbox, coordAll } from "@turf/turf";
import { DateTime } from "luxon";
import AirSig from "../api/AirSig";
import Pirep from "../api/Pirep";
import WindsAloft from "../api/UpperAir";
import GeoJSONTerminator from "@webgeodatavore/geojson.terminator";
import { IoIosArrowForward } from "react-icons/io";
import {
  ConvertAlt,
  ConvertMb,
  ConvertSpeed,
  ConvertTemp,
} from "../utils/UnitConversion";
import { FormatTimeDiff } from "../utils/FlightFunctions";
import { ConvertWind } from "../utils/ConvertWeather";
import { loadUsBundledAirspace } from "@squawk/airspace-data/browser";
import { createAirspaceResolver } from "@squawk/airspace/browser";
import "../globals.css";
import { Notify } from "../utils/Toast";

export default memo(function Map({
  flight,
  details,
  airports,
  onSetDetails,
  onSetType,
  unit,
  flightNo,
  route,
  refreshTracker,
}) {
  const map = useRef(null);
  const mapContainer = useRef(null);
  const markers = useRef([]);
  const aSigMarkers = useRef([]);
  const sigCounter = useRef(0);
  const airspMarkers = useRef([]);
  const [activeWx, setActiveWx] = useState(null);
  const [advType, setAdvType] = useState();
  const [expand, setExpand] = useState(false);
  const [done, setDone] = useState(false);
  const [dayNight, setDayNight] = useState("on");
  const [aSig, setASig] = useState();
  const [airspace, setAirspace] = useState();
  const [pirep, setPireps] = useState();
  const [showWind, setShowWind] = useState("off");
  const [lead, setLead] = useState(0);
  const [winds, setWinds] = useState({ data: null, alt: null });
  const lastFlightId = useRef(null);
  const storedWinds = useRef([]);
  const currentFlightId = useRef(null);
  const windStart = useRef();
  const refreshTrackerInternal = useRef(0);

  async function RetrieveAirSig() {
    const aSigData = await AirSig();
    setASig(aSigData);
  }

  function BuildWindGeo(filteredWinds, altitude) {
    return {
      type: "FeatureCollection",
      features: filteredWinds.map((item, i) => {
        const vComp = item[`VGRD|${altitude}|`];
        const hComp = item[`UGRD|${altitude}|`];
        const tmp = ConvertTemp(unit, item[`TMP|${altitude}|`], "winds");
        const totWindTemp = Math.sqrt(vComp ** 2 + hComp ** 2);
        const totWind = ConvertWind(
          Math.sqrt(vComp ** 2 + hComp ** 2),
          "--",
          "m/s",
          unit,
        );
        const rotate = -Math.round(Math.atan2(vComp, hComp) * (180 / Math.PI));

        let icon;
        if (totWindTemp < 2) {
          icon = "wind-low";
        } else if (totWindTemp >= 2 && totWindTemp < 6) {
          icon = "wind-low-mid";
        } else if (totWindTemp >= 6 && totWindTemp < 12) {
          icon = "wind-mid";
        } else if (totWindTemp >= 12 && totWindTemp < 20) {
          icon = "wind-high-mid";
        } else {
          icon = "wind-high";
        }

        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [item.lon, item.lat],
          },
          properties: {
            rotate: rotate,
            spd: `${totWind.ws}${unit === "av" || unit === "imp" ? (unit === "imp" ? " mph" : " kt") : " kph"} | ${tmp.toLocaleString()}${unit === "met" || unit === "av" ? "\xB0C" : "\xB0F"}`,
            rot: rotate,
            img: icon,
          },
        };
      }),
    };
  }

  async function GetWindsAloft(coordLst, alt, ft, id, start, end) {
    try {
      let windData;
      if (id !== currentFlightId.current) return;
      // console.log("hellowind");

      windData = await WindsAloft(coordLst, alt, start, end);
      if (id !== currentFlightId.current) return;

      storedWinds.current = [
        ...storedWinds.current.filter((item) => item.id !== id),
        { id: id, data: windData, alt: alt, ft: ft, time: Date.now() },
      ];
      setWinds({ data: windData, alt: alt, ft: ft });
    } catch {
      return null;
    }
  }

  async function RetrivePirepAirspace() {
    if (flight && flight.lng && flight.lat && flight.alt) {
      const center = point([flight.lng, flight.lat]);
      const buffered = buffer(center, 200, { units: "nauticalmiles" });
      const [minLon, minLat, maxLon, maxLat] = bbox(buffered);
      const pirepData = await Pirep(minLat, minLon, maxLat, maxLon);

      setPireps(pirepData);
      try {
        const dataset = await loadUsBundledAirspace();
        const resolver = createAirspaceResolver({ data: dataset });

        const airsp = resolver.query({
          lat: flight.lat,
          lon: flight.lng,
          altitudeFt: flight.alt < 0 ? 0 : flight.alt * 3.28,
        });

        setAirspace(airsp);
      } catch {
        setAirspace(null);
      }
    }
  }

  function DrawPolygon(coords, i, color, type = "as", airspace = false) {
    map.current.addSource(`${type}${i}`, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: airspace
                ? coords
                : [coords.map((obj) => [+obj.lon, +obj.lat])],
            },
          },
        ],
      },
    });

    map.current.addLayer({
      id: `${type}${i}`,
      type: "fill",
      source: `${type}${i}`,
      layout: {},
      paint: {
        "fill-color": color,
        "fill-opacity": 0.5,
      },
    });
  }
  function FormatAlt(v) {
    return v && String(v).length > 0
      ? ConvertAlt(unit, +v > 1000 ? +v / 100 : +v).toLocaleString() +
          `${unit === "av" || unit === "imp" ? " ft" : " m"}`
      : "--";
  }
  function AddAsigMarker(coords, className, html) {
    const pin = document.createElement("div");
    pin.className = className;
    const popup = new maptilersdk.Popup({
      closeButton: false,
      closeOnMove: false,
    }).setHTML(html);
    const asMarker = new maptilersdk.Marker({ element: pin })
      .setLngLat(coords)
      .setPopup(popup)
      .addTo(map.current);
    aSigMarkers.current.push(asMarker);
  }

  function WeatherLayers(type, map) {
    let layer;
    if (!type) return;
    else if (type === "rad") {
      layer = new RadarLayer({ id: type, opacity: 0.55 });
    } else if (type === "temp") {
      layer = new TemperatureLayer({ id: type, opacity: 0.55 });
    } else if (type === "wind") {
      layer = new WindLayer({ id: type, opacity: 0.55 });
    }
    layer ? map.addLayer(layer) : "";
  }

  useEffect(() => {
    if (map.current) return;
    maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_TILER_TOKEN;

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.TOPO_V4.DARK,
      center: [-114, 33],
      zoom: 2,
      navigationControl: false,
      geolocateControl: false,
      scaleControl: false,
      projectionControl: "bottom-right",
    });

    map.current.on("load", () => {
      setDone(true);
    });

    return () => {
      map.current.remove();
    };
  }, []);

  useEffect(() => {
    if (!done) return;
    if (dayNight === "off") {
      if (map.current.getSource("daynight")) {
        map.current.setLayoutProperty("daynight", "visibility", "none");
      }
    } else if (dayNight === "on") {
      if (!map.current.getSource("daynight")) {
        const geoJSON = new GeoJSONTerminator();

        map.current.addLayer({
          id: "daynight",
          type: "fill",
          source: {
            type: "geojson",
            data: geoJSON,
          },
          layout: {},
          paint: {
            "fill-color": "#000",
            "fill-opacity": 0.5,
          },
        });

        return;
      }
      map.current.setLayoutProperty("daynight", "visibility", "visible");
    }
  }, [dayNight, done]);

  useEffect(() => {
    if (!done) return;

    ["rad", "temp", "wind"].forEach((value) => {
      if (!map.current.getLayer(value)) return;
      map.current.removeLayer(value);
    });

    WeatherLayers(activeWx, map.current);
  }, [activeWx]);

  useEffect(() => {
    if (flight) {
      RetrivePirepAirspace();
    }

    if (!aSig) {
      RetrieveAirSig();
    }
  }, [flight, airports]);

  useEffect(() => {
    if (!flight) return;

    currentFlightId.current = flight.flight_icao;
    setWinds({ data: null, alt: null });

    let newWinds = [];
    let refresh = false;
    if (refreshTrackerInternal.current !== refreshTracker.current) {
      refresh = true;
      refreshTrackerInternal.current = refreshTracker.current;
    }

    if (storedWinds.current.length > 0) {
      newWinds = storedWinds.current.filter((item, i) => {
        if (refresh) {
          return (
            item.id === flight.flight_icao &&
            (Date.now() - item.time) / 60000 < 10
          );
        } else {
          return item.id === flight.flight_icao;
        }
      });
    }
    if (!flight.lng || !flight.lat) {
      Notify("Position info unavailable", "err");
    }
    if (newWinds.length === 0 && flight.alt && flight.lng && flight.lat) {
      let windsAloftCoords = [];
      const originPoint = point([flight.lng, flight.lat]);
      const destPoint = point([
        airports.destination.latest.info.longitude,
        airports.destination.latest.info.latitude,
      ]);
      const line = greatCircle(originPoint, destPoint, {
        npoints: 200,
      });
      coordAll(line).forEach((coord) => {
        windsAloftCoords.push({
          lat: coord[1],
          lon: coord[0],
        });
      });

      const utcNow = DateTime.now().setZone("UTC");
      const startFormat = `${utcNow.toISODate()}T${String(utcNow.hour).padStart(
        2,
        "0",
      )}:00:00Z`;
      windStart.current = startFormat;
      const end = `${utcNow.plus({ hours: 13 }).toISODate()}T${String(
        utcNow.plus({ hours: 13 }).hour,
      ).padStart(2, "0")}:00:00Z`;

      const matchWindAlt = ConvertMb(flight.alt * 3.28);

      GetWindsAloft(
        windsAloftCoords,
        matchWindAlt.mb,
        matchWindAlt.ft,
        flight.flight_icao,
        startFormat,
        end,
      );
    } else {
      setWinds(newWinds[0] ? newWinds[0] : { data: null, alt: null });
    }
  }, [flight]);

  useEffect(() => {
    storedWinds.current = [];
  }, [flightNo, route]);

  useEffect(() => {
    if ((!aSig && !airspace) || !done) return;

    if (aSigMarkers.current.length > 0) {
      for (let i = 0; i < aSigMarkers.current.length; i++) {
        if (map.current.getSource(`as${i}`)) {
          map.current.removeLayer(`as${i}`);
          map.current.removeSource(`as${i}`);
        }
      }
      aSigMarkers.current.forEach((mark, i) => {
        mark.remove();
      });

      aSigMarkers.current = [];
      sigCounter.current = 0;
    }
    if (airspMarkers.current.length > 0) {
      for (let i = 0; i < airspMarkers.current.length; i++) {
        if (map.current.getSource(`air${i}`)) {
          map.current.removeLayer(`air${i}`);
          map.current.removeSource(`air${i}`);
        }
      }
      airspMarkers.current.forEach((mark, i) => {
        mark.remove();
      });
      airspMarkers.current = [];
    }

    if (aSig) {
      const dSig = aSig.dSig;
      const iSig = aSig.iSig;
      const gAir = aSig.gAir;
      const air = aSig.air;

      if (advType === "s") {
        const sigAll = [...iSig, ...dSig];

        if (sigAll.length > 0) {
          sigAll.forEach((item, i) => {
            if (item.coords) {
              if (item.coords && Array.isArray(item.coords[0])) {
                item.coords.forEach((coords, i) => {
                  DrawPolygon(coords, sigCounter.current, "red");
                  sigCounter.current += 1;
                });
              } else {
                DrawPolygon(item.coords, sigCounter.current, "red");
                sigCounter.current += 1;
              }

              const pin = document.createElement("div");
              pin.className = "asig";

              const aSigPopup = new maptilersdk.Popup({
                closeButton: false,
                closeOnMove: false,
              }).setHTML(
                `<div class='adv-label'>
        <p>${item.hazard}</p>
         ${
           item.base
             ? `<p>BASE: ${FormatAlt(item.base)}</p>
        <p>TOP: ${FormatAlt(item.top)}</p>`
             : ""
         }

         ${
           !item.base
             ? `<p>LO ALT BASE: ${FormatAlt(item.altitudeLow1)}</p>
        <p>LO ALT TOP: ${FormatAlt(item.altitudeLow2)}</p>`
             : ""
         }
         ${
           !item.base
             ? `<p>HI ALT BASE: ${FormatAlt(item.altitudeHi1)}</p>
        <p>HI ALT TOP: ${FormatAlt(item.altitudeHi2)}</p>`
             : ""
         }
        <p>${DateTime.fromSeconds(item.validTimeFrom, { zone: "UTC" }).toFormat(
          "HH:mm'Z'",
        )} - ${DateTime.fromSeconds(item.validTimeTo, { zone: "UTC" }).toFormat(
          "HH:mm'Z'",
        )}</p>
        </div>`,
              );

              if (Array.isArray(item.coords[0])) {
                item.coords.forEach((coords, i) => {
                  const asMarker = new maptilersdk.Marker({ element: pin })
                    .setLngLat(coords.map((obj) => [+obj.lon, +obj.lat])[0])
                    .setPopup(aSigPopup)
                    .addTo(map.current);
                  aSigMarkers.current.push(asMarker);
                });
              } else {
                const asMarker = new maptilersdk.Marker({ element: pin })
                  .setLngLat(item.coords.map((obj) => [+obj.lon, +obj.lat])[0])
                  .setPopup(aSigPopup)
                  .addTo(map.current);

                aSigMarkers.current.push(asMarker);
              }
            }
          });
        }
      }

      if (advType === "t") {
        const turbGAir = gAir.filter((item, i) => {
          return (
            item.product === "TANGO" &&
            (item.expireTime ? item.expireTime >= Date.now() / 1000 : true)
          );
        });
        const turbAir = air.filter((item, i) => {
          return (
            item.product === "TANGO" &&
            (item.expireTime ? item.expireTime >= Date.now() / 1000 : true)
          );
        });
        let turbPirep;
        if (pirep && pirep.length > 0) {
          turbPirep = pirep.filter((item, i) => {
            return (
              item.tbType1 ||
              item.tbInt1 ||
              item.tbFreq1 ||
              item.tbType2 ||
              item.tbInt2 ||
              item.tbFreq2
            );
          });
        }

        const turbAll = [...turbAir, ...turbGAir];

        if (turbPirep && turbPirep.length > 0) {
          turbPirep.forEach((item, i) => {
            const pin = document.createElement("div");

            if (
              item.tbInt1 === "LGT" ||
              item.tbInt2 === "LGT" ||
              item.tbInt1 === "NEG" ||
              item.tbInt2 === "NEG"
            ) {
              pin.className = "pirep-lgt";
            } else if (
              item.tbInt1.includes("MOD") ||
              item.tbInt2.includes("MOD")
            ) {
              pin.className = "pirep-mod";
            } else if (
              item.tbInt1.includes("SEV") ||
              item.tbInt2.includes("SEV") ||
              item.tbInt1.includes("EX") ||
              item.tbInt2.includes("EX")
            ) {
              pin.className = "pirep-sev";
            } else {
              pin.className = "pirep-mod";
            }

            const aSigPopup = new maptilersdk.Popup({
              closeButton: false,
              closeOnMove: false,
            }).setHTML(
              `<div class='adv-label'>
            <p>PIREP</p>
        <p>${item.tbFreq1 ? item.tbFreq1 : ""}${item.tbInt1 ? " " + (item.tbInt1 === "NEG" ? "NO" : item.tbInt1) : ""}${item.tbType1 ? " " + item.tbType1 : " TURB"}</p>
        <p>${item.tbFreq2 ? item.tbFreq2 : ""}${item.tbInt2 ? " " + (item.tbInt2 === "NEG" ? "NO" : item.tbInt2) : ""}${item.tbFreq2 && item.tbInt2 ? (item.tbType2 ? " " + item.tbType2 : " TURB") : ""}</p>
          <p>A/C: ${item.acType ? item.acType : "--"}</p>
        <p>ALT: ${FormatAlt(item.fltLvl)}</p>
       
             
        <p>${FormatTimeDiff(Date.now() / 1000 - item.obsTime).time} ago</p>
        </div>`,
            );

            const asMarker = new maptilersdk.Marker({ element: pin })
              .setLngLat([item.lon, item.lat])
              .setPopup(aSigPopup)
              .addTo(map.current);

            aSigMarkers.current.push(asMarker);
          });
        }
        if (turbAll.length > 0) {
          turbAll.forEach((item, i) => {
            if (item.coords) {
              DrawPolygon(item.coords, i, "yellow");
              AddAsigMarker(
                item.coords.map((obj) => [+obj.lon, +obj.lat])[0],
                "asig",
                `<div class='adv-label'>
        <p>${item.hazard.includes("TURB") ? (item.severity ? item.severity : "") : item.hazard}${item.hazard.includes("TURB") ? " TURB" : ""}</p>
          ${
            !item.level
              ? `<p>BASE: ${FormatAlt(item.base)}</p>
        <p>TOP: ${FormatAlt(item.top)}</p>`
              : ConvertAlt(
                  unit,
                  item.level !== "SFC" ? +item.level : null,
                ).toLocaleString() +
                `${unit === "av" || unit === "imp" ? " ft" : " m"}`
          }
        <p>${DateTime.fromSeconds(item.issueTime, { zone: "UTC" }).toFormat("HH:mm'Z'")} - ${DateTime.fromSeconds(item.expireTime, { zone: "UTC" }).toFormat("HH:mm'Z'")}</p>
        </div>`,
              );
            }
          });
        }
      }

      if (advType === "v" || advType === "i") {
        const gAirFilter = gAir.filter((item, i) => {
          return advType === "v"
            ? item.product === "SIERRA" &&
                (item.expireTime ? item.expireTime >= Date.now() / 1000 : true)
            : item.product === "ZULU" &&
                (item.expireTime ? item.expireTime >= Date.now() / 1000 : true);
        });
        const airFilter = air.filter((item, i) => {
          return advType === "v"
            ? item.product === "SIERRA" &&
                (item.expireTime ? item.expireTime >= Date.now() / 1000 : true)
            : item.product === "ZULU" &&
                (item.expireTime ? item.expireTime >= Date.now() / 1000 : true);
        });
        const vAll = [...airFilter, ...gAirFilter];

        let relevantPireps;
        if (pirep && pirep.length > 0) {
          relevantPireps =
            advType === "v"
              ? pirep.filter((item, i) => {
                  return item.visib || item.clouds || item.wxString;
                })
              : pirep.filter((item, i) => {
                  return (
                    item.icgInt1 ||
                    item.icgType1 ||
                    item.icgInt2 ||
                    item.icgType2
                  );
                });
        }
        if (advType === "i") {
          if (relevantPireps && relevantPireps.length > 0) {
            relevantPireps.forEach((item, i) => {
              let className;

              if (
                item.icgInt1 === "LGT" ||
                item.icgInt2 === "LGT" ||
                item.icgInt1 === "NEG" ||
                item.icgInt2 === "NEG"
              ) {
                className = "pirep-lgt";
              } else if (
                item.icgInt1.includes("MOD") ||
                item.icgInt2.includes("MOD")
              ) {
                className = "pirep-mod";
              } else if (
                item.icgInt1.includes("SEV") ||
                item.icgInt2.includes("SEV") ||
                item.icgInt1.includes("EX") ||
                item.icgInt2.includes("EX")
              ) {
                className = "pirep-sev";
              } else {
                className = "pirep-mod";
              }
              AddAsigMarker(
                [item.lon, item.lat],
                className,
                `<div class='adv-label'>
            <p>PIREP</p>
        <p>${item.icgInt1 ? (item.icgInt1 === "NEG" ? "NO" : item.icgInt1) : ""}${item.icgType1 ? " " + item.icgType1 : " ICE"}</p>
        <p>${item.icgInt2 ? (item.icgInt2 === "NEG" ? "NO" : item.icgInt2) : ""}${item.icgType2 && item.Int2 ? (item.icgType2 ? " " + item.icgType2 : " ICE") : ""}</p>
          <p>A/C: ${item.acType ? item.acType : "--"}</p>
        <p>ALT: ${FormatAlt(item.fltLvl)}</p>
       
             
        <p>${FormatTimeDiff(Date.now() / 1000 - item.obsTime).time} ago</p>
        </div>`,
              );
            });
          }
        }

        if (advType === "v") {
          if (relevantPireps && relevantPireps.length > 0) {
            relevantPireps.forEach((item, i) => {
              const className = "pirep-mod";
              AddAsigMarker(
                [item.lon, item.lat],
                className,
                `<div class='adv-label'>
            <p>PIREP</p>
       
        ${
          item.clouds && item.clouds.length > 0
            ? `${item.clouds.map((item, i) => {
                return `<p>${item.cover} @ ${FormatAlt(item.base)}</p>`;
              })}`
            : ""
        }

        <p>VIS: ${item.visib ? item.visib : "--"}</p>
        <p>WX: ${item.wxString ? item.wxString : "--"}</p>

          <p>A/C: ${item.acType ? item.acType : "--"}</p>
        <p>ALT: ${FormatAlt(item.fltLvl)}</p>
       
             
        <p>${FormatTimeDiff(Date.now() / 1000 - item.obsTime).time} ago</p>
        </div>`,
              );
            });
          }
        }

        if (vAll.length > 0) {
          vAll.forEach((item, i) => {
            if (item.coords) {
              DrawPolygon(
                item.coords,
                i,
                advType === "v" ? "pink" : "lightblue",
              );

              const className = "asig";
              AddAsigMarker(
                item.coords.map((obj) => [+obj.lon, +obj.lat])[0],
                className,
                `<div class='adv-label'>
        <p>${item.hazard}</p>
        ${
          !item.level
            ? `<p>BASE: ${FormatAlt(item.base)}</p>
        <p>TOP: ${FormatAlt(item.top)}</p>`
            : ConvertAlt(
                unit,
                item.level !== "SFC" ? +item.level : null,
              ).toLocaleString() +
              `${unit === "av" || unit === "imp" ? " ft" : " m"}`
        }
        <p>${DateTime.fromSeconds(item.issueTime, { zone: "UTC" }).toFormat("HH:mm'Z'")} - ${DateTime.fromSeconds(item.expireTime, { zone: "UTC" }).toFormat("HH:mm'Z'")}</p>
        </div>`,
              );
            }
          });
        }
      }
    }
    if (["a", "b", "c", "d", "e", "o", "art"].includes(advType)) {
      if (!airspace || airspace.length === 0) return;

      const airspaceFiltered = airspace.filter((item, i) => {
        let type = "other";
        if (advType === "art") {
          type = "ARTCC";
        } else if (advType === "a") {
          type = "ALL";
        } else if (advType === "b") {
          type = "CLASS_B";
        } else if (advType === "c") {
          type = "CLASS_C";
        } else if (advType === "d") {
          type = "CLASS_D";
        } else if (advType === "e") {
          type = "CLASS_E";
        }

        try {
          if (
            flight.alt * 100 <=
              (item.ceiling.valueFt > 60000 ? 17999 : item.ceiling.valueFt) &&
            flight.alt * 100 >= item.floor.valueFt &&
            (type !== "ALL"
              ? type !== "other"
                ? item.type.includes(type)
                : !item.type.includes("CLASS_A") &&
                  !item.type.includes("CLASS_B") &&
                  !item.type.includes("CLASS_C") &&
                  !item.type.includes("CLASS_D") &&
                  !item.type.includes("CLASS_E") &&
                  !item.type.includes("ARTCC")
              : true)
          ) {
            return true;
          }
        } catch {
          return true;
        }
      });

      airspaceFiltered.forEach((item, i) => {
        let color = "yellow";
        if (item.type.includes("CLASS_B")) {
          color = "blue";
        } else if (item.type.includes("CLASS_C")) {
          color = "purple";
        } else if (item.type.includes("CLASS_D")) {
          color = "lightskyblue";
        } else if (item.type.includes("CLASS_E")) {
          color = "magenta";
        }

        DrawPolygon(item.boundary.coordinates, i, color, "air", true);

        const pin = document.createElement("div");
        pin.className = "asig";

        const airspPopup = new maptilersdk.Popup({
          closeButton: false,
          closeOnMove: false,
        }).setHTML(
          `<div class='adv-label'>
            <p>${item.name}${item.type === "ARTCC" ? " " + item.type : ""}</p>
        <p>BASE: ${
          item.floor
            ? item.floor.reference === "SFC"
              ? "SFC"
              : ConvertAlt(
                  unit,
                  item.floor.valueFt > 60000 ? 17999 : item.floor.valueFt,
                  "airsp",
                ).toLocaleString() +
                `${unit === "av" || unit === "imp" ? " ft" : " m"}`
            : ""
        }${item.floor.reference === "SFC" ? "" : " " + item.floor.reference}</p>
        <p>CEIL: ${
          item.ceiling
            ? item.ceiling.reference === "SFC"
              ? "SFC"
              : ConvertAlt(
                  unit,
                  item.ceiling.valueFt > 60000 ? 17999 : item.ceiling.valueFt,
                  "airsp",
                ).toLocaleString() +
                `${unit === "av" || unit === "imp" ? " ft" : " m"}${item.ceiling.reference === "SFC" ? "" : " " + item.ceiling.reference}`
            : ""
        }</p>      
        </div>`,
        );

        const airspMarker = new maptilersdk.Marker({ element: pin })
          .setLngLat(item.boundary.coordinates[0][0])
          .setPopup(airspPopup)
          .addTo(map.current);

        airspMarkers.current.push(airspMarker);
      });
    }
  }, [advType, done, pirep, airspace, aSig, unit]);

  useEffect(() => {
    markers.current.forEach((mark) => {
      if (!mark) return;
      mark.remove();
    });
    markers.current = [];

    if (map.current.getSource("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }

    if (map.current.getSource("gc")) {
      map.current.removeLayer("gc");
      map.current.removeSource("gc");
    }

    if (!flight || !airports) return;

    const depCoords = {
      lon: airports.origin.latest.info.longitude,
      lat: airports.origin.latest.info.latitude,
    };
    const arrCoords = {
      lon: airports.destination.latest.info.longitude,
      lat: airports.destination.latest.info.latitude,
    };

    let planeCoords;

    if (flight.lat && flight.lng) {
      planeCoords = {
        lon: flight.lng,
        lat: flight.lat,
      };
    }

    const depPin = document.createElement("div");
    depPin.className = "dep-pin";

    const arrPin = document.createElement("div");
    arrPin.className = "arr-pin";

    const planePin = document.createElement("div");
    planePin.className = "plane-pin";

    const popupDep = new maptilersdk.Popup({
      closeButton: false,
      closeOnMove: false,
      closeOnClick: false,
      className: "transparent-popup",

      offset: 10,
    }).setHTML(
      `<div class="airport-label">${flight.dep_city} (${flight.dep_iata ? flight.dep_iata : flight.dep_icao})</div>`,
    );
    const popupArr = new maptilersdk.Popup({
      closeButton: false,
      closeOnMove: false,
      closeOnClick: false,
      className: "transparent-popup",
      offset: 10,
    }).setHTML(
      `<div class="airport-label">${flight.arr_city} (${flight.arr_iata ? flight.arr_iata : flight.arr_icao})</div>`,
    );
    let popupAir, airMarker;
    if (flight.lat && flight.lng) {
      popupAir = new maptilersdk.Popup({
        closeButton: false,
        closeOnMove: false,
        closeOnClick: false,
        className: "transparent-popup",
        offset: 28,
      }).setHTML(
        `<div class="airport-label">
        <p>${flight.flight_icao ? flight.flight_icao : "--"}</p>
        <p>${flight.aircraft_icao ? flight.aircraft_icao : "--"}</p>
        <div class="altitude">
        <p>ALT: ${ConvertAlt(unit, flight.alt * 3.28, "alt").toLocaleString()}${unit === "av" || unit === "imp" ? "ft" : "m"}</p>
       
       
        </div> 
        <p>SPD: ${ConvertSpeed(unit, flight.speed * 0.54)}${unit === "av" || unit === "imp" ? (unit === "imp" ? "mph" : "kt") : "kph"}</p>  <p>HDG: ${Math.round(
          flight.dir,
        )}\xB0</p></div>`,
      );

      airMarker = new maptilersdk.Marker({ element: planePin })
        .setLngLat([
          planeCoords ? planeCoords.lon : depCoords.lon,
          planeCoords ? planeCoords.lat : depCoords.lat,
        ])
        .setRotation(flight.dir)
        .setRotationAlignment("map")
        .setPopup(popupAir)
        .addTo(map.current)
        .togglePopup();
    }

    const depMarker = new maptilersdk.Marker({ element: depPin })
      .setLngLat([depCoords.lon, depCoords.lat])
      .setPopup(popupDep)
      .addTo(map.current)
      .togglePopup();

    const arrMarker = new maptilersdk.Marker({ element: arrPin })
      .setLngLat([arrCoords.lon, arrCoords.lat])
      .setPopup(popupArr)
      .addTo(map.current)
      .togglePopup();

    if (done) {
      const originPoint = point([
        planeCoords ? planeCoords.lon : depCoords.lon,
        planeCoords ? planeCoords.lat : depCoords.lat,
      ]);
      const destPoint = point([arrCoords.lon, arrCoords.lat]);
      const line = greatCircle(originPoint, destPoint, {
        npoints: 200,
      });
      map.current.addSource("gc", {
        type: "geojson",
        data: line,
      });
      map.current.addLayer({
        id: "gc",
        type: "line",
        source: "gc",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "rgb(191, 191, 246)",
          "line-width": 3,
          "line-dasharray": [3, 2],
        },
      });
    }

    if (lastFlightId.current !== flight.flight_icao) {
      map.current.flyTo({
        center: [
          planeCoords ? planeCoords.lon : depCoords.lon,
          planeCoords ? planeCoords.lat : depCoords.lat,
        ],
        speed: 0.5,
        zoom: 5,
      });
      lastFlightId.current = flight.flight_icao;
    }

    markers.current = [...markers.current, depMarker, airMarker, arrMarker];
  }, [airports, flight, done, unit]);

  useEffect(() => {
    if (showWind === "off" || !winds.data) {
      if (done && map.current.getSource("winds")) {
        map.current.removeLayer("winds");
        map.current.removeSource("winds");
      }
      return;
    }

    const altitude = winds.alt;
    const filteredWinds = winds.data.filter((item, i) => {
      const diff = Math.round(
        (DateTime.fromISO(item.forecasted_time).toSeconds() -
          DateTime.fromISO(windStart.current).toSeconds()) /
          3600,
      );
      return diff === lead;
    });
    if (map.current.getSource("winds") && showWind === "on") {
      map.current
        .getSource("winds")
        .setData(BuildWindGeo(filteredWinds, altitude));
    } else {
      async function AddWindArrows() {
        await Promise.all(
          [
            "wind-low",
            "wind-low-mid",
            "wind-mid",
            "wind-high-mid",
            "wind-high",
          ].map(async (item, i) => {
            if (!map.current.hasImage(item)) {
              const image = await map.current.loadImage(`/${item}.png`);
              map.current.addImage(item, image.data);
            }
          }),
        );
        map.current.addSource("winds", {
          type: "geojson",
          data: BuildWindGeo(filteredWinds, altitude),
        });
        map.current.addLayer({
          id: "winds",
          type: "symbol",
          source: "winds",
          layout: {
            "icon-image": ["get", "img"],
            "icon-rotate": ["get", "rot"],
            "icon-size": 0.3,
            "text-field": ["get", "spd"],
            "text-offset": [0, 1.25],
            "text-anchor": "top",
          },
          paint: {
            "text-color": "lightskyblue",
          },
        });
      }
      AddWindArrows();
    }
  }, [winds, lead, showWind, unit, done]);

  return (
    <>
      <div
        id="map-container"
        ref={mapContainer}
        className="rounded-lg w-[98vw] h-[75vh] min-[768px]:h-[53vh] min-[1000px]:h-[45vh] lmd:w-[58vw]! lmd:h-[80vh]!"
      />
      {winds.data && winds.data.length > 0 && showWind === "on" ? (
        <div className="absolute bottom-[5.5vh] md:bottom-1 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-2 items-center">
          <p className="text-md text-blue-300 font-semibold">
            {lead === 0 ? "Winds Aloft: Now" : `Winds Aloft: +${lead}h`}
          </p>
          <input
            type="range"
            min={0}
            max={12}
            step={1}
            value={lead}
            list="hour-ticks"
            onChange={(e) => setLead(Number(e.target.value))}
            className="w-[90vw] md:w-[30vw] bg-blue-300"
          />
          <datalist id="hour-ticks">
            {Array.from({ length: 13 }, (_, i) => i).map((h) => (
              <option key={h} value={h} />
            ))}
          </datalist>
        </div>
      ) : (
        <></>
      )}

      <div className="flex flex-col gap-2 items-start absolute top-1 left-1">
        <div
          className=" flex gap-2 items-center"
          onClick={() => setExpand(!expand)}
        >
          <IoIosArrowForward
            className={`${expand ? "rotate-90" : ""} text-[15px] font-bold`}
          />
          <h3 className={`text-lg text-blue-300 font-bold`}>Options</h3>
          {winds.data && winds.data.length > 0 && showWind === "on" ? (
            <p className="text-md text-blue-300 font-semibold">
              Winds @{" "}
              {`${winds.alt} (${ConvertAlt(unit, winds.ft, "winds").toLocaleString()}${unit === "av" || unit === "imp" ? " ft" : " m"})`}
            </p>
          ) : (
            <></>
          )}
        </div>

        <div className={`${expand ? "" : "hidden"} flex flex-col gap-2`}>
          <select
            onChange={(e) => setActiveWx(e.target.value)}
            className={`bg-blue-300 text-center text-slate-900 font-semibold rounded-lg hover:cursor-pointer px-2 text-sm`}
          >
            <option value={null}>Weather</option>
            <option value={"rad"}>Radar</option>
            <option value={"temp"}>SFC Temp</option>
            <option value={"wind"}>SFC Wind</option>
          </select>
          {winds.data && winds.data.length > 0 ? (
            <div
              onClick={() =>
                showWind === "on" ? setShowWind("off") : setShowWind("on")
              }
              className={`h-6 grid items-center justify-items-center ${
                showWind === "on" ? "bg-teal-300" : "bg-slate-400"
              } text-slate-900 font-semibold rounded-lg hover:cursor-pointer px-2 text-sm`}
            >
              Winds Aloft
            </div>
          ) : (
            <></>
          )}
          {aSig || airspace ? (
            <select
              onChange={(e) => setAdvType(e.target.value)}
              className={`h-6 bg-orange-300 text-center text-slate-900 font-semibold rounded-lg hover:cursor-pointer px-2 text-sm`}
            >
              <option value={null}>Advisory</option>
              <optgroup label="Weather">
                <option value={"s"}>SIG WX</option>
                <option value={"t"}>TURB</option>
                <option value={"v"}>VIS</option>
                <option value={"i"}>ICE</option>
              </optgroup>
              <optgroup label="Airspace (US)">
                <option value={"a"}>All</option>
                <option value={"art"}>ARTCC</option>
                <option value={"b"}>Class B</option>
                <option value={"c"}>Class C</option>
                <option value={"d"}>Class D</option>
                <option value={"e"}>Class E</option>
                <option value={"o"}>Other</option>
              </optgroup>
            </select>
          ) : (
            <></>
          )}

          <div
            onClick={() =>
              dayNight === "on" ? setDayNight("off") : setDayNight("on")
            }
            className={`h-6 grid items-center justify-items-center ${
              dayNight === "on" ? "bg-indigo-300" : "bg-slate-400"
            } text-slate-900 font-semibold rounded-lg hover:cursor-pointer px-2 text-sm`}
          >
            Day | Night
          </div>

          <div
            onClick={() => {
              onSetType("flt");
              details === "on" ? onSetDetails("off") : onSetDetails("on");
            }}
            className={`h-6 grid items-center justify-items-center bg-emerald-300 font-semibold rounded-lg hover:cursor-pointer px-2 text-sm text-slate-900`}
          >
            More
          </div>
        </div>
      </div>
    </>
  );
});
