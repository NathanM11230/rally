import { NextResponse } from "next/server";

export async function readJson(request: Request) {
  try {
    return { ok: true as const, value: await request.json() };
  } catch {
    return { ok: false as const, error: "Request body must be valid JSON." };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function handleApiError(error: unknown) {
  console.error(error);
  return NextResponse.json(
    { error: "Unexpected server error." },
    { status: 500 },
  );
}
