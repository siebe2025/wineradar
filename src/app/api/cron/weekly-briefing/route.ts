import { runWeeklyCron } from "@/lib/services/briefing";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-cron-secret");
  const token = authHeader?.replace("Bearer ", "") ?? cronHeader ?? "";

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  console.log("[cron] Weekly briefing job started");

  try {
    const result = await runWeeklyCron();
    console.log(`[cron] Done. Processed: ${result.processed}, Errors: ${result.errors.length}`);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron] Fatal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Vercel cron also calls with GET
export async function GET(request: NextRequest) {
  return POST(request);
}
