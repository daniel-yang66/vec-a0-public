"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { renderToString } from "react-dom/server";
import { useSearchParams, useRouter } from "next/navigation";
import { ConvertAlt, ConvertSpeed } from "../utils/UnitConversion";
import { FiExternalLink } from "react-icons/fi";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { GetAirlineLogos, GetAirportOptions } from "../utils/Database";
import { useDebouncedCallback } from "use-debounce";
import { AircraftType } from "../utils/General";

export default function GlobeMap({ flights, unit }) {
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const [airlines, setAirlines] = useState();
  const [airline, setAirline] = useState();
  const [collapse, setCollapse] = useState(true);
  const [value, setValue] = useState("");
  const [mode, setMode] = useState("airline");
  const [airportItems, setAirportItems] = useState();
  const [dep, setDep] = useState(null);
  const [arr, setArr] = useState(null);
  const [depValue, setDepValue] = useState("");
  const [arrValue, setArrValue] = useState("");
  const [field, setField] = useState(null);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const spinningRef = useRef(true);
  const resumeTimerRef = useRef(null);
  const popupRef = useRef(null);
  const flightsRef = useRef(flights);
  flightsRef.current = flights;
  const unitRef = useRef(unit);
  unitRef.current = unit;

  const SPIN_RESUME_DELAY = 7000;
  const SECONDS_PER_REVOLUTION = 240;

  async function GetAirports(val) {
    setAirportItems([{ icao_code: "Searching...", name: "" }]);
    try {
      setAirportItems(await GetAirportOptions(val));
    } catch {
      setAirportItems(null);
    }
  }

  function Row({ i, len, onPick, children }) {
    return (
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          onPick();
        }}
        className={`grid hover:cursor-pointer hover:bg-slate-800 hover:text-slate-300 place-items-center bg-slate-300 text-slate-900 w-full h-6 z-20 ${
          len !== 1
            ? i === len - 1
              ? "rounded-b-lg"
              : i === 0
                ? "rounded-t-lg"
                : ""
            : "rounded-lg"
        }`}
      >
        {children}
      </div>
    );
  }

  const debounce = useDebouncedCallback(GetAirports, 700);

  function HandleFlight(text) {
    const params = new URLSearchParams(searchParams);
    text ? params.set("flightno", text) : params.delete("flightno");
    params.delete("route");
    replace(`/?${params.toString()}`);
  }

  async function GetAirlineInfo(lst) {
    const airlineData = await GetAirlineLogos(lst);
    setAirlines(airlineData);
  }

  function flightsToGeoJSON(flights) {
    return {
      type: "FeatureCollection",
      features: (flights || [])
        .filter((f) => f.lat != null && f.lng != null)
        .map((f) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [f.lng, f.lat] },
          properties: {
            ac_type: AircraftType(f.aircraft_icao || "N/A"),
            flight_iata: f.flight_iata || f.flight_icao || "N/A",
            dep_iata: f.dep_iata || "---",
            arr_iata: f.arr_iata || "---",
            alt: f.alt ?? 0,
            speed: f.speed ?? 0,
            dir: f.dir ?? 0,
            reg_number: f.reg_number || "N/A",
            aircraft_icao: f.aircraft_icao || "N/A",
            status: f.status || "unknown",
          },
        })),
    };
  }
  function popupHTML(p, unit) {
    return `
    <div class="flt-card">
      <div class="flt-head">${p.flight_iata}</div>
      <div class="flt-flex-wrap">
      <div class="flt-route">${p.dep_iata} to ${p.arr_iata}</div>
      <div class="flt-flex-wrap-norm" id="redirect">
      <div class="flt-action">Details</div>
      ${renderToString(<FiExternalLink className="text-[16px]" />)}
      </div>
      </div>
      <div class="flt-grid">
        <div><span class="flt-label">Altitude</span>${ConvertAlt(unit, p.alt * 3.28, "alt").toLocaleString()}${unit === "av" || unit === "imp" ? "ft" : "m"}</div>
        <div><span class="flt-label">Speed</span>${ConvertSpeed(unit, p.speed * 0.54)}${unit === "av" || unit === "imp" ? (unit === "imp" ? "mph" : "kt") : "kph"}</div>
        <div><span class="flt-label">Heading</span>${Math.round(p.dir)}&deg;</div>
        <div><span class="flt-label">Aircraft</span>${p.aircraft_icao}</div>
      </div>
      <div class="flt-foot">
        <span>${p.reg_number}</span>
        <span>${p.status}</span>
      </div>
    </div>`;
  }

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      projection: "globe",
      center: [-114, 33],
      zoom: 1.5,
      attributionControl: true,
    });
    mapRef.current = map;

    map.on("style.load", () => {
      map.setFog({
        color: "rgb(18, 28, 56)",
        "high-color": "rgb(45, 70, 135)",
        "horizon-blend": 0.02,
        "space-color": "rgb(5, 8, 20)",
        "star-intensity": 0.4,
      });

      ["narrowbody", "widebody", "jumbo_jet", "regional_jet"].map((item, i) => {
        if (!map.hasImage(item)) {
          map.loadImage(`/${item}.png`, (error, image) => {
            map.addImage(item, image);
          });
        }
      });

      map.addSource("flights", {
        type: "geojson",
        data: flightsToGeoJSON(flightsRef.current),
      });
      map.addLayer({
        id: "flights-layer",
        type: "symbol",
        source: "flights",
        layout: {
          "icon-image": ["get", "ac_type"],
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            1,
            0.03,
            6,
            0.05,
            10,
            0.09,
          ],
          "icon-rotate": ["get", "dir"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });
      map.on("click", "flights-layer", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        if (popupRef.current) popupRef.current.remove();
        const popupNode = document.createElement("div");
        popupNode.innerHTML = popupHTML(f.properties, unitRef.current);

        popupNode.querySelector("#redirect").addEventListener("click", (e) => {
          e.preventDefault();
          HandleFlight(f.properties.flight_iata);
        });
        popupRef.current = new mapboxgl.Popup({
          className: "flight-popup",
          offset: 14,
          closeOnMove: true,
        })
          .setLngLat(f.geometry.coordinates.slice())
          .setDOMContent(popupNode)
          .addTo(map);
      });
      map.on("mouseenter", "flights-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "flights-layer", () => {
        map.getCanvas().style.cursor = "";
      });
      // });
    });
    // ---- spin ----
    function spin() {
      if (!spinningRef.current) return;
      const zoom = map.getZoom();
      if (zoom >= 5) return;
      let distancePerSecond = 360 / SECONDS_PER_REVOLUTION;
      if (zoom > 3) distancePerSecond *= (5 - zoom) / 2;
      const center = map.getCenter();
      center.lng -= distancePerSecond;
      map.easeTo({ center, duration: 1000, easing: (n) => n });
    }
    function stopSpin() {
      spinningRef.current = false;
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        spinningRef.current = true;
        spin();
      }, SPIN_RESUME_DELAY);
    }
    map.on("moveend", () => spinningRef.current && spin());
    ["mousedown", "touchstart", "wheel", "dragstart"].forEach((evt) =>
      map.on(evt, stopSpin),
    );
    map.on("load", spin);
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      clearTimeout(resumeTimerRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (flights && flights.length > 0) {
      const airlineCodes = flights.map((item) => item.airline_iata);
      GetAirlineInfo(airlineCodes);
    }
  }, [flights]);

  useEffect(() => {
    const src = mapRef.current?.getSource("flights");
    if (!src) return;
    let filtered = flights || [];
    if (mode === "airline" && airline) {
      filtered = filtered.filter((f) => f.airline_iata === airline);
    }
    if (mode === "route" && (dep || arr)) {
      filtered = filtered.filter(
        (f) =>
          (!dep || f.dep_iata === dep || f.dep_icao === dep) &&
          (!arr || f.arr_iata === arr || f.arr_icao === arr),
      );
    }
    src.setData(flightsToGeoJSON(filtered));

    if (mode === "route" && (dep || arr) && filtered.length) {
      spinningRef.current = false;
      const b = new mapboxgl.LngLatBounds();
      filtered.forEach((f) => f.lng != null && b.extend([f.lng, f.lat]));
      mapRef.current.fitBounds(b, {
        padding: 80,
        maxZoom: 4.5,
        duration: 1200,
      });
    }
  }, [flights, unit, airline, dep, arr, mode]);

  return (
    <>
      <div className="absolute top-1 left-1 w-[60vw] md:w-[24vw] flex flex-col gap-2 z-20 font-semibold">
        {mode === "airline" ? (
          <input
            onFocus={() => setCollapse(false)}
            onBlur={() => setCollapse(true)}
            onChange={(e) => {
              setCollapse(false);
              setValue(e.target.value.toUpperCase());
            }}
            value={value}
            className="rounded-lg w-full h-[4vh] bg-slate-400 p-2 text-slate-900"
            placeholder="Airline"
            type="text"
          />
        ) : (
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              onFocus={() => {
                setCollapse(false);
                setField("dep");
              }}
              onBlur={() => setCollapse(true)}
              onChange={(e) => {
                setCollapse(false);
                setField("dep");
                setDepValue(e.target.value.toUpperCase());
                debounce(e.target.value.trim().toUpperCase());
              }}
              value={depValue}
              className="rounded-lg w-1/2 h-[4vh] bg-slate-400 p-2 text-slate-900"
              placeholder="DEP"
              type="text"
            />
            <input
              onFocus={() => {
                setCollapse(false);
                setField("arr");
              }}
              onBlur={() => setCollapse(true)}
              onChange={(e) => {
                setCollapse(false);
                setField("arr");
                setArrValue(e.target.value.toUpperCase());
                debounce(e.target.value.trim().toUpperCase());
              }}
              value={arrValue}
              className="rounded-lg w-1/2 h-[4vh] bg-slate-400 p-2 text-slate-900"
              placeholder="ARR"
              type="text"
            />
          </form>
        )}
        {!collapse && (
          <div className="bg-slate-700 rounded-lg grid items-center justify-items-center w-full p-2">
            <h3 className="text-slate-300 text-md mb-2">Search by</h3>
            <div className="flex gap-[2px] w-full">
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  setMode("airline");
                  setCollapse(true);
                  setValue("");
                  setDepValue("");
                  setArrValue("");
                  setDep(null);
                  setArr(null);
                }}
                className="relative items-center w-full text-md font-semibold bg-slate-400 hover:cursor-pointer text-center hover:bg-blue-800 hover:text-slate-300 rounded-lg mb-2"
              >
                {"Carrier"}
              </div>
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  setMode("route");
                  setCollapse(true);
                  setValue("");
                  setDepValue("");
                  setArrValue("");
                  setDep(null);
                  setArr(null);
                }}
                className="relative items-center w-full text-md font-semibold bg-slate-400 hover:cursor-pointer text-center hover:bg-blue-800 hover:text-slate-300 rounded-lg mb-2"
              >
                {"Route"}
              </div>
            </div>
          </div>
        )}

        {!collapse && (
          <div className="grid w-full rounded-lg justify-items-center">
            {mode === "airline"
              ? airlines &&
                [
                  { iata: null, name: "All" },
                  ...airlines
                    .filter(
                      (item) =>
                        value.length > 0 &&
                        (item.name.toUpperCase().includes(value) ||
                          item.iata.toUpperCase().includes(value)),
                    )
                    .slice(0, 5),
                ].map((item, i, arr) => (
                  <Row
                    key={i}
                    i={i}
                    len={arr.length}
                    onPick={() => {
                      setValue(
                        item.name !== "All" ? item.name.toUpperCase() : "",
                      );
                      setAirline(item.iata);
                      setCollapse(true);
                    }}
                  >
                    {item.name}
                  </Row>
                ))
              : (() => {
                  if (!airportItems) return null;
                  return airportItems.map((item, i) => (
                    <Row
                      key={item.icao_code}
                      i={i}
                      len={airportItems.length}
                      onPick={() => {
                        if (field === "dep") {
                          setDepValue(item.icao_code);
                          setDep(item.icao_code);
                        } else {
                          setArrValue(item.icao_code);
                          setArr(item.icao_code);
                        }
                        setCollapse(true);
                      }}
                    >
                      {item.icao_code !== "Searching..."
                        ? `${item.name}${` (${item.icao_code})`}`
                        : item.icao_code}
                    </Row>
                  ));
                })()}
          </div>
        )}
      </div>
      <div ref={containerRef} className="w-full h-full rounded-lg" />
    </>
  );
}
