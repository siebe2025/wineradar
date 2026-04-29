import { createServiceClient } from "@/lib/supabase/service";
import { searchExaForBrand } from "./exa";
import { summarizeBrandWithOpenAI, buildFallbackContent } from "./openai";
import { sendBriefingEmail } from "./email";
import {
  recordApiUsage,
  checkProviderMonthlyCap,
  getMonthlyUsage,
  currentWeekMonday,
  currentPeriodMonth,
} from "./usage";
import type { UserSetup, Brand, ExaResult } from "@/lib/types";

// ── env helpers ────────────────────────────────────────────────────────────

function cfg() {
  return {
    exaMonthlyCap:        Number(process.env.EXA_MONTHLY_REQUEST_CAP        ?? 800),
    exaPerBriefingMax:    Number(process.env.EXA_REQUESTS_PER_BRIEFING_MAX  ?? 5),
    openaiMonthlyCap:     Number(process.env.OPENAI_MONTHLY_REQUEST_CAP     ?? 100),
    openaiPerBriefingMax: Number(process.env.OPENAI_REQUESTS_PER_BRIEFING_MAX ?? 5),
  };
}

// ── public helpers ─────────────────────────────────────────────────────────

export async function getUserSetup(userId: string): Promise<UserSetup> {
  const supabase = createServiceClient();
  const month = currentPeriodMonth();

  const [brandsRes, topicsRes, emailRes, exaRes, openaiRes, smtpRes] = await Promise.all([
    supabase.from("brands").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("topics").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("email_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("api_usage").select("request_count").eq("user_id", userId).eq("provider", "exa").eq("period_month", month),
    supabase.from("api_usage").select("request_count").eq("user_id", userId).eq("provider", "openai").eq("period_month", month),
    supabase.from("api_usage").select("request_count").eq("user_id", userId).eq("provider", "smtp").eq("period_month", month),
  ]);

  return {
    brands:             brandsRes.data ?? [],
    topics:             topicsRes.data ?? [],
    emailSettings:      emailRes.data ?? null,
    exaUsageThisMonth:  (exaRes.data ?? []).reduce((s, r) => s + r.request_count, 0),
    openaiUsageThisMonth: (openaiRes.data ?? []).reduce((s, r) => s + r.request_count, 0),
    smtpUsageThisMonth: (smtpRes.data ?? []).reduce((s, r) => s + r.request_count, 0),
  };
}

// ── main generation ────────────────────────────────────────────────────────

export async function generateBriefingForUser(
  userId: string,
  options: { scheduledFor?: string } = {}
): Promise<{ briefingId: string; emailSent: boolean }> {
  const supabase = createServiceClient();
  const scheduledFor = options.scheduledFor ?? new Date().toISOString().slice(0, 10);
  const limits = cfg();

  // Create job record
  const { data: job, error: jobError } = await supabase
    .from("briefing_jobs")
    .insert({
      user_id: userId,
      status: "running",
      scheduled_for: scheduledFor,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (jobError || !job) throw new Error(`Failed to create briefing job: ${jobError?.message}`);

  try {
    const setup = await getUserSetup(userId);

    if (!setup.brands.length) throw new Error("No brands configured. Add at least one brand first.");
    if (!setup.topics.length) throw new Error("No topics configured. Add at least one topic first.");

    // Check global monthly caps up-front (for early abort)
    const [exaMonthlyOk, openaiMonthlyOk] = await Promise.all([
      checkProviderMonthlyCap(userId, "exa", "search", limits.exaMonthlyCap),
      checkProviderMonthlyCap(userId, "openai", "summarization", limits.openaiMonthlyCap),
    ]);

    if (!openaiMonthlyOk) {
      console.log(`[briefing] OpenAI monthly cap (${limits.openaiMonthlyCap}) reached for user ${userId}.`);
    }

    const items: { brand: Brand; content: string; sources: ExaResult[] }[] = [];

    // Per-run counters (enforced in-memory; avoids re-querying DB per brand)
    let exaCallsThisRun = 0;
    let openaiCallsThisRun = 0;

    for (const brand of setup.brands) {
      try {
        // ── Exa search ────────────────────────────────────────────────
        let exaResults: ExaResult[] | null = null;
        const exaRunOk  = exaCallsThisRun < limits.exaPerBriefingMax;
        const exaRunAllowed = exaRunOk && exaMonthlyOk;

        if (exaRunAllowed) {
          console.log(`[briefing] Exa search for: ${brand.name}`);
          exaResults = await searchExaForBrand(brand, setup.topics);
          exaCallsThisRun++;
          await recordApiUsage(userId, "exa", "search", 1, {
            briefingJobId: job.id,
            metadata: { brand: brand.name },
          });
        } else {
          console.log(
            `[briefing] Skipping Exa for ${brand.name} — ` +
            (!exaRunOk ? `per-briefing cap (${limits.exaPerBriefingMax}) reached` : `monthly cap reached`)
          );
        }

        // ── OpenAI summarisation ──────────────────────────────────────
        const openaiRunOk = openaiCallsThisRun < limits.openaiPerBriefingMax;
        const openaiRunAllowed = openaiRunOk && openaiMonthlyOk;

        let content: string;
        if (openaiRunAllowed) {
          console.log(`[briefing] OpenAI summarisation for: ${brand.name}`);
          const result = await summarizeBrandWithOpenAI(brand, setup.topics, exaResults);
          openaiCallsThisRun++;
          await recordApiUsage(userId, "openai", "summarization", 1, {
            briefingJobId: job.id,
            metadata: { brand: brand.name, model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini" },
          });
          content = JSON.stringify(result);
        } else {
          console.log(
            `[briefing] Using fallback content for ${brand.name} — ` +
            (!openaiRunOk ? `per-briefing cap (${limits.openaiPerBriefingMax}) reached` : `monthly cap reached`)
          );
          content = JSON.stringify(buildFallbackContent(brand));
        }

        items.push({ brand, content, sources: exaResults ?? [] });
      } catch (err) {
        console.error(`[briefing] Error processing brand ${brand.name}:`, err);
        // Continue with remaining brands
      }
    }

    if (!items.length) throw new Error("All brands failed to generate content.");

    // Build overall summary line
    const overallSummary = items
      .map((item) => {
        try { return (JSON.parse(item.content) as { summary?: string }).summary ?? ""; }
        catch { return ""; }
      })
      .filter(Boolean)
      .join(" ");

    const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const title = `WineRadar Briefing – ${date}`;

    // Create briefing record
    const { data: briefing, error: briefingError } = await supabase
      .from("briefings")
      .insert({ user_id: userId, briefing_job_id: job.id, title, summary: overallSummary })
      .select()
      .single();

    if (briefingError || !briefing) throw new Error(`Failed to create briefing: ${briefingError?.message}`);

    // Insert briefing items
    for (const item of items) {
      await supabase.from("briefing_items").insert({
        briefing_id: briefing.id,
        brand_id:    item.brand.id,
        brand_name:  item.brand.name,
        content:     item.content,
        sources:     item.sources,
      });
    }

    // Mark job done
    await supabase
      .from("briefing_jobs")
      .update({ status: "done", finished_at: new Date().toISOString() })
      .eq("id", job.id);

    // ── Email ─────────────────────────────────────────────────────────
    let emailSent = false;
    const settings = setup.emailSettings;
    if (settings?.recipient_email && settings.is_enabled) {
      try {
        const { data: emailItems } = await supabase
          .from("briefing_items")
          .select("*")
          .eq("briefing_id", briefing.id);

        await sendBriefingEmail(settings.recipient_email, briefing, emailItems ?? []);

        await supabase
          .from("briefings")
          .update({ email_sent_at: new Date().toISOString() })
          .eq("id", briefing.id);

        await recordApiUsage(userId, "smtp", "email_send", 1, {
          briefingId:    briefing.id,
          briefingJobId: job.id,
          metadata:      { recipient: settings.recipient_email },
        });

        emailSent = true;
        console.log(`[briefing] Email sent to ${settings.recipient_email}`);
      } catch (err) {
        console.error("[briefing] Email send failed (briefing saved):", err);
      }
    }

    return { briefingId: briefing.id, emailSent };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("briefing_jobs")
      .update({ status: "failed", finished_at: new Date().toISOString(), error_message: message })
      .eq("id", job.id);
    throw err;
  }
}

// ── weekly cron ────────────────────────────────────────────────────────────

export async function runWeeklyCron(): Promise<{ processed: number; errors: string[] }> {
  const supabase = createServiceClient();
  const scheduledFor = currentWeekMonday();

  const { data: settings, error } = await supabase
    .from("email_settings")
    .select("user_id")
    .eq("is_enabled", true);

  if (error) throw new Error(`Failed to fetch email settings: ${error.message}`);
  if (!settings?.length) return { processed: 0, errors: [] };

  const errors: string[] = [];
  let processed = 0;

  for (const row of settings) {
    const userId = row.user_id;

    // Idempotency: skip if this week's briefing is already done or in-progress
    const { data: existingJob } = await supabase
      .from("briefing_jobs")
      .select("id, status")
      .eq("user_id", userId)
      .eq("scheduled_for", scheduledFor)
      .in("status", ["running", "done"])
      .maybeSingle();

    if (existingJob) {
      console.log(
        `[cron] Skipping user ${userId} — briefing already ${existingJob.status} for week of ${scheduledFor}`
      );
      continue;
    }

    try {
      console.log(`[cron] Generating briefing for user ${userId}`);
      await generateBriefingForUser(userId, { scheduledFor });
      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[cron] Error for user ${userId}: ${msg}`);
      errors.push(`${userId}: ${msg}`);
    }
  }

  return { processed, errors };
}

// ── re-export usage helpers so callers don't need two imports ──────────────
export { getMonthlyUsage, currentPeriodMonth };
