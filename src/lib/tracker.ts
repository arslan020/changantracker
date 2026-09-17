import type {
  ClockStatus,
  EnrichedVehicle,
  Vehicle,
  VehicleClock,
} from "./types";

export const ANNUAL_RATE = 0.079;
export const DAY_COUNT = 365;
export const WINDOW_90 = 90;
export const WINDOW_360 = 360;

export function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatDate(value: string): string {
  return parseISODate(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatGBP(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDays(remaining: number): string {
  if (remaining > 0) {
    return `${remaining} day${remaining === 1 ? "" : "s"} left`;
  }
  if (remaining === 0) {
    return "Due today";
  }
  const overdue = Math.abs(remaining);
  return `${overdue} day${overdue === 1 ? "" : "s"} overdue`;
}

export function clockStatus(remainingDays: number): ClockStatus {
  if (remainingDays < 0) return "overdue";
  if (remainingDays <= 14) return "urgent";
  if (remainingDays <= 30) return "watch";
  return "ok";
}

export function buildClock(
  start: Date,
  deadline: Date,
  asOf: Date,
): VehicleClock {
  return {
    deadline: toISODate(deadline),
    remainingDays: daysBetween(asOf, deadline),
    elapsedDays: daysBetween(start, asOf),
    status: clockStatus(daysBetween(asOf, deadline)),
  };
}

function worseStatus(a: ClockStatus, b: ClockStatus): ClockStatus {
  const rank: Record<ClockStatus, number> = {
    ok: 0,
    watch: 1,
    urgent: 2,
    overdue: 3,
  };
  return rank[a] >= rank[b] ? a : b;
}

export function dailyInterestOn(amount: number): number {
  return (amount * ANNUAL_RATE) / DAY_COUNT;
}

export function accruedInterest(
  outstanding: number,
  ibpDate: Date,
  asOf: Date,
): number {
  if (daysBetween(asOf, ibpDate) > 0) return 0;
  const interestDays = daysBetween(ibpDate, asOf) + 1;
  return dailyInterestOn(outstanding) * Math.max(0, interestDays);
}

export function projectedInterest(
  outstanding: number,
  ibpDate: Date,
  paymentDate: Date,
): number {
  const interestDays = daysBetween(ibpDate, paymentDate) + 1;
  return dailyInterestOn(outstanding) * Math.max(0, interestDays);
}

export function enrichVehicle(vehicle: Vehicle, asOf = new Date()): EnrichedVehicle {
  const invoice = parseISODate(vehicle.invoiceDate);
  const ibp = parseISODate(vehicle.ibpDate);
  const payment = parseISODate(vehicle.paymentDate);
  const today = startOfDay(asOf);
  const sold = vehicle.outstandingAmount <= 0;

  const day90 = buildClock(invoice, addDays(invoice, WINDOW_90), today);
  const day360 = buildClock(invoice, addDays(invoice, WINDOW_360), today);
  const ibpClock = buildClock(parseISODate(vehicle.financingDate), ibp, today);

  return {
    ...vehicle,
    day90,
    day360,
    ibp: ibpClock,
    accruedInterest: sold
      ? 0
      : accruedInterest(vehicle.outstandingAmount, ibp, today),
    projectedInterestToPayment: sold
      ? 0
      : projectedInterest(vehicle.outstandingAmount, ibp, payment),
    dailyInterest: sold ? 0 : dailyInterestOn(vehicle.outstandingAmount),
    overallStatus: sold
      ? "ok"
      : worseStatus(day90.status, day360.status),
    sold,
  };
}

export function enrichVehicles(
  vehicles: Vehicle[],
  asOf = new Date(),
): EnrichedVehicle[] {
  return vehicles
    .map((vehicle) => enrichVehicle(vehicle, asOf))
    .sort((a, b) => {
      if (a.sold !== b.sold) return a.sold ? 1 : -1;
      return a.day90.remainingDays - b.day90.remainingDays;
    });
}

export type DashboardSummary = {
  stockCount: number;
  soldCount: number;
  totalOutstanding: number;
  approaching90: number;
  overdue90: number;
  approaching360: number;
  overdue360: number;
  accruedInterest: number;
  projectedInterest: number;
};

export function summarise(vehicles: EnrichedVehicle[]): DashboardSummary {
  const live = vehicles.filter((vehicle) => !vehicle.sold);
  return {
    stockCount: live.length,
    soldCount: vehicles.length - live.length,
    totalOutstanding: live.reduce((sum, vehicle) => sum + vehicle.outstandingAmount, 0),
    approaching90: live.filter(
      (vehicle) =>
        vehicle.day90.remainingDays >= 0 && vehicle.day90.remainingDays <= 30,
    ).length,
    overdue90: live.filter((vehicle) => vehicle.day90.remainingDays < 0).length,
    approaching360: live.filter(
      (vehicle) =>
        vehicle.day360.remainingDays >= 0 && vehicle.day360.remainingDays <= 45,
    ).length,
    overdue360: live.filter((vehicle) => vehicle.day360.remainingDays < 0).length,
    accruedInterest: live.reduce((sum, vehicle) => sum + vehicle.accruedInterest, 0),
    projectedInterest: live.reduce(
      (sum, vehicle) => sum + vehicle.projectedInterestToPayment,
      0,
    ),
  };
}
