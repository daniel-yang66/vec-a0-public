"use server";
export default async function Atis(airport) {
  const atisData = await fetch(`https://datis.clowd.io/api/${airport}`);
  const atis = await atisData.json();
  return atis;
}
