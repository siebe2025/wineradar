"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MAX_BRANDS = Number(process.env.NEXT_PUBLIC_MAX_BRANDS ?? 5);
const MAX_TOPICS = Number(process.env.NEXT_PUBLIC_MAX_TOPICS ?? 5);

type Props = {
  brandCount: number;
  topicCount: number;
  emailSettings: { recipient_email: string; is_enabled: boolean } | null;
  latestBriefing: { id: string; title: string; created_at: string; email_sent_at: string | null } | null;
  exaUsage: number;
  exaCap: number;
  openaiUsage: number;
  openaiCap: number;
  smtpUsage: number;
  canGenerateToday: boolean;
};

export default function DashboardClient({
  brandCount,
  topicCount,
  emailSettings,
  latestBriefing,
  exaUsage,
  exaCap,
  openaiUsage,
  openaiCap,
  smtpUsage,
  canGenerateToday,
}: Props) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [dailyLimitHit, setDailyLimitHit] = useState(!canGenerateToday);

  const isReady = brandCount > 0 && topicCount > 0;
  const canClick = isReady && !generating && !dailyLimitHit;

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);

    try {
      const res = await fetch("/api/briefings/generate-test", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        if (data.dailyLimitReached) {
          setDailyLimitHit(true);
        }
        setGenError(data.error ?? "Generation failed.");
      } else {
        router.push(`/briefings/${data.briefingId}`);
      }
    } catch {
      setGenError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[#111]">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Your wine-market intelligence hub</p>
      </div>

      {/* Setup status */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SetupCard
          label="Brands"
          value={`${brandCount} / ${MAX_BRANDS}`}
          ok={brandCount > 0}
          href="/brands"
          hint={brandCount === 0 ? "Add a brand to get started" : undefined}
        />
        <SetupCard
          label="Topics"
          value={`${topicCount} / ${MAX_TOPICS}`}
          ok={topicCount > 0}
          href="/topics"
          hint={topicCount === 0 ? "Add topics to cover" : undefined}
        />
        <SetupCard
          label="Recipient email"
          value={emailSettings?.recipient_email ?? "Not set"}
          ok={!!emailSettings?.recipient_email}
          href="/settings"
          hint={!emailSettings?.recipient_email ? "Set in Settings" : undefined}
        />
      </div>

      {/* Generate briefing */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#111]">Generate test briefing</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Searches recent wine news and summarises with AI. Limited to 1 per day.
            </p>
          </div>
          {dailyLimitHit ? (
            <StatusBadge color="amber" label="Used today" />
          ) : (
            <StatusBadge color="green" label="Available" />
          )}
        </div>

        {!isReady && (
          <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            Add at least one brand and one topic before generating.
          </div>
        )}

        {dailyLimitHit && (
          <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            Already used today. Try again tomorrow.
          </div>
        )}

        {genError && !dailyLimitHit && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {genError}
          </div>
        )}

        <button onClick={handleGenerate} disabled={!canClick} className="btn-primary">
          {generating ? (
            <>
              <Spinner />
              Generating… (~30s)
            </>
          ) : (
            "Generate briefing"
          )}
        </button>
      </div>

      {/* Latest briefing */}
      {latestBriefing && (
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Latest briefing</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#111]">{latestBriefing.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(latestBriefing.created_at).toLocaleString()}
                {latestBriefing.email_sent_at && " · Emailed"}
              </p>
            </div>
            <Link href={`/briefings/${latestBriefing.id}`} className="btn-secondary text-xs whitespace-nowrap">
              View
            </Link>
          </div>
        </div>
      )}

      {/* API usage panel */}
      <div className="card space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">API usage this month</p>

        <UsageMeter label="Exa news searches" used={exaUsage} cap={exaCap} color="bg-wine-700" />
        <UsageMeter label="OpenAI summaries" used={openaiUsage} cap={openaiCap} color="bg-blue-500" />

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Emails sent</span>
          <span className="text-sm font-medium text-[#111]">{smtpUsage}</span>
        </div>
      </div>
    </div>
  );
}

function SetupCard({
  label, value, ok, href, hint,
}: {
  label: string; value: string; ok: boolean; href: string; hint?: string;
}) {
  return (
    <Link href={href} className="card block hover:border-wine-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-green-400" : "bg-amber-400"}`} />
      </div>
      <p className="text-base font-semibold text-[#111] truncate">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </Link>
  );
}

function UsageMeter({ label, used, cap, color }: { label: string; used: number; cap: number; color: string }) {
  const pct = Math.min(100, cap > 0 ? (used / cap) * 100 : 0);
  const danger = pct >= 90;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`text-xs font-medium ${danger ? "text-red-600" : "text-gray-500"}`}>
          {used} / {cap}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all ${danger ? "bg-red-500" : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ color, label }: { color: "green" | "amber"; label: string }) {
  const styles = {
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const dotStyles = { green: "bg-green-400", amber: "bg-amber-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${styles[color]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[color]}`} />
      {label}
    </span>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
