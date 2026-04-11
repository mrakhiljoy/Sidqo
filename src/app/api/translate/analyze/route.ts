import { NextRequest, NextResponse } from "next/server";

const WORDS_PER_PAGE_FALLBACK = 250;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PDF_MIME = "application/pdf";

/**
 * Use Gemini vision to OCR a document (image or PDF) and count words.
 * For PDFs, Gemini 2.0 Flash accepts inline PDF data directly.
 */
async function ocrWordCount(
  data: string,
  mimeType: string
): Promise<{ wordCount: number; pageCount: number } | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data,
                  },
                },
                {
                  text: `Analyze this document. Count the total number of words (include all visible text: headings, body, labels, captions, handwritten text, stamps — everything readable). Also count the total number of pages. Respond with EXACTLY two lines and nothing else:\nWORDS: <integer>\nPAGES: <integer>\nIf you cannot read any text, respond with:\nWORDS: 0\nPAGES: 1`,
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 64, temperature: 0 },
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini OCR error:", res.status, await res.text());
      return null;
    }

    const result = await res.json();
    const output = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!output) return null;

    const wordMatch = output.match(/WORDS:\s*(\d+)/i);
    const pageMatch = output.match(/PAGES:\s*(\d+)/i);

    return {
      wordCount: wordMatch ? parseInt(wordMatch[1], 10) : 0,
      pageCount: pageMatch ? parseInt(pageMatch[1], 10) : 1,
    };
  } catch (error) {
    console.error("Gemini OCR error:", error);
    return null;
  }
}

// Public endpoint — no auth required (just reads file bytes, creates nothing)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== PDF_MIME && !IMAGE_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or image file." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    // Use Gemini vision for both PDFs and images — it handles both natively
    const ocrResult = await ocrWordCount(base64, file.type);

    if (ocrResult && ocrResult.wordCount > 0) {
      return NextResponse.json({
        pageCount: ocrResult.pageCount,
        wordCount: ocrResult.wordCount,
        estimated: false,
      });
    }

    // Fallback: Gemini unavailable or couldn't read text
    const pageCount = ocrResult?.pageCount || 1;
    return NextResponse.json({
      pageCount,
      wordCount: pageCount * WORDS_PER_PAGE_FALLBACK,
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
