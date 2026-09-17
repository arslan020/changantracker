export type VehicleType = "NEWAUTO" | "DEMO" | string;

export type Vehicle = {
  invoiceNumber: string;
  vin: string;
  initialAmount: number;
  outstandingAmount: number;
  invoiceDate: string;
  financingDate: string;
  ibpDate: string;
  paymentDate: string;
  contractNumber: string;
  contract: string;
  vehicleType: VehicleType;
  scCode: string;
  scName: string;
  fuelType: string;
};

export type ClockStatus = "ok" | "watch" | "urgent" | "overdue";

export type VehicleClock = {
  deadline: string;
  remainingDays: number;
  elapsedDays: number;
  status: ClockStatus;
};

export type EnrichedVehicle = Vehicle & {
  day90: VehicleClock;
  day360: VehicleClock;
  ibp: VehicleClock;
  accruedInterest: number;
  projectedInterestToPayment: number;
  dailyInterest: number;
  overallStatus: ClockStatus;
  sold: boolean;
};
