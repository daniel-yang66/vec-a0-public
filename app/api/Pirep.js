"use server";
export default async function Pirep(lat1, lon1, lat2, lon2) {
  try {
    const pirepData =
      await fetch(`https://aviationweather.gov/api/data/pirep?bbox=${lat1},${lon1},${lat2},${lon2}&format=json
  `);
    const pirep = await pirepData.json();

    return pirep;
  } catch {
    return null;
  }
}
