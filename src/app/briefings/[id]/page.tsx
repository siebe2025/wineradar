import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import type { BriefingContent, Source } from "@/lib/types";

export default async function BriefingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: briefing } = await supabase
    .from("briefings")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!briefing) notFound();

  const { data: items } = await supabase
    .from("briefing_items")
    .select("*")
    .eq("briefing_id", briefing.id)
    .order("created_at");

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5 md:space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/briefings"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#111] mb-4 transition-colors min-h-[44px] -ml-1 px-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Briefings
          </Link>
          <h1 className="text-xl font-semibold text-[#111] leading-snug">{briefing.title}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {new Date(briefing.created_at).toLocaleString()}
            {briefing.email_sent_at && (
              <span className="ml-2 text-green-600">
                · Emailed {new Date(briefing.email_sent_at).toLocaleString()}
              </span>
            )}
          </p>
        </div>

        {/* Summary banner */}
        {briefing.summary && (
          <div className="rounded-lg border-l-4 border-wine-700 bg-wine-50 px-4 md:px-5 py-4">
            <p className="text-sm text-[#374151] leading-relaxed">{briefing.summary}</p>
          </div>
        )}

        {/* Brand items */}
        {items?.length ? (
          <div className="space-y-4 md:space-y-5">
            {items.map((item) => {
              let content: BriefingContent | null = null;
              try {
                content = JSON.parse(item.content) as BriefingContent;
              } catch {
                content = null;
              }
              const sources: Source[] = Array.isArray(item.sources) ? item.sources : [];

              return (
                <div key={item.id} className="card space-y-4">
                  <h2 className="text-base font-semibold text-wine-700 border-b border-[#E5E7EB] pb-3">
                    {item.brand_name}
                  </h2>

                  {content ? (
                    <>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Overview</p>
                        <p className="text-sm text-[#374151] leading-relaxed">{content.summary}</p>
                      </div>

                      {content.key_developments?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5">Key developments</p>
                          <ul className="space-y-2.5">
                            {content.key_developments.map((d, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-[#374151]">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-wine-600 flex-shrink-0" />
                                <span className="leading-relaxed">{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {content.why_it_matters && (
                        <div className="rounded-md bg-amber-50 border border-amber-100 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1.5">Why it matters</p>
                          <p className="text-sm text-[#374151] leading-relaxed">{content.why_it_matters}</p>
                        </div>
                      )}

                      {content.commercial_implication && (
                        <div className="rounded-md bg-blue-50 border border-blue-100 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1.5">Account manager implication</p>
                          <p className="text-sm text-[#374151] leading-relaxed">{content.commercial_implication}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-[#374151] leading-relaxed">{item.content}</p>
                  )}

                  {sources.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Sources</p>
                      <div className="space-y-1.5">
                        {sources.map((s, i) => (
                          <a
                            key={i}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-1.5 text-xs text-wine-700 hover:underline min-h-[44px] items-center"
                          >
                            <span className="truncate">{s.title || s.url}</span>
                            {s.published_date && (
                              <span className="text-gray-400 flex-shrink-0">({s.published_date.slice(0, 10)})</span>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-gray-400 text-sm">No items in this briefing.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
