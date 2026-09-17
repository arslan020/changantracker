"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Could not sign in.");
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full min-h-dvh items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <div className="h-1.5 bg-[var(--brand)]" />
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <img
            src="/heston-changan-logo.jpg"
            alt="Changan Heston Automotive"
            className="mx-auto h-10 w-auto max-w-[min(100%,280px)] object-contain sm:h-14 sm:max-w-none"
          />
          <h1 className="mt-7 text-center text-xl font-semibold tracking-tight">
            Changan Tracker
          </h1>
          <p className="mt-1.5 text-center text-sm text-[var(--muted)]">
            Sign in to the wholesale stock clocks
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <label className="block text-sm">
              <span className="font-medium text-[var(--navy)]">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                className="mt-1.5 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none transition focus:border-[var(--brand)]"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-[var(--navy)]">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none transition focus:border-[var(--brand)]"
                required
              />
            </label>

            {error ? (
              <p className="rounded-lg border border-[var(--urgent)] bg-[var(--urgent-bg)] px-3 py-2 text-sm text-[var(--urgent)]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[var(--brand)] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)] disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
