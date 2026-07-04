"use server";
export default async function Charts(airport) {
  try {
    let data;

    const res = await fetch(
      `https://api-v2.aviationapi.com/v2/charts?airport=${airport}&airac=0`,
    );

    data = await res.json();

    return data;
  } catch {
    return null;
  }
}
