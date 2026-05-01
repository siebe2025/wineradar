import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";

export default async function BriefingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: briefings } = await supabase
    .from("briefings")
    .select("id, title, summary, email_sent_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5 md:space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#111]">Briefings</h1>
          <p className="mt-0.5 text-sm text-gray-500">Your generated wine-market briefings</p>
        </div>

        {!briefings?.length ? (
          <div className="card text-center py-12">
            <p className="text-gray-400 text-sm mb-4">No briefings yet.</p>
            <Link href="/dashboard" className="btn-primary">
              Generate your first briefing
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {briefings.map((b) => (
              <Link
                key={b.id}
                href={`/briefings/${b.id}`}
                className="card flex items-start justify-between gap-4 hover:border-wine-300 transition-colors active:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#111] leading-snug">{b.title}</p>
                  {b.summary && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{b.summary}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-2 flex-wrap">
                    {new Date(b.created_at).toLocaleString()}
                    {b.email_sent_at && (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        Emailed
                      </span>
                    )}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
