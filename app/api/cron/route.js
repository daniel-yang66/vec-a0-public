import { GetAirportOptions } from "@/app/utils/Database";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await GetAirportOptions("KSFO");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
