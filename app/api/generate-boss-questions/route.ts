import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { level, words } = await req.json();

    const levelDesc: Record<string, string> = {
      "intermediate": "B1 - uses common tenses, basic conditionals, simple sentence structures",
      "upper-intermediate": "B2 - uses passive voice, reported speech, 2nd conditionals, phrasal verbs",
      "advanced": "C1 - uses advanced grammar: 3rd conditionals, inversion, complex passive, formal register",
      "advanced-plus": "C2 - uses mixed conditionals, subjunctive mood, nuanced collocations, idiomatic expressions",
    };

    const desc = levelDesc[level as string] ?? levelDesc["intermediate"];

    const prompt = `You are an English language teacher creating quiz questions for a ${level} level student.
Student level: ${desc}
Student's vocabulary (use some of these words in sentences): ${words}

Create exactly 10 fill-in-the-blank English grammar questions. The blank is shown as ___.
Difficulty breakdown:
- Questions 1-5: medium difficulty (present/past tenses, prepositions, articles, comparatives)
- Questions 6-8: hard difficulty (conditionals, passive voice, modal verbs, reported speech)
- Questions 9-10: expert difficulty (mixed conditionals, inversion, subjunctive, advanced collocations)

Rules:
- Each question has exactly ONE blank (____)
- Provide exactly 4 answer options (A, B, C, D) — only one is correct
- Wrong options must be grammatically plausible but clearly incorrect in context
- "grammarNote" must be written in Turkish (e.g., "Present Perfect", "2. Koşul Cümlesi", "Passive Voice", "Inversiyonlu Cümle")
- Keep sentences concise (max 15 words)
- Make sure sentences are natural English

Return ONLY valid JSON with no markdown, no explanation, exactly this structure:
{"questions":[{"type":"fill","prompt":"sentence with ____ here","answer":"correct word","options":["A","B","C","D"],"grammarNote":"Turkish grammar note"}]}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (message.content[0] as { type: string; text: string }).text;

    // Extract JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("No JSON found in response");
      parsed = JSON.parse(text.slice(start, end + 1));
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response structure");
    }

    // Validate and clean
    const questions = parsed.questions
      .slice(0, 10)
      .map((q: { prompt?: unknown; answer?: unknown; options?: unknown; grammarNote?: unknown }) => ({
        type: "fill" as const,
        prompt: String(q.prompt ?? ""),
        answer: String(q.answer ?? ""),
        options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : [],
        grammarNote: q.grammarNote ? String(q.grammarNote) : undefined,
      }))
      .filter(
        (q: { prompt: string; answer: string; options: string[] }) =>
          q.prompt && q.answer && q.options.length === 4 && q.options.includes(q.answer)
      );

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[generate-boss-questions] Error:", err);
    return NextResponse.json({ questions: [] }, { status: 200 });
  }
}
