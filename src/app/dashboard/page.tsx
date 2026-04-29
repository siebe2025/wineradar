import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const month = new Date().toISOString().slice(0, 7);
  const todayStart = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
  const tomorrowStart = (() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return `${d.toISOString().slice(0, 10)}T00:00:00.000Z`;
  })();

  const [
    brandsRes,
    topicsRes,
    emailRes,
    briefingsRes,
    exaRes,
    openaiRes,
    smtpRes,
    todayBriefingRes,
  ] = await Promise.all([
    supabase.from("brands").select("id").eq("user_id", user.id),
    supabase.from("topics").select("id").eq("user_id", user.id),
    supabase.from("email_settings").select("recipient_email, is_enabled").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("briefings")
      .select("id, title, created_at, email_sent_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Exa usage this month
    supabase.from("api_usage").select("request_count").eq("user_id", user.id).eq("provider", "exa").eq("period_month", month),
    // OpenAI usage this month
    supabase.from("api_usage").select("request_count").eq("user_id", user.id).eq("provider", "openai").eq("period_month", month),
    // SMTP usage this month
    supabase.from("api_usage").select("request_count").eq("user_id", user.id).eq("provider", "smtp").eq("period_month", month),
    // Any briefing created today (for daily limit indicator)
    supabase.from("briefings").select("id").eq("user_id", user.id).gte("created_at", todayStart).lt("created_at", tomorrowStart).limit(1),
  ]);

  const sum = (rows: { request_count: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + r.request_count, 0);

  return (
    <AppLayout>
      <DashboardClient
        brandCount={brandsRes.data?.length ?? 0}
        topicCount={topicsRes.data?.length ?? 0}
        emailSettings={emailRes.data ?? null}
        latestBriefing={briefingsRes.data ?? null}
        exaUsage={sum(exaRes.data)}
        exaCap={Number(process.env.EXA_MONTHLY_REQUEST_CAP ?? 800)}
        openaiUsage={sum(openaiRes.data)}
        openaiCap={Number(process.env.OPENAI_MONTHLY_REQUEST_CAP ?? 100)}
        smtpUsage={sum(smtpRes.data)}
        canGenerateToday={!(todayBriefingRes.data?.length)}
      />
    </AppLayout>
  );
}
