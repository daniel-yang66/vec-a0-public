"use server";
export default async function Notam(airport) {
  const url = `https://skylink-api.p.rapidapi.com/notams/${airport}`;
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": process.env.SKYLINK_KEY,
      "x-rapidapi-host": "skylink-api.p.rapidapi.com",
      "Content-Type": "application/json",
    },
  };

  try {
    const notamData = await fetch(url, options);
    const notams = await notamData.json();

    return notams;
  } catch {
    return null;
  }
}
