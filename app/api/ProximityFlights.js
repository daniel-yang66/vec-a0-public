"use server";
export default async function NearbyFlights(lat1, lon1, lat2, lon2) {
  const res = await fetch(
    `https://airlabs.co/api/v9/flights?api_key=${process.env.AIR_KEY}&bbox=${lat1},${lon1},${lat2},${lon2}`,
  );

  const data = await res.json();

  const flightInfo = data.response;

  return flightInfo;
}
