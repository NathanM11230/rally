import { NextResponse } from "next/server";

import { sendDueLessonReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return runReminderCheck(request);
}

export async function POST(request: Request) {
  return runReminderCheck(request);
}

async function runReminderCheck(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await sendDueLessonReminders();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send reminders.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}
