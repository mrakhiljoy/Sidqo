import { NextRequest, NextResponse } from "next/server";

// Allow up to 60s for OCR (Vercel Pro). Hobby plan caps at 10s.
export const maxDuration = 60;

const WORDS_PER_PAGE_FALLBACK = 250;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PDF_MIME = "application/pdf";

// gemini-2.5-flash (5 RPM free), gemini-2.0-flash (fallback)
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
// For PDFs: retry once (no Tesseract fallback available)
// For images: no retry (Tesseract fallback is faster)
const RETRY_DELAY_MS = 5_000;

// Collect errors from the last OCR attempt for debugging
let lastOcrErrors: string[] = [];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ────────────────────────────────────────────────────────
 * Tesseract.js OCR fallback (images only — can't read PDFs)
 * Runs entirely in-process via WASM, no native deps.
 * ──────────────────────────────────────────────────────── */
async function tesseractOcr(
  imageBuffer: Buffer
): Promise<{ wordCount: number } | null> {
  try {
    // Dynamic import so the module is only loaded when needed
    const Tesseract = await import("tesseract.js");
    const {
      data: { text },
    } = await Tesseract.recognize(imageBuffer, "eng");

    if (!text || !text.trim()) {
      lastOcrErrors.push("tesseract: recognized but text was empty");
      return null;
    }

    // Count words: split on whitespace, filter empties
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w: string) => w.length > 0);
    console.log(
      `Tesseract OCR success: ${words.length} words (first 100 chars: ${text.slice(0, 100)})`
    );
    return { wordCount: words.length };
  } catch (err) {
    const msg = `tesseract: exception — ${String(err).slice(0, 300)}`;
    lastOcrErrors.push(msg);
    console.error(msg);
    return null;
  }
}

/* ────────────────────────────────────────────────────────
 * Gemini vision OCR — counts words and pages in PDFs and images.
 * Retries on 429 (rate limit) with a delay, tries fallback models.
 * ──────────────────────────────────────────────────────── */
async function geminiOcr(
  base64: string,
  mimeType: string,
  maxRetries = 1
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
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
          }
        );

        if (res.status === 429) {
          const msg = `${model}: 429 rate-limited (attempt ${attempt + 1}/${maxRetries + 1})`;
          lastOcrErrors.push(msg);
          console.error(msg);
          if (attempt < maxRetries) {
            await sleep(RETRY_DELAY_MS);
            continue;
          }
          break;
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          const msg = `${model}: HTTP ${res.status} — ${errText.slice(0, 200)}`;
          lastOcrErrors.push(msg);
          console.error(msg);
          break;
        }

        const data = await res.json();
        const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!output) {
          lastOcrErrors.push(
            `${model}: empty output — ${JSON.stringify(data).slice(0, 200)}`
          );
          break;
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
        console.error(`Gemini model ${model} error:`, err);
        break;
      }
    }
  }

  console.error("All Gemini models failed for OCR");
  return null;
}

/* ────────────────────────────────────────────────────────
 * POST handler — public endpoint, no auth required
 * Pipeline: Gemini → Tesseract (images only) → estimate
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
    // For images: no retry (Tesseract fallback is faster than waiting)
    // For PDFs: retry once (no local fallback available)
    const isImage = IMAGE_MIME_TYPES.has(file.type);
    const geminiResult = await geminiOcr(base64, file.type, isImage ? 0 : 1);
    if (geminiResult && geminiResult.wordCount > 0) {
      return NextResponse.json({
        pageCount: geminiResult.pageCount,
        wordCount: geminiResult.wordCount,
        estimated: false,
        ocrEngine: "gemini",
      });
    }

    // ── 2. Fallback: Tesseract.js for images only ──
    if (isImage) {
      const tessResult = await tesseractOcr(buffer);
      if (tessResult && tessResult.wordCount > 0) {
        return NextResponse.json({
          pageCount: 1,
          wordCount: tessResult.wordCount,
          estimated: false,
          ocrEngine: "tesseract",
        });
      }
    }

    // ── 3. Final fallback: estimate ──
    const pageCount = geminiResult?.pageCount || 1;
    const hasKey = !!process.env.GEMINI_API_KEY;
    console.error(`OCR fallback used — hasKey: ${hasKey}`, lastOcrErrors);
    return NextResponse.json({
      pageCount,
      wordCount: pageCount * WORDS_PER_PAGE_FALLBACK,
      estimated: true,
      ocrEngine: "none",
      debug: {
        hasKey,
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
