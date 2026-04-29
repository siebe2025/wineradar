import type { Brand, Topic, ExaResult } from "@/lib/types";

const EXA_API_URL = "https://api.exa.ai/search";

/** Returns ISO date string N days before now. */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Keep only results whose publishedDate is within maxAgeDays. Drops results with no date. */
function filterByAge(results: ExaResult[], maxAgeDays: number): ExaResult[] {
  const cutoff = daysAgo(maxAgeDays);
  return results.filter(
    (r) => r.publishedDate != null && new Date(r.publishedDate) >= cutoff
  );
}

export async function searchExaForBrand(
  brand: Brand,
  topics: Topic[]
): Promise<ExaResult[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error("EXA_API_KEY not set");

  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long" });
  const year = now.getFullYear();
  const topicNames = topics.map((t) => t.name).join(" OR ");

  // Time-focused query: brand + topics + recency signals
  const query = `"${brand.name}" wine ${topicNames} last week ${monthName} ${year}`;

  const body = {
    query,
    type: "auto",
    category: "news",
    numResults: 5,
    maxAgeHours: 168, // 7 days — server-side freshness gate
    contents: {
      highlights: {
        maxCharacters: 1200,
      },
    },
  };

  const res = await fetch(EXA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Exa API error ${res.status}: ${text}`);
  }

  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: ExaResult[] = (data.results ?? []).map((r: any): ExaResult => ({
    title: r.title ?? "Untitled",
    url: r.url ?? "",
    publishedDate: r.publishedDate ?? undefined,
    highlights: r.highlights ?? undefined,
  }));

  // Post-filter: strict 7-day window
  const sevenDay = filterByAge(raw, 7);
  if (sevenDay.length > 0) return sevenDay;

  // Fallback: 14-day window (Exa may occasionally return items near the boundary)
  const fourteenDay = filterByAge(raw, 14);
  if (fourteenDay.length > 0) return fourteenDay;

  // No datable-fresh results — return empty so OpenAI uses the no-news path
  return [];
}
