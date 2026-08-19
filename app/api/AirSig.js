"use server";
export default async function AirSig() {
  let gAir, dSig, air, iSig;
  try {
    const gAirData =
      await fetch(`https://aviationweather.gov/api/data/gairmet?format=json
  `);
    try {
      gAir = await gAirData.json();
    } catch {
      gAir = [];
    }

    const dSigData =
      await fetch(`https://aviationweather.gov/api/data/airsigmet?format=json&types=sigmet
    `);

    try {
      dSig = await dSigData.json();
    } catch {
      dSig = [];
    }

    const airData =
      await fetch(`https://aviationweather.gov/api/data/airmet?format=json
      `);
    try {
      air = await airData.json();
    } catch {
      air = [];
    }
    const iSigData =
      await fetch(`https://aviationweather.gov/api/data/isigmet?format=json
    `);

    try {
      iSig = await iSigData.json();
    } catch {
      iSig = [];
    }

    return { iSig: iSig, air: air, gAir: gAir, dSig: dSig };
  } catch {
    return null;
  }
}
