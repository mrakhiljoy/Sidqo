import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { GEMINI_API_KEY } from "@/lib/env";

const WORDS_PER_PAGE_FALLBACK = 250;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Use Gemini vision to OCR an image and count words.
 * Accepts one or more base64-encoded images.
 */
async function ocrWordCount(
  images: Array<{ base64: string; mimeType: string }>
): Promise<number | null> {
  if (!GEMINI_API_KEY || images.length === 0) return null;

  try {
    const parts: Array<Record<string, unknown>> = [];

    // Add all images
    for (const img of images) {
      parts.push({
        inline_data: {
          mime_type: img.mimeType,
          data: img.base64,
        },
      });
    }

    // Add the counting prompt
    parts.push({
      text: `Count the total number of words in ${images.length > 1 ? "these document pages" : "this document/image"}. Include all visible text — headings, body text, labels, captions, handwritten text, stamps, watermarks, everything. Do NOT include numbers-only tokens (like page numbers or dates) unless they contain letters. Respond with ONLY a single integer on its own line, nothing else. If you cannot read any text, respond with 0.`,
    });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { maxOutputTokens: 64, temperature: 0 },
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini OCR response error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!output) return null;

    // Extract the first integer from the response
    const match = output.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
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

    const buffer = Buffer.from(await file.arrayBuffer());
    let pageCount = 1;
    let wordCount = 0;
    let estimated = false;

    if (file.type === "application/pdf") {
      let parser: PDFParse | null = null;
      try {
        parser = new PDFParse({ data: new Uint8Array(buffer) });
        const info = await parser.getInfo();
        pageCount = info?.total || 1;

        // Try text extraction first
        const textResult = await parser.getText();
        const extractedText = textResult?.text?.trim() || "";
        wordCount = extractedText
          ? extractedText.split(/\s+/).filter((w: string) => w.length > 0).length
          : 0;

        // If no extractable text (scanned/image PDF), use Gemini OCR
        if (wordCount === 0 && pageCount > 0) {
          try {
            // Render pages to images for OCR (max 10 pages to keep request reasonable)
            const pagesToRender = Math.min(pageCount, 10);
            const screenshots = await parser.getScreenshot({
              first: pagesToRender,
              imageDataUrl: false,
              imageBuffer: true,
              scale: 1.5, // Good balance of readability vs size
            });

            const images = screenshots.pages.map((page) => ({
              base64: Buffer.from(page.data).toString("base64"),
              mimeType: "image/png",
            }));

            const ocrCount = await ocrWordCount(images);
            if (ocrCount !== null && ocrCount > 0) {
              // If we only OCR'd a subset, extrapolate
              if (pagesToRender < pageCount) {
                wordCount = Math.round((ocrCount / pagesToRender) * pageCount);
                estimated = true;
              } else {
                wordCount = ocrCount;
              }
            } else {
              // OCR failed — use fallback estimate
              wordCount = pageCount * WORDS_PER_PAGE_FALLBACK;
              estimated = true;
            }
          } catch (ocrError) {
            console.error("PDF OCR fallback error:", ocrError);
            wordCount = pageCount * WORDS_PER_PAGE_FALLBACK;
            estimated = true;
          }
        }
      } catch (parseError) {
        console.error("PDF parse error:", parseError);
        wordCount = pageCount * WORDS_PER_PAGE_FALLBACK;
        estimated = true;
      } finally {
        try { await parser?.destroy(); } catch { /* ignore cleanup errors */ }
      }
    } else if (IMAGE_MIME_TYPES.has(file.type)) {
      // Image upload — use Gemini OCR directly
      pageCount = 1;
      const base64 = buffer.toString("base64");
      const ocrCount = await ocrWordCount([{ base64, mimeType: file.type }]);

      if (ocrCount !== null && ocrCount > 0) {
        wordCount = ocrCount;
      } else {
        wordCount = WORDS_PER_PAGE_FALLBACK;
        estimated = true;
      }
    }

    return NextResponse.json({ pageCount, wordCount, estimated });
  } catch (error) {
    console.error("File analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze file" },
      { status: 500 }
    );
  }
}
