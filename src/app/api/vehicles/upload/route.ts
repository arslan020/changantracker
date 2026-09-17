import { NextResponse } from "next/server";
import { parseInvoiceWorkbook } from "@/lib/excel";
import { saveVehicles } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Choose an Excel file to upload." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const vehicles = parseInvoiceWorkbook(buffer);
    await saveVehicles(vehicles);
    return NextResponse.json({ vehicles, count: vehicles.length });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not import the Excel file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
