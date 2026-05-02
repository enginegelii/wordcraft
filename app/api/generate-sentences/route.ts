import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type GrammarLevel = "intermediate" | "upper-intermediate" | "advanced" | "advanced-plus";
export type GameType = "fill" | "sentence-build" | "story" | "quick-review";

export interface GeneratedSentence {
  en: string;           // İngilizce cümle
  tr: string;           // Türkçe çeviri
  blank?: string;       // fill oyunu için boş bırakılacak kelime
  blankedEn?: string;   // ___ ile boşluk olan versiyon
  grammarNote?: string; // Kullanılan gramer yapısı (opsiyonel)
}

// Her seviye için CEFR gramer yapıları
const LEVEL_GRAMMAR_PATTERNS: Record<GrammarLevel, string> = {
  "intermediate": `
Use ONLY these B1 grammar structures:
- Simple Past: "She visited Paris last summer."
- Present Perfect: "I have already finished my homework."
- There was/were: "There were many people at the party."
- First Conditional: "If it rains, I will stay home."
- Past Simple vs Present Perfect contrast
- Basic modal verbs: must, should, can, may
- Comparative & superlative: bigger, the most interesting
Keep sentences simple, everyday topics (school, work, travel, food, family).`,

  "upper-intermediate": `
Use ONLY these B1-B2 grammar structures:
- Past Continuous: "She was reading when I called."
- Present Perfect Continuous: "I have been working for 3 hours."
- Passive Voice (present/past): "The book was written in 1984."
- Second Conditional: "If I had more time, I would travel."
- Reported Speech: "She said she was tired."
- Relative Clauses (basic): "The man who called yesterday is my boss."
Topics can be slightly more complex: environment, technology, work-life.`,

  "advanced": `
Use ONLY these B2-C1 grammar structures:
- Past Perfect: "By the time she arrived, everyone had left."
- Third Conditional: "If she had studied harder, she would have passed."
- Mixed Conditionals: "If I had taken that job, I would be rich now."
- Gerunds vs Infinitives: "She regrets not applying for the scholarship."
- Complex Relative Clauses: "The research, which was published last year, is groundbreaking."
- Inversion for emphasis: "Not only did he fail the exam, but he also..."
Topics: academic subjects, complex social issues, abstract ideas.`,

  "advanced-plus": `
Use ONLY these C1+ grammar structures:
- Wish/If only: "I wish I had taken that opportunity." / "If only she knew the truth."
- Noun Clauses: "What surprised me most was how quickly it happened."
- Causative: "She had her car repaired / got her nails done."
- Complex Phrasal Verbs in context: "The merger fell through despite months of negotiation."
- Cleft Sentences: "It was the manager who made the final decision."
- Subjunctive: "The committee recommended that he be dismissed."
Topics: professional, academic, nuanced social commentary, literature.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      level,
      gameType,
      words = [],      // kullanıcının kelime havuzu (string[])
      count = 8,
    }: {
      level: GrammarLevel;
      gameType: GameType;
      words: string[];
      count: number;
    } = body;

    if (!level || !gameType) {
      return NextResponse.json({ error: "level and gameType are required" }, { status: 400 });
    }

    const grammarPatterns = LEVEL_GRAMMAR_PATTERNS[level];

    // Kelimelerden rastgele max 10 tane seç
    const wordSample = words
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(words.length, 10));

    const hasWords = wordSample.length > 0;

    let systemPrompt = "";
    let userPrompt = "";

    if (gameType === "fill") {
      systemPrompt = `You are an English language teacher creating fill-in-the-blank exercises.
${grammarPatterns}

Rules:
- Create exactly ${count} sentences
- ${hasWords ? "Each sentence MUST use one of the provided vocabulary words as the blank (___)" : "Create sentences using common vocabulary, leave a meaningful word as blank (___)"}
- The blank word must fit naturally into the grammar structure
- Each sentence must demonstrate the grammar level's target structure
- Provide Turkish translation for each sentence
- Return ONLY valid JSON, no extra text`;

      userPrompt = hasWords
        ? `Create ${count} fill-in-the-blank sentences using these vocabulary words: ${wordSample.join(", ")}

Return JSON array:
[
  {
    "en": "full sentence without blank",
    "tr": "Turkish translation",
    "blank": "the vocabulary word used",
    "blankedEn": "sentence with ___ replacing the word",
    "grammarNote": "grammar structure used (e.g. 'Past Perfect')"
  }
]`
        : `Create ${count} fill-in-the-blank sentences.

Return JSON array:
[
  {
    "en": "full sentence without blank",
    "tr": "Turkish translation",
    "blank": "the word replaced by blank",
    "blankedEn": "sentence with ___ replacing the word",
    "grammarNote": "grammar structure used"
  }
]`;
    } else if (gameType === "sentence-build") {
      systemPrompt = `You are an English language teacher creating sentence-building exercises.
${grammarPatterns}

Rules:
- Create exactly ${count} sentences
- ${hasWords ? "Try to include some of the provided vocabulary words" : "Use appropriate vocabulary"}
- Sentences must demonstrate the level's target grammar structures
- Return ONLY valid JSON`;

      userPrompt = `Create ${count} sentences for a sentence-scramble exercise.
${hasWords ? `Try to include these words where natural: ${wordSample.join(", ")}` : ""}

Return JSON array:
[
  {
    "en": "The complete correct English sentence",
    "tr": "Turkish translation",
    "grammarNote": "grammar structure used"
  }
]`;
    } else if (gameType === "story") {
      systemPrompt = `You are an English language teacher writing a short story for language learners.
${grammarPatterns}

Rules:
- Write an engaging mini-story (150-200 words) using the target grammar structures
- ${hasWords ? "Naturally incorporate as many of the provided vocabulary words as possible (bold them with **word**)" : "Use varied but appropriate vocabulary"}
- Include dialogue
- Make it interesting and memorable
- Return ONLY valid JSON`;

      userPrompt = `Write a short story for ${level} level learners.
${hasWords ? `Include these vocabulary words naturally (mark them **bold**): ${wordSample.join(", ")}` : ""}

Return JSON:
{
  "title": "Story title",
  "en": "Full story text with **vocabulary** words bolded",
  "tr": "Turkish translation of the full story",
  "grammarNote": "Main grammar structures used"
}`;
    } else {
      // quick-review
      systemPrompt = `You are an English language teacher creating quick review questions.
${grammarPatterns}
Return ONLY valid JSON.`;

      userPrompt = `Create ${count} quick multiple-choice grammar questions for ${level} level.
${hasWords ? `Use these vocabulary words as context: ${wordSample.join(", ")}` : ""}

Return JSON array:
[
  {
    "en": "Complete the sentence: She ___ for three hours before the exam.",
    "tr": "Sınav öncesi üç saattir çalışıyordu.",
    "blank": "had been studying",
    "options": ["had been studying", "was studying", "has studied", "studied"],
    "grammarNote": "Past Perfect Continuous"
  }
]`;
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";

    // JSON parse et
    const jsonMatch = raw.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON in response");
    }
    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ sentences: Array.isArray(parsed) ? parsed : [parsed], level });
  } catch (err) {
    console.error("generate-sentences error:", err);
    return NextResponse.json({ error: "Failed to generate sentences" }, { status: 500 });
  }
}
