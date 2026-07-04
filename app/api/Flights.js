"use server";
export default async function RealTime(dep, arr, flightNo) {
  let data;
  let flightInfo = [];
  let flightNumbers;

  if (!flightNo) {
    const res1 = await fetch(
      `https://airlabs.co/api/v9/flights?api_key=${process.env.AIR_KEY}&dep_icao=${dep}&arr_icao=${arr}`,
    );

    data = await res1.json();
    flightNumbers = data.response.map((flt) => flt.flight_icao);

    flightInfo = await Promise.all(
      flightNumbers.map(async (flt) => {
        const res2 = await fetch(
          `https://airlabs.co/api/v9/flight?api_key=${process.env.AIR_KEY}&flight_icao=${flt}
    `,
        );
        const flightData = await res2.json();
        return flightData.response;
      }),
    );
  } else {
    const type =
      flightNo && flightNo[2] && /^[A-Za-z]+$/.test(flightNo[2])
        ? "flight_icao"
        : "flight_iata";
    const res = await fetch(
      `https://airlabs.co/api/v9/flight?api_key=${process.env.AIR_KEY}&${type}=${flightNo}
`,
    );
    const flightData = await res.json();
    flightInfo.push(flightData.response);
  }

  return flightInfo;
}
