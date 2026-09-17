import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  COOKIE_OPTIONS,
  createSessionToken,
  credentialsMatch,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;
  const username = String(body?.username ?? "");
  const password = String(body?.password ?? "");

  if (!credentialsMatch(username, password)) {
    return NextResponse.json(
      { error: "Wrong username or password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, await createSessionToken(), COOKIE_OPTIONS);
  return response;
}
