import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { word, translation, partOfSpeech, directive, grammarTopic, userSentence, grammarLevel } = await req.json();

    if (!word || !userSentence) {
      return NextResponse.json({ error: "word and userSentence required" }, { status: 400 });
    }

    const grammarContext = grammarTopic
      ? `The exercise focuses specifically on: "${grammarTopic}".`
      : "No specific grammar topic is required.";

    const levelContext = grammarLevel
      ? `The student's grammar level is: ${grammarLevel}.`
      : "";

    const prompt = `You are an encouraging English teacher evaluating a Turkish student's sentence.

Target word: "${word}" (Turkish: "${translation}", ${partOfSpeech || "word"})
Exercise directive: "${directive}"
${grammarContext}
${levelContext}

Student's sentence: "${userSentence}"

Evaluate the sentence carefully. Consider:
1. Is the target word "${word}" used correctly and naturally?
2. Is the grammar correct? ${grammarTopic ? `Pay special attention to: ${grammarTopic}` : ""}
3. Does the sentence make logical sense?
4. Is the vocabulary appropriate?

Respond ONLY with valid JSON (absolutely no markdown, no extra text outside the JSON):
{
  "score": <integer 0-100>,
  "isCorrect": <boolean, true if score >= 65>,
  "feedback": "<2-4 sentences in TURKISH explaining what is correct and what needs improvement. Be specific and encouraging.>",
  "corrected": "<the corrected version of the student sentence, or the original if perfect>",
  "alternatives": ["<a slightly different correct alternative sentence using the same word>", "<another alternative>"]
}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (response.content[0] as { type: string; text: string }).text.trim();

    // Strip markdown code blocks if present
    const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (e) {
    console.error("[evaluate-sentence] error:", e);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
