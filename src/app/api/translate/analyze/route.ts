import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

const WORDS_PER_PAGE_FALLBACK = 250;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PDF_MIME = "application/pdf";
const GEMINI_MODEL = "gemini-2.5-flash";

/* ── helpers ───────────────────────────────────── */

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

/**
 * Tier 1 — pdf-parse text extraction (fast, no external API).
 * Works for text-based PDFs. Returns 0 wordCount for scanned PDFs.
 */
async function extractPdfText(
  buffer: Buffer
): Promise<{ wordCount: number; pageCount: number } | null> {
  let parser: PDFParse | null = null;
  try {
    parser = new PDFParse({ data: new Uint8Array(buffer) });
    const info = await parser.getInfo();
    const pageCount = info?.total || 1;
    const textResult = await parser.getText();
    const text = textResult?.text?.trim() || "";
    return { wordCount: countWords(text), pageCount };
  } catch (err) {
    console.error("pdf-parse error (non-fatal):", err);
    return null;
  } finally {
    try {
      await parser?.destroy();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Tier 2 — Gemini vision OCR (handles scanned PDFs + images natively).
 * Returns null if GEMINI_API_KEY is missing or the call fails.
 */
async function geminiOcr(
  base64: string,
  mimeType: string
): Promise<{ wordCount: number; pageCount: number } | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          generationConfig: { maxOutputTokens: 64, temperature: 0 },
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini OCR error:", res.status);
      return null;
    }

    const data = await res.json();
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!output) return null;

    const wordMatch = output.match(/WORDS:\s*(\d+)/i);
    const pageMatch = output.match(/PAGES:\s*(\d+)/i);
    return {
      wordCount: wordMatch ? parseInt(wordMatch[1], 10) : 0,
      pageCount: pageMatch ? parseInt(pageMatch[1], 10) : 1,
    };
  } catch (err) {
    console.error("Gemini OCR error:", err);
    return null;
  }
}

/* ── route handler ─────────────────────────────── */

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

    /* ── PDF path ──────────────────────────────── */
    if (file.type === PDF_MIME) {
      // Tier 1: fast text extraction (works for text-layer PDFs)
      const pdfResult = await extractPdfText(buffer);
      if (pdfResult && pdfResult.wordCount > 0) {
        return NextResponse.json({
          pageCount: pdfResult.pageCount,
          wordCount: pdfResult.wordCount,
          estimated: false,
        });
      }

      const pageCount = pdfResult?.pageCount || 1;

      // Tier 2: Gemini vision (scanned/image PDFs)
      const gemini = await geminiOcr(base64, file.type);
      if (gemini && gemini.wordCount > 0) {
        return NextResponse.json({
          pageCount: gemini.pageCount || pageCount,
          wordCount: gemini.wordCount,
          estimated: false,
        });
      }

      // Fallback estimate
      return NextResponse.json({
        pageCount,
        wordCount: pageCount * WORDS_PER_PAGE_FALLBACK,
        estimated: true,
      });
    }

    /* ── Image path ────────────────────────────── */
    // Gemini vision for images
    const gemini = await geminiOcr(base64, file.type);
    if (gemini && gemini.wordCount > 0) {
      return NextResponse.json({
        pageCount: 1,
        wordCount: gemini.wordCount,
        estimated: false,
      });
    }

    // Fallback estimate
    return NextResponse.json({
      pageCount: 1,
      wordCount: WORDS_PER_PAGE_FALLBACK,
      estimated: true,
    });
  } catch (error) {
    console.error("File analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze file" },
      { status: 500 }
    );
  }
}
