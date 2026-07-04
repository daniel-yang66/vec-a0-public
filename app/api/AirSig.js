"use server";
export default async function AirSig() {
  try {
    const gAirData =
      await fetch(`https://aviationweather.gov/api/data/gairmet?format=json
  `);
    const gAir = await gAirData.json();

    const dSigData =
      await fetch(`https://aviationweather.gov/api/data/airsigmet?format=json&type=sigmet
`);

    const dSig = await dSigData.json();

    const airData =
      await fetch(`https://aviationweather.gov/api/data/airmet?format=json
  `);
    const air = await airData.json();

    const iSigData =
      await fetch(`https://aviationweather.gov/api/data/isigmet?format=json
`);

    const iSig = await iSigData.json();

    return { iSig: iSig, air: air, gAir: gAir, dSig: dSig };
  } catch {
    return null;
  }
}
