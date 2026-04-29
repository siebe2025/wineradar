import { createServiceClient } from "@/lib/supabase/service";

// ── helpers ────────────────────────────────────────────────────────────────

export function currentPeriodMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** ISO date string for today (UTC) */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** ISO date string for Monday of the current week (UTC) */
export function currentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

// ── core functions ─────────────────────────────────────────────────────────

/** Sum request_count for a user / provider / request_type in the current month. */
export async function getMonthlyUsage(
  userId: string,
  provider: string,
  requestType: string
): Promise<number> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("api_usage")
    .select("request_count")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("request_type", requestType)
    .eq("period_month", currentPeriodMonth());

  return (data ?? []).reduce((s, r) => s + r.request_count, 0);
}

/** Sum request_count for a briefing job / provider / request_type. */
export async function getBriefingUsage(
  briefingJobId: string,
  provider: string,
  requestType: string
): Promise<number> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("api_usage")
    .select("request_count")
    .eq("briefing_job_id", briefingJobId)
    .eq("provider", provider)
    .eq("request_type", requestType);

  return (data ?? []).reduce((s, r) => s + r.request_count, 0);
}

/**
 * Returns true if the user is BELOW the monthly cap (i.e. can still make requests).
 * Returns false if the cap has been reached.
 */
export async function checkProviderMonthlyCap(
  userId: string,
  provider: string,
  requestType: string,
  cap: number
): Promise<boolean> {
  const total = await getMonthlyUsage(userId, provider, requestType);
  return total < cap;
}

/** Record one or more API calls. All fields except metadata/briefing refs are required. */
export async function recordApiUsage(
  userId: string,
  provider: string,
  requestType: string,
  count: number,
  opts?: {
    briefingId?: string;
    briefingJobId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("api_usage").insert({
    user_id: userId,
    provider,
    request_type: requestType,
    request_count: count,
    period_month: currentPeriodMonth(),
    briefing_id: opts?.briefingId ?? null,
    briefing_job_id: opts?.briefingJobId ?? null,
    metadata: opts?.metadata ?? {},
  });
}

/**
 * Returns true if the user has NOT yet generated a briefing today (UTC).
 * Returns false if they have — the caller should block the request.
 */
export async function checkDailyManualBriefingLimit(userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const todayStart = `${todayISO()}T00:00:00.000Z`;
  const tomorrowStart = `${tomorrowISO()}T00:00:00.000Z`;

  const { data } = await supabase
    .from("briefings")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", todayStart)
    .lt("created_at", tomorrowStart)
    .limit(1);

  return !data?.length; // true = can generate
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
