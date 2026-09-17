import { promises as fs } from "fs";
import path from "path";
import type { Vehicle } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "vehicles.json");

export async function loadVehicles(): Promise<Vehicle[]> {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return JSON.parse(raw) as Vehicle[];
}

export async function saveVehicles(vehicles: Vehicle[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, `${JSON.stringify(vehicles, null, 2)}\n`, "utf8");
}
