import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sen bir İngilizce-Türkçe dil eğitmenisin. Kullanıcının verdiği İngilizce kelime veya ifade için kapsamlı bir flashcard oluşturuyorsun.

SADECE geçerli JSON döndür, başka hiçbir şey yazma. JSON şeması:
{
  "word": "kelime (lowercase)",
  "translation": "Türkçe karşılık(lar)",
  "partOfSpeech": "noun|verb|adjective|adverb|pronoun|preposition|conjunction|interjection|phrasal verb|idiom|other",
  "ipa": "/IPA transkripsiyon/",
  "examples": [
    {"en": "İngilizce örnek cümle 1 — farklı bağlam/zorluk", "tr": "Türkçe çeviri 1"},
    {"en": "İngilizce örnek cümle 2 — farklı bağlam/zorluk", "tr": "Türkçe çeviri 2"},
    {"en": "İngilizce örnek cümle 3 — farklı bağlam/zorluk", "tr": "Türkçe çeviri 3"},
    {"en": "İngilizce örnek cümle 4 — farklı bağlam/zorluk", "tr": "Türkçe çeviri 4"},
    {"en": "İngilizce örnek cümle 5 — farklı bağlam/zorluk", "tr": "Türkçe çeviri 5"}
  ],
  "synonyms": ["eş anlamlı1", "eş anlamlı2"],
  "antonyms": ["zıt anlamlı1"],
  "contextTag": "günlük|iş|akademik|argo|teknik|edebi|informal|genel",
  "grammarNote": "Önemli gramer notu (varsa, yoksa null)"
}

ÖNEMLI: "examples" dizisinde tam olarak 5 adet örnek cümle olsun. Her cümle farklı bir bağlamda, farklı zorluk seviyesinde olsun (basit günlük → karmaşık/akademik). Kelime her cümlede geçmeli.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { word, context, imageBase64, mimeType } = body;

    if (!word && !imageBase64) {
      return NextResponse.json({ error: "Kelime veya görsel gerekli" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY ayarlanmamış. .env.local dosyanıza ekleyin." },
        { status: 500 }
      );
    }

    // Görsel ile OCR + kelime çıkarımı
    if (imageBase64 && mimeType) {
      const ocrResponse = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: "Bu görseldeki tüm metni çıkar ve sadece metni döndür. Başka hiçbir şey yazma.",
              },
            ],
          },
        ],
      });

      const extractedText = ocrResponse.content[0].type === "text"
        ? ocrResponse.content[0].text
        : "";

      return NextResponse.json({ extractedText });
    }

    // Kelime kartı üretimi
    const userMessage = context
      ? `Kelime: "${word}"\nBağlam (kelimenin geçtiği cümle/metin): "${context}"\n\nBu bağlamı göz önünde bulundurarak JSON kartı oluştur.`
      : `Kelime: "${word}"\n\nJSON kartı oluştur.`;

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1800,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: userMessage },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // JSON'u parse et
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Geçerli JSON bulunamadı");
    }

    const cardData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(cardData);
  } catch (error) {
    console.error("generate-card error:", error);
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
