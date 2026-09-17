import * as XLSX from "xlsx";
import type { Vehicle } from "./types";
import { addDays, parseISODate, toISODate, WINDOW_90, WINDOW_360 } from "./tracker";

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function cellString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function cellNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(/[,£]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function excelSerialToISO(serial: number): string {
  const parsed = XLSX.SSF.parse_date_code(serial);
  if (!parsed) return "";
  const month = String(parsed.m).padStart(2, "0");
  const day = String(parsed.d).padStart(2, "0");
  return `${parsed.y}-${month}-${day}`;
}

function cellDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return excelSerialToISO(value);
  }
  const text = cellString(value);
  if (!text) return "";
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const uk = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (uk) {
    return `${uk[3]}-${uk[2].padStart(2, "0")}-${uk[1].padStart(2, "0")}`;
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return cellDate(parsed);
  }
  return "";
}

function pick(row: Record<string, unknown>, ...keys: string[]): unknown {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]),
  );
  for (const key of keys) {
    if (normalized[key] != null && normalized[key] !== "") {
      return normalized[key];
    }
  }
  return undefined;
}

export function parseInvoiceWorkbook(buffer: Buffer): Vehicle[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName =
    workbook.SheetNames.find((name) => name.toLowerCase() === "invoice") ??
    workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("The Excel file has no sheets.");
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName],
    { defval: null },
  );

  const vehicles = rows
    .map((row) => {
      const vin = cellString(pick(row, "vin"));
      const invoiceNumber = cellString(pick(row, "invoice"));
      if (!vin && !invoiceNumber) return null;
      if (!vin) return null;

      const invoiceDate = cellDate(pick(row, "invoiced", "invoicedate"));
      const financingDate = cellDate(pick(row, "financingdate", "financingd"));
      const ibpDate = cellDate(pick(row, "ibpd", "ibpdate"));
      const paymentDate = cellDate(
        pick(row, "paymentd", "scheduledpaymentdate", "paymentdate"),
      );

      if (!invoiceDate) return null;

      const finance = financingDate || invoiceDate;
      return {
        invoiceNumber,
        vin,
        initialAmount: cellNumber(pick(row, "initialamt", "initialamount")),
        outstandingAmount: cellNumber(
          pick(row, "outstamt", "outstandingamt", "outstandingamount"),
        ),
        invoiceDate,
        financingDate: finance,
        ibpDate: ibpDate || toISODate(addDays(parseISODate(finance), WINDOW_90)),
        paymentDate:
          paymentDate || toISODate(addDays(parseISODate(invoiceDate), WINDOW_360)),
        contractNumber: cellString(pick(row, "contractn", "contractno", "contractnumber")),
        contract: cellString(pick(row, "contract")),
        vehicleType: cellString(pick(row, "vehicletype")) || "NEWAUTO",
        scCode: cellString(pick(row, "scn", "sccode")),
        scName: cellString(pick(row, "scname")),
        fuelType: cellString(pick(row, "fueltype")),
      } satisfies Vehicle;
    })
    .filter((row): row is Vehicle => row !== null);

  if (vehicles.length === 0) {
    throw new Error("No vehicle rows found on the Invoice sheet.");
  }

  return vehicles;
}
