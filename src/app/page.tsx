import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111] font-sans">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <ExampleOutput />
        <ValueProps />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

// ─── Navigation ────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-[#111]">
          <span className="text-wine-700 text-lg leading-none">◆</span>
          WineRadar
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:block rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-[#111] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-wine-700 px-4 py-2 text-sm font-medium text-white hover:bg-wine-800 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 md:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="flex flex-col md:flex-row md:items-center gap-12 md:gap-16">
        {/* Text */}
        <div className="flex-1 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-wine-200 bg-wine-50 px-3 py-1 text-xs font-medium text-wine-700 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-wine-500" />
            Weekly wine-market intelligence
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#111] leading-[1.1] mb-5">
            Stay ahead of your wine brands —{" "}
            <span className="text-wine-700">every week</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed mb-8">
            WineRadar gives you a weekly TL;DR of the most important developments
            around your wine producers — so you&apos;re always prepared for client
            conversations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-wine-700 px-6 py-3 text-sm font-semibold text-white hover:bg-wine-800 transition-colors"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-semibold text-[#374151] hover:bg-gray-50 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Product mockup */}
        <div className="flex-1 md:max-w-md w-full">
          <BriefingMockup />
        </div>
      </div>
    </section>
  );
}

function BriefingMockup() {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Mockup browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-[#E5E7EB] bg-gray-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
        <span className="ml-3 text-xs text-gray-400">WineRadar — Weekly Briefing</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Briefing header */}
        <div className="rounded-lg border-l-4 border-wine-700 bg-wine-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-wine-600 mb-1">Overview</p>
          <p className="text-sm text-[#374151] leading-relaxed">
            A strong week for Italian estates — new vintages, high Parker scores, and a
            growing US market presence.
          </p>
        </div>

        {/* Brand item */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-wine-700 border-b border-[#E5E7EB] pb-2.5">
            Antinori
          </h3>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Key developments
            </p>
            <ul className="space-y-2">
              {[
                "New Tignanello 2022 vintage officially released this week",
                "98-point Parker score driving strong US retailer demand",
                "Launched new sustainability initiative across all estates",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#374151]">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-wine-600 flex-shrink-0" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
              Why it matters
            </p>
            <p className="text-xs text-[#374151] leading-relaxed">
              High scores + new release = key moment to engage accounts before competitor
              reps do.
            </p>
          </div>
        </div>

        {/* Second brand (blurred/preview) */}
        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-3 opacity-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-20 rounded-full bg-wine-200" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-gray-100" />
            <div className="h-2 w-4/5 rounded-full bg-gray-100" />
            <div className="h-2 w-3/5 rounded-full bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── How it works ──────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      title: "Add your wine brands",
      desc: "Enter the producers and estates you manage. Up to 5 brands per account.",
    },
    {
      number: "02",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      title: "Choose what to track",
      desc: "Select topics like new releases, awards, sustainability, or market news.",
    },
    {
      number: "03",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: "Receive your weekly TL;DR",
      desc: "Every Monday, a concise briefing lands in your inbox — ready to act on.",
    },
  ];

  return (
    <section className="border-y border-[#E5E7EB] bg-white py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-wine-700 mb-3">How it works</p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#111]">
            Up and running in minutes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step) => (
            <FeatureCard key={step.number} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  number, icon, title, desc,
}: {
  number: string; icon: React.ReactNode; title: string; desc: string;
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-wine-50 text-wine-700">
          {icon}
        </div>
        <span className="text-xs font-bold text-gray-300 tracking-widest">{number}</span>
      </div>
      <h3 className="font-semibold text-[#111] mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Example output ────────────────────────────────────────────────────────

function ExampleOutput() {
  return (
    <section className="mx-auto max-w-6xl px-4 md:px-6 py-20 md:py-24">
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-wine-700 mb-3">Example output</p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#111] mb-3">
          What you receive each week
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Each briefing is concise, commercially useful, and specific to your brands.
          Readable in under two minutes.
        </p>
      </div>

      <ExampleCard />
    </section>
  );
}

function ExampleCard() {
  const developments = [
    "New Tignanello 2022 vintage officially announced and available to order",
    "Wine Spectator awarded 97 points — highest score in five years",
    "Sustainability certification achieved across all Tuscan estates",
  ];

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-[#E5E7EB] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-wine-700">◆</span>
          <span className="text-sm font-semibold text-[#111]">WineRadar</span>
        </div>
        <span className="rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-medium text-green-700">
          Week of 28 Apr 2025
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Overview */}
        <div className="rounded-lg border-l-4 border-wine-700 bg-wine-50 px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-wine-600 mb-1.5">This week</p>
          <p className="text-sm text-[#374151] leading-relaxed">
            Strong week for Antinori — new vintage launch combined with top press scores
            creates an immediate conversation opportunity with key accounts.
          </p>
        </div>

        {/* Brand section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-wine-700 border-b border-[#E5E7EB] pb-2.5">
            Antinori
          </h3>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5">
              Key developments
            </p>
            <ul className="space-y-2.5">
              {developments.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-[#374151]">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-wine-600 flex-shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md bg-amber-50 border border-amber-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1.5">Why it matters</p>
            <p className="text-sm text-[#374151] leading-relaxed">
              A new high-scoring vintage is a rare window to re-engage accounts and
              expand allocations before competitor reps act on the same news.
            </p>
          </div>

          <div className="rounded-md bg-blue-50 border border-blue-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1.5">
              Account manager implication
            </p>
            <p className="text-sm text-[#374151] leading-relaxed">
              Lead with the 97-point score in your next call. Propose a tasting
              allocation and tie the sustainability cert to buyers with ESG mandates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Value propositions ────────────────────────────────────────────────────

function ValueProps() {
  const values = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Save time",
      desc: "Stop searching across Wine Spectator, Decanter, and trade press. Everything relevant to your brands, curated automatically.",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      title: "Stay informed",
      desc: "New releases, press scores, sustainability initiatives, distribution news — all filtered for relevance to your portfolio.",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      title: "Be better prepared",
      desc: "Walk into every client meeting with a sharp, current view of your brands. No more scrambling the night before.",
    },
  ];

  return (
    <section className="border-y border-[#E5E7EB] bg-white py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-wine-700 mb-3">Why WineRadar</p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#111]">
            Built for account managers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {values.map((v) => (
            <div key={v.title} className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-wine-50 text-wine-700 mb-4">
                {v.icon}
              </div>
              <h3 className="font-semibold text-[#111] mb-2">{v.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ─────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 md:px-6 py-20 md:py-28">
      <div className="rounded-2xl bg-wine-700 px-8 md:px-16 py-12 md:py-16 text-center">
        <p className="text-wine-300 text-sm font-medium mb-3">Get started today</p>
        <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-4">
          Your weekly wine intelligence
          <br className="hidden md:block" /> brief, ready Monday morning
        </h2>
        <p className="text-wine-200 text-base max-w-md mx-auto mb-8 leading-relaxed">
          Join account managers who use WineRadar to stay sharp, save hours, and close
          more conversations with confidence.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-white px-8 py-3.5 text-sm font-semibold text-wine-700 hover:bg-wine-50 transition-colors"
        >
          Create your free account
        </Link>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 md:px-6 py-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#111]">
          <span className="text-wine-700">◆</span>
          WineRadar
        </div>
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} WineRadar</p>
      </div>
    </footer>
  );
}
