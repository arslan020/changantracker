import { NextResponse } from "next/server";
import { loadVehicles } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const vehicles = await loadVehicles();
  return NextResponse.json({ vehicles });
}
