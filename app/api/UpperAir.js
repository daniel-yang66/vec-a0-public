"use server";

export default async function WindsAloft(coords, alt, start, end) {
  const API_TOKEN = process.env.GRIB_STREAM_TOKEN;

  let payload = {
    fromTime: start,
    untilTime: end,
    coordinates: coords,
    variables: [
      { name: "UGRD", level: alt, info: "" },
      { name: "VGRD", level: alt, info: "" },
      { name: "TMP", level: alt, info: "" },
    ],
  };

  const res = await fetch("https://gribstream.com/api/v2/gfs/timeseries", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const windData = await res.json();
  return windData;
}
