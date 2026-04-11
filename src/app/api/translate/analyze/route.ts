import { NextRequest, NextResponse } from "next/server";

// Vercel Hobby plan has 10s max. Keep Gemini calls fast (no retries).
export const maxDuration = 10;

const WORDS_PER_PAGE_FALLBACK = 250;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PDF_MIME = "application/pdf";

// gemini-2.5-flash (5 RPM free), gemini-2.0-flash (fallback)
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

// Collect errors for debugging
let lastOcrErrors: string[] = [];

/* ────────────────────────────────────────────────────────
 * Gemini vision OCR — counts words and pages in PDFs and images.
 * No retries — must fit within 10s Vercel Hobby timeout.
 * ──────────────────────────────────────────────────────── */
async function geminiOcr(
  base64: string,
  mimeType: string
): Promise<{ wordCount: number; pageCount: number } | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    lastOcrErrors.push("GEMINI_API_KEY not set");
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
        lastOcrErrors.push(
          `${model}: HTTP ${res.status} — ${errText.slice(0, 200)}`
        );
        continue; // try next model
      }

      const data = await res.json();
      const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!output) {
        lastOcrErrors.push(
          `${model}: empty output — ${JSON.stringify(data).slice(0, 200)}`
        );
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
      lastOcrErrors.push(
        `${model}: exception — ${String(err).slice(0, 200)}`
      );
      continue;
    }
  }

  return null;
}

/* ────────────────────────────────────────────────────────
 * POST handler — public endpoint, no auth required
 * Pipeline: Gemini → estimate (with frontend guard)
 * ──────────────────────────────────────────────────────── */
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
    lastOcrErrors = [];

    // ── 1. Try Gemini vision (handles PDFs + images) ──
    const result = await geminiOcr(base64, file.type);
    if (result && result.wordCount > 0) {
      return NextResponse.json({
        pageCount: result.pageCount,
        wordCount: result.wordCount,
        estimated: false,
        ocrEngine: "gemini",
      });
    }

    // ── 2. Fallback: estimate (frontend requires user confirmation) ──
    const pageCount = result?.pageCount || 1;
    return NextResponse.json({
      pageCount,
      wordCount: pageCount * WORDS_PER_PAGE_FALLBACK,
      estimated: true,
      ocrEngine: "none",
      debug: {
        hasKey: !!process.env.GEMINI_API_KEY,
        errors: lastOcrErrors,
      },
    });
  } catch (error) {
    console.error("File analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze file" },
      { status: 500 }
    );
  }
}
