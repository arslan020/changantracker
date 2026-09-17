"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EnrichedVehicle, Vehicle, ClockStatus } from "@/lib/types";
import {
  ANNUAL_RATE,
  enrichVehicles,
  formatDate,
  formatDays,
  formatGBP,
  summarise,
} from "@/lib/tracker";

type Filter = "ALL" | "NEWAUTO" | "DEMO";

const statusLabel: Record<ClockStatus, string> = {
  ok: "On track",
  watch: "Watch",
  urgent: "Urgent",
  overdue: "Overdue",
};

function statusClass(status: ClockStatus): string {
  if (status === "ok") return "bg-[var(--ok-bg)] text-[var(--ok)]";
  if (status === "watch") return "bg-[var(--watch-bg)] text-[var(--watch)]";
  if (status === "urgent") return "bg-[var(--urgent-bg)] text-[var(--urgent)]";
  return "bg-[var(--overdue-bg)] text-[var(--overdue)]";
}

function barClass(status: ClockStatus): string {
  if (status === "ok") return "bg-[var(--ok)]";
  if (status === "watch") return "bg-[var(--watch)]";
  if (status === "urgent") return "bg-[var(--urgent)]";
  return "bg-[var(--overdue)]";
}

function typeLabel(type: string): string {
  return type === "DEMO" ? "Demo" : type === "NEWAUTO" ? "New" : type;
}

function progress(elapsed: number, windowDays: number): number {
  return Math.min(100, Math.max(0, (elapsed / windowDays) * 100));
}

function DaysCell({
  remaining,
  deadline,
  elapsed,
  windowDays,
  status,
  caption,
}: {
  remaining: number;
  deadline: string;
  elapsed: number;
  windowDays: number;
  status: ClockStatus;
  caption: string;
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-xl font-semibold leading-none tracking-tight text-[var(--navy)] sm:text-[1.35rem]">
        {remaining}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">{formatDays(remaining)}</p>
      <p className="mt-0.5 text-xs text-[var(--muted)]">
        {caption} {formatDate(deadline)}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--track)]">
        <div
          className={`h-1.5 rounded-full ${barClass(status)}`}
          style={{ width: `${progress(elapsed, windowDays)}%` }}
        />
      </div>
    </div>
  );
}

