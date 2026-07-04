// import { tablesDB } from "../lib/supabase";
// import { Query } from "appwrite";
import { createClient } from "../lib/supabase";
// export async function getAirportDetails(origin, destination) {
//   const data = await tablesDB.listRows({
//     databaseId: process.env.NEXT_PUBLIC_DATABASE_ID,
//     tableId: process.env.NEXT_PUBLIC_TABLE_ID,
//     queries: [Query.equal("icao_code", [origin, destination])],
//   });

//   const og = data.rows.filter((item, i) => item.icao_code === origin)[0];
//   const dest = data.rows.filter((item, i) => item.icao_code === destination)[0];

//   return { origin: og, destination: dest };
// }

// export async function getAirlineLogo(code) {
//   const data = await tablesDB.listRows({
//     databaseId: process.env.NEXT_PUBLIC_DATABASE_ID,
//     tableId: process.env.NEXT_PUBLIC_TABLE_ID_3,
//     queries: [Query.limit(1), Query.equal("iata", code)],
//   });
//   return data["rows"];
// }

// export async function getRunways(origin, destination) {
//   const data = await tablesDB.listRows({
//     databaseId: process.env.NEXT_PUBLIC_DATABASE_ID,
//     tableId: process.env.NEXT_PUBLIC_TABLE_ID_2,
//     queries: [Query.equal("airport_ident", [origin, destination])],
//   });
//   const ogRwy = data.rows.filter((item, i) => item.airport_ident === origin);
//   const destRwy = data.rows.filter(
//     (item, i) => item.airport_ident === destination
//   );

//   return { origin: ogRwy, destination: destRwy };
// }
const supabase = createClient();

export async function GetAirportDetails(origin, destination) {
  const { data, error } = await supabase
    .from("airports")
    .select()
    .or(`icao_code.eq.${origin},icao_code.eq.${destination}`);

  const og = data.filter((item, i) => item.icao_code === origin)[0];
  const dest = data.filter((item, i) => item.icao_code === destination)[0];

  return { origin: og, destination: dest };
}

export async function GetAirlineLogos(lst) {
  const { data, error } = await supabase
    .from("airlines")
    .select()
    .in("iata", lst);

  return data;
}

export async function GetAirportOptions(text) {
  const { data, error } = await supabase
    .from("airports")
    .select()
    .limit(5)
    .or(
      `icao_code.ilike.${text}%,iata_code.ilike.${text}%,name.ilike.${text}%`,
    );

  return data;
}

export async function GetAirlineLogo(code) {
  const { data, error } = await supabase
    .from("airlines")
    .select()
    .eq("iata", code);

  return data;
}

export async function GetRunways(origin, destination) {
  const { data, error } = await supabase
    .from("runways")
    .select()
    .or(`airport_ident.eq.${origin},airport_ident.eq.${destination}`);

  const ogRwy = data.filter((item, i) => item.airport_ident === origin);
  const destRwy = data.filter((item, i) => item.airport_ident === destination);

  return { origin: ogRwy, destination: destRwy };
}
