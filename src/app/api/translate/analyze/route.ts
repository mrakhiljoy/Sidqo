import { NextRequest, NextResponse } from "next/server";

const WORDS_PER_PAGE_FALLBACK = 250;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PDF_MIME = "application/pdf";
// Try models in order of preference — 2.5 Flash (best, free 5 RPM),
// then 1.5 Flash (widely available), then 2.0 Flash (may have 0 RPM).
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
];

/**
 * Gemini vision OCR — counts words and pages in PDFs and images.
 * Tries multiple model names with fallback.
 * Returns null if GEMINI_API_KEY is missing or all models fail.
 */
// Collect errors from the last OCR attempt for debugging
let lastOcrErrors: string[] = [];

async function geminiOcr(
  base64: string,
  mimeType: string
): Promise<{ wordCount: number; pageCount: number } | null> {
  const key = process.env.GEMINI_API_KEY;
  lastOcrErrors = [];
  if (!key) {
    lastOcrErrors.push("GEMINI_API_KEY not set");
    console.error("GEMINI_API_KEY not set — cannot OCR");
    return null;
  }

  const payload = JSON.stringify({
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          {
            text: `Count the total number of words in this document (include all visible text: headings, body, labels, captions, handwritten text, stamps, everything readable). Also count the total number of pages. Respond with EXACTLY two lines:\nWORDS: <integer>\nPAGES: <integer>`,
          },
        ],
      },
    ],
    generationConfig: { maxOutputTokens: 1024, temperature: 0 },
  });

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        }
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        const msg = `${model}: HTTP ${res.status} — ${errText.slice(0, 200)}`;
        lastOcrErrors.push(msg);
        console.error(`Gemini model ${model} failed: ${res.status} ${errText.slice(0, 200)}`);
        continue; // try next model
      }

      const data = await res.json();
      const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!output) {
        lastOcrErrors.push(`${model}: empty output — ${JSON.stringify(data).slice(0, 200)}`);
        console.error(`Gemini model ${model} returned empty output`);
        continue;
      }

      const wordMatch = output.match(/WORDS:\s*(\d+)/i);
      const pageMatch = output.match(/PAGES:\s*(\d+)/i);

      console.log(`Gemini OCR success (model: ${model}): ${output}`);
      return {
        wordCount: wordMatch ? parseInt(wordMatch[1], 10) : 0,
        pageCount: pageMatch ? parseInt(pageMatch[1], 10) : 1,
      };
    } catch (err) {
      lastOcrErrors.push(`${model}: exception — ${String(err).slice(0, 200)}`);
      console.error(`Gemini model ${model} error:`, err);
      continue;
    }
  }

  console.error("All Gemini models failed for OCR");
  return null;
}

// Public endpoint — no auth required
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.type !== PDF_MIME && !IMAGE_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or image file." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    // Gemini vision handles both PDFs and images natively
    const result = await geminiOcr(base64, file.type);

    if (result && result.wordCount > 0) {
      return NextResponse.json({
        pageCount: result.pageCount,
        wordCount: result.wordCount,
        estimated: false,
      });
    }

    // Fallback: Gemini unavailable or returned 0
    const pageCount = result?.pageCount || 1;
    const hasKey = !!process.env.GEMINI_API_KEY;
    console.error(`OCR fallback used — hasKey: ${hasKey}, result:`, result);
    return NextResponse.json({
      pageCount,
      wordCount: pageCount * WORDS_PER_PAGE_FALLBACK,
      estimated: true,
      debug: { hasKey, resultWas: result ? "empty" : "null", errors: lastOcrErrors },
    });
  } catch (error) {
    console.error("File analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze file" },
      { status: 500 }
    );
  }
}
