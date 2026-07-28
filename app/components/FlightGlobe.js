"use client";
import { useEffect, useRef } from "react";
import { renderToString } from "react-dom/server";
import { useSearchParams, useRouter } from "next/navigation";
import { ConvertAlt, ConvertSpeed } from "../utils/UnitConversion";
import { FiExternalLink } from "react-icons/fi";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export default function GlobeMap({ flights, unit }) {
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const spinningRef = useRef(true);
  const resumeTimerRef = useRef(null);
  const popupRef = useRef(null);
  const flightsRef = useRef(flights);
  flightsRef.current = flights;
  const unitRef = useRef(unit);
  unitRef.current = unit;

  const SPIN_RESUME_DELAY = 5000;
  const SECONDS_PER_REVOLUTION = 240;
  const PLANE_ICON_URL = "/plane.png";

  function HandleFlight(text) {
    const params = new URLSearchParams(searchParams);
    text ? params.set("flightno", text) : params.delete("flightno");
    params.delete("route");
    replace(`/?${params.toString()}`);
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
      zoom: 1.4,
      attributionControl: true,
    });
    mapRef.current = map;

    map.on("style.load", () => {
      map.setFog({
        color: "rgb(13, 20, 40)",
        "high-color": "rgb(36, 60, 120)",
        "horizon-blend": 0.02,
        "space-color": "rgb(5, 8, 20)",
        "star-intensity": 0.4,
      });
      map.loadImage(PLANE_ICON_URL, (err, image) => {
        if (err) {
          return;
        }
        if (!map.hasImage("plane")) map.addImage("plane", image);
        map.addSource("flights", {
          type: "geojson",
          data: flightsToGeoJSON(flightsRef.current),
        });
        // single symbol layer -> still GPU-rendered, fine for thousands of planes
        map.addLayer({
          id: "flights-layer",
          type: "symbol",
          source: "flights",
          layout: {
            "icon-image": "plane",
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              1,
              0.02,
              6,
              0.04,
              10,
              0.08,
            ],
            "icon-rotate": ["get", "dir"], // heading in degrees
            "icon-rotation-alignment": "map", // rotate with the map, not screen
            "icon-allow-overlap": true, // don't hide planes that collide
            "icon-ignore-placement": true, // skip collision detection (faster)
          },
        });
        map.on("click", "flights-layer", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          if (popupRef.current) popupRef.current.remove();
          const popupNode = document.createElement("div");
          popupNode.innerHTML = popupHTML(f.properties, unitRef.current);

          popupNode
            .querySelector("#redirect")
            .addEventListener("click", (e) => {
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
      });
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
    const src = mapRef.current?.getSource("flights");
    if (src) src.setData(flightsToGeoJSON(flights));
  }, [flights, unit]);
  return <div ref={containerRef} className="w-full h-full rounded-lg" />;
}
