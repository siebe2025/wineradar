import { createClient } from "@/lib/supabase/server";
import { generateBriefingForUser } from "@/lib/services/briefing";
import { checkDailyManualBriefingLimit } from "@/lib/services/usage";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Server-side daily limit: max 1 manual briefing per user per day (UTC)
  const canGenerate = await checkDailyManualBriefingLimit(user.id);
  if (!canGenerate) {
    return NextResponse.json(
      {
        error:
          "You have already generated a test briefing today. Please try again tomorrow.",
        dailyLimitReached: true,
      },
      { status: 429 }
    );
  }

  try {
    const result = await generateBriefingForUser(user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-test] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
