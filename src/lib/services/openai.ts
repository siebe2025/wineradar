import OpenAI from "openai";
import type { Brand, Topic, ExaResult, BriefingContent } from "@/lib/types";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function formatSources(results: ExaResult[]): string {
  if (!results.length) return "No recent news sources available.";
  return results
    .map((r, i) => {
      const date = r.publishedDate ? ` (${r.publishedDate.slice(0, 10)})` : "";
      const highlights = r.highlights?.join(" ") ?? "";
      return `[${i + 1}] ${r.title}${date}\nURL: ${r.url}\n${highlights}`;
    })
    .join("\n\n");
}

/** Returns a safe fallback when OpenAI cannot be called. */
export function buildFallbackContent(brand: Brand): BriefingContent {
  return {
    summary: `No AI summary available for ${brand.name} — the OpenAI monthly request limit has been reached. Please try again next month.`,
    key_developments: ["OpenAI monthly cap reached — summary unavailable."],
    why_it_matters: "",
    commercial_implication: "",
  };
}

/**
 * Calls OpenAI chat completions to summarise a brand briefing.
 * Uses OPENAI_MODEL (default gpt-4.1-mini) and OPENAI_MAX_OUTPUT_TOKENS (default 700).
 * Only uses normal text/chat generation — no tools, assistants, or file search.
 */
export async function summarizeBrandWithOpenAI(
  brand: Brand,
  topics: Topic[],
  exaResults: ExaResult[] | null
): Promise<BriefingContent> {
  const client = getClient();
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const maxTokens = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS ?? 700);

  const topicNames = topics.map((t) => t.name).join(", ");
  const sourcesText = formatSources(exaResults ?? []);

  const cutoffDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  })();

  const systemPrompt = `You are a senior wine industry analyst creating concise briefings for account managers.
Write in a professional, commercially useful tone. Be direct. Focus on what matters for sales and account management.
IMPORTANT: Only summarise concrete developments that occurred in the past 7 days (on or after ${cutoffDate}).
Ignore background information, historical context, and any article or event older than 7 days.
If the sources contain no meaningful news from the past 7 days, say so clearly — do not fabricate recent events.
Respond ONLY with valid JSON matching the requested schema.`;

  const userPrompt = `Brand: ${brand.name}
Region: ${brand.region ?? "Unknown"}
Country: ${brand.country ?? "Unknown"}
Topics to cover: ${topicNames}
${brand.notes ? `Brand notes: ${brand.notes}` : ""}

News sources (past 7 days only — ignore anything older):
${sourcesText}

Create a briefing JSON with these fields:
- "summary": 2–3 sentence overview of THIS WEEK's news only (max 60 words). If there is no meaningful news from the past 7 days, set this to "No significant developments in the past week for ${brand.name}."
- "key_developments": array of 3–5 short bullet strings describing SPECIFIC RECENT EVENTS (each max 25 words). Use an empty array [] if there are no concrete developments this week.
- "why_it_matters": 1–2 sentences on the market significance of this week's news (max 40 words). Omit if there is no news.
- "commercial_implication": 1–2 sentences on what this week's news means for the account manager (max 40 words). Omit if there is no news.

Total content should be readable in about 1 minute. Stay under 220 words total across all fields.`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: maxTokens,
    temperature: 0.4,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(raw) as Partial<BriefingContent>;
    return {
      summary: parsed.summary ?? "No summary generated.",
      key_developments: Array.isArray(parsed.key_developments)
        ? parsed.key_developments
        : [],
      why_it_matters: parsed.why_it_matters ?? "",
      commercial_implication: parsed.commercial_implication ?? "",
    };
  } catch {
    throw new Error(`OpenAI returned invalid JSON: ${raw.slice(0, 200)}`);
  }
}
