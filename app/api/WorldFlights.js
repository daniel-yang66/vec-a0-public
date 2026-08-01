"use server";
export default async function WorldFlights() {
  const res = await fetch(
    `https://airlabs.co/api/v9/flights?api_key=${process.env.AIR_KEY}`,
  );

  const data = await res.json();

  const flightInfo = data.response;

  return flightInfo;
}