function VehicleCard({
  vehicle,
  selected,
  onSelect,
}: {
  vehicle: EnrichedVehicle;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-none border-b border-[var(--line)] bg-white p-4 text-left last:border-b-0 ${
        selected ? "bg-[var(--hover)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-[13px] tracking-wide">{vehicle.vin}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{vehicle.invoiceNumber}</p>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${statusClass(
            vehicle.sold ? "ok" : vehicle.overallStatus,
          )}`}
        >
          {vehicle.sold ? "Settled" : statusLabel[vehicle.overallStatus]}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span>{typeLabel(vehicle.vehicleType)}</span>
        <span className="text-[var(--muted)]">{formatDate(vehicle.invoiceDate)}</span>
        <span className="font-medium">{formatGBP(vehicle.outstandingAmount)}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            90-day
          </p>
          <DaysCell
            remaining={vehicle.day90.remainingDays}
            deadline={vehicle.day90.deadline}
            elapsed={vehicle.day90.elapsedDays}
            windowDays={90}
            status={vehicle.day90.status}
            caption="Ends"
          />
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            360-day
          </p>
          <DaysCell
            remaining={vehicle.day360.remainingDays}
            deadline={vehicle.day360.deadline}
            elapsed={vehicle.day360.elapsedDays}
            windowDays={360}
            status={vehicle.day360.status}
            caption="Ends"
          />
        </div>
      </div>
    </button>
  );
}

function VehicleDetail({
  vehicle,
  onClose,
}: {
  vehicle: EnrichedVehicle;
  onClose: () => void;
}) {
  return (
    <aside className="flex h-full w-full flex-col border-l border-[var(--line)] bg-white sm:max-w-md">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
        <div>
          <p className="break-all font-mono text-sm tracking-wide">{vehicle.vin}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{vehicle.invoiceNumber}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 shrink-0 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-md px-2 py-1 text-xs font-medium ${statusClass(vehicle.overallStatus)}`}>
            {vehicle.sold ? "Settled" : statusLabel[vehicle.overallStatus]}
          </span>
          <span className="rounded-md bg-[var(--soft)] px-2 py-1 text-xs font-medium text-[var(--navy)]">
            {typeLabel(vehicle.vehicleType)}
          </span>
          <span className="rounded-md bg-[var(--soft)] px-2 py-1 text-xs font-medium text-[var(--navy)]">{vehicle.scName}</span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
          <div>
            <dt className="text-[var(--muted)]">Outstanding</dt>
            <dd className="mt-1 font-medium">{formatGBP(vehicle.outstandingAmount)}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Initial amount</dt>
            <dd className="mt-1 font-medium">{formatGBP(vehicle.initialAmount)}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Invoice date</dt>
            <dd className="mt-1 font-medium">{formatDate(vehicle.invoiceDate)}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Financing date</dt>
            <dd className="mt-1 font-medium">{formatDate(vehicle.financingDate)}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Interest starts (IBP)</dt>
            <dd className="mt-1 font-medium">{formatDate(vehicle.ibpDate)}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Scheduled payment</dt>
            <dd className="mt-1 font-medium">{formatDate(vehicle.paymentDate)}</dd>
          </div>
        </dl>

        <ol className="mt-8 border-t border-[var(--line)] pt-5">
          {[
            ["Invoice", vehicle.invoiceDate, "Clock starts"],
            ["90-day sell window", vehicle.day90.deadline, formatDays(vehicle.day90.remainingDays)],
            ["IBP / interest", vehicle.ibpDate, formatDays(vehicle.ibp.remainingDays)],
            ["360-day window", vehicle.day360.deadline, formatDays(vehicle.day360.remainingDays)],
            ["Payment due", vehicle.paymentDate, "Wholesale repayment"],
          ].map(([label, date, note]) => (
            <li key={label} className="grid grid-cols-[1rem_1fr] gap-3 pb-4 last:pb-0">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--navy)]" />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-sm text-[var(--muted)]">
                  {formatDate(String(date))} · {note}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-2 border-t border-[var(--line)] pt-5 text-sm">
          <p className="font-medium">Interest</p>
          <p className="mt-2 leading-6 text-[var(--muted)]">
            {(ANNUAL_RATE * 100).toFixed(1)}% simple interest, 365-day basis. £0 before the IBP
            date. After IBP, {formatGBP(vehicle.dailyInterest)} per day on the outstanding
            balance.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-[var(--muted)]">Accrued to date</dt>
              <dd className="mt-1 font-medium">{formatGBP(vehicle.accruedInterest)}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">If held to payment</dt>
              <dd className="mt-1 font-medium">
                {formatGBP(vehicle.projectedInterestToPayment)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </aside>
  );
}

export function Dashboard({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [asOf, setAsOf] = useState(() => new Date());
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [selectedVin, setSelectedVin] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tick = () => setAsOf(new Date());
    const id = window.setInterval(tick, 60_000);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const enriched = useMemo(() => enrichVehicles(vehicles, asOf), [vehicles, asOf]);
  const summary = useMemo(() => summarise(enriched), [enriched]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter((vehicle) => {
      if (filter !== "ALL" && vehicle.vehicleType !== filter) return false;
      if (!q) return true;
      return [vehicle.vin, vehicle.invoiceNumber, vehicle.vehicleType, vehicle.scName]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [enriched, filter, query]);

  const selected = enriched.find((vehicle) => vehicle.vin === selectedVin) ?? null;

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/vehicles/upload", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as {
        vehicles?: Vehicle[];
        count?: number;
        error?: string;
      };
      if (!response.ok || !payload.vehicles) {
        throw new Error(payload.error || "Upload failed.");
      }
      setVehicles(payload.vehicles);
      setSelectedVin(null);
      setMessage(`${payload.count} vehicles imported from Excel.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const stamp = asOf.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-full bg-[var(--page)]">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-white text-[var(--ink)]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 sm:px-6 sm:py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <img
              src="/heston-changan-logo.jpg"
              alt="Changan Heston Automotive"
              className="h-8 w-auto max-w-full object-contain object-left sm:h-10 md:max-w-[280px] lg:h-12 lg:max-w-none"
            />
            <div className="hidden h-8 w-px shrink-0 bg-[var(--line)] md:block" />
            <div className="hidden min-w-0 md:block">
              <p className="text-sm font-semibold text-[var(--navy)]">Changan Tracker</p>
              <p className="hidden text-xs text-[var(--muted)] lg:block">
                90-day and 360-day wholesale clocks
              </p>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <p className="order-last w-full text-xs text-[var(--muted)] sm:order-none sm:mr-auto sm:w-auto lg:mr-0">
              Live as of {stamp}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onUpload(file);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="min-h-11 flex-1 rounded-lg border border-[var(--brand)] bg-white px-3 py-2 text-sm font-medium text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white disabled:opacity-50 sm:flex-none"
            >
              {uploading ? "Importing…" : "Update from Excel"}
            </button>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="min-h-11 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--navy)]"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6 sm:py-6">
        {(message || error) && (
          <p
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-[var(--urgent)] bg-[var(--urgent-bg)] text-[var(--urgent)]"
                : "border-[var(--ok)] bg-[var(--ok-bg)] text-[var(--ok)]"
            }`}
          >
            {error || message}
          </p>
        )}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 xl:gap-4">
          {[
            ["Vehicles in stock", String(summary.stockCount)],
            ["Outstanding", formatGBP(summary.totalOutstanding)],
            [
              "Inside 30 days of 90",
              String(summary.approaching90 + summary.overdue90),
            ],
            ["Accrued interest", formatGBP(summary.accruedInterest)],
            ["Interest if held to payment", formatGBP(summary.projectedInterest)],
          ].map(([label, value], index, list) => (
            <article
              key={label}
              className={`rounded-xl border border-[var(--line)] bg-white px-3 py-3 sm:px-4 sm:py-4 ${
                index === list.length - 1 ? "col-span-2 md:col-span-1 xl:col-span-1" : ""
              }`}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)] sm:text-xs sm:tracking-[0.14em]">
                {label}
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-[var(--navy)] sm:text-2xl">
                {value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-[var(--line)] bg-white">
          <div className="flex flex-col gap-3 border-b border-[var(--line)] bg-white px-3 py-3 sm:px-4 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="flex w-full gap-1 overflow-x-auto rounded-lg bg-[var(--soft)] p-1 lg:w-auto">
              {(
                [
                  ["ALL", `All (${enriched.filter((v) => !v.sold).length})`],
                  ["NEWAUTO", `New (${enriched.filter((v) => v.vehicleType === "NEWAUTO" && !v.sold).length})`],
                  ["DEMO", `Demo (${enriched.filter((v) => v.vehicleType === "DEMO" && !v.sold).length})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`min-h-10 flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition lg:flex-none ${
                    filter === id
                      ? "bg-[var(--brand)] text-white"
                      : "text-[var(--navy)] hover:bg-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search VIN, invoice, type"
              className="w-full min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-base outline-none focus:border-[var(--brand)] sm:text-sm lg:min-w-[16rem]"
            />
            <p className="hidden text-xs text-[var(--muted)] xl:block">
              90 days from invoice · 360 days from invoice · interest from IBP at 7.9%
            </p>
          </div>

          <div>
            <div className="lg:hidden">
              {visible.length === 0 ? (
                <p className="px-4 py-12 text-center text-[var(--muted)]">
                  No vehicles match this filter.
                </p>
              ) : (
                visible.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.vin}
                    vehicle={vehicle}
                    selected={selectedVin === vehicle.vin}
                    onSelect={() =>
                      setSelectedVin((current) =>
                        current === vehicle.vin ? null : vehicle.vin,
                      )
                    }
                  />
                ))
              )}
            </div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-[var(--soft)] text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Vehicle</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Invoice</th>
                    <th className="px-4 py-3 font-medium">Outstanding</th>
                    <th className="px-4 py-3 font-medium">90-day clock</th>
                    <th className="px-4 py-3 font-medium">360-day clock</th>
                    <th className="px-4 py-3 font-medium">Interest</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((vehicle) => (
                    <tr
                      key={vehicle.vin}
                      onClick={() =>
                        setSelectedVin((current) =>
                          current === vehicle.vin ? null : vehicle.vin,
                        )
                      }
                      className={`cursor-pointer border-t border-[var(--line)] hover:bg-[var(--hover)] ${
                        selectedVin === vehicle.vin ? "bg-[var(--hover)]" : "bg-white"
                      }`}
                    >
                      <td className="px-4 py-4 align-top">
                        <p className="font-mono text-[13px] tracking-wide">{vehicle.vin}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {vehicle.invoiceNumber}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        {typeLabel(vehicle.vehicleType)}
                        <p className="mt-1 text-xs text-[var(--muted)]">{vehicle.scCode}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        {formatDate(vehicle.invoiceDate)}
                      </td>
                      <td className="px-4 py-4 align-top font-medium">
                        {formatGBP(vehicle.outstandingAmount)}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <DaysCell
                          remaining={vehicle.day90.remainingDays}
                          deadline={vehicle.day90.deadline}
                          elapsed={vehicle.day90.elapsedDays}
                          windowDays={90}
                          status={vehicle.day90.status}
                          caption="Ends"
                        />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <DaysCell
                          remaining={vehicle.day360.remainingDays}
                          deadline={vehicle.day360.deadline}
                          elapsed={vehicle.day360.elapsedDays}
                          windowDays={360}
                          status={vehicle.day360.status}
                          caption="Ends"
                        />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p>{formatGBP(vehicle.accruedInterest)}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {formatGBP(vehicle.projectedInterestToPayment)} to payment
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span
                          className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${statusClass(
                            vehicle.sold ? "ok" : vehicle.overallStatus,
                          )}`}
                        >
                          {vehicle.sold ? "Settled" : statusLabel[vehicle.overallStatus]}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-[var(--muted)]">
                        No vehicles match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {selected ? (
              <div className="fixed inset-0 z-30 flex justify-end">
                <button
                  type="button"
                  aria-label="Close vehicle details"
                  className="absolute inset-0 bg-slate-900/20"
                  onClick={() => setSelectedVin(null)}
                />
                <div className="relative h-full w-full max-w-none sm:max-w-md">
                  <VehicleDetail vehicle={selected} onClose={() => setSelectedVin(null)} />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
