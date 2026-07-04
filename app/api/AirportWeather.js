"use server";
export default async function AirportWeather(airport) {
  let data, data2;

  const res = await fetch(
    `https://avwx.rest/api/metar/${airport}?options=info,translate&airport=true&reporting=true&format=json&onfail=cache&token=${process.env.AVWX_TOKEN}`
  );
  data = await res.json();

  const res2 = await fetch(
    `https://avwx.rest/api/taf/${airport}?&airport=true&reporting=true&format=json&onfail=cache&token=${process.env.AVWX_TOKEN}`
  );
  data2 = await res2.json();

  return { latest: data, forecast: data2 };
}
