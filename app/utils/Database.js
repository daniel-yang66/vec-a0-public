import { createClient } from "../lib/supabase";

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
