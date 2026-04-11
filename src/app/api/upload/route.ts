import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { GEMINI_API_KEY } from "@/lib/env";
import { auth } from "@/lib/auth";
import { uploadSourceFile } from "@/lib/storage";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const IMAGE_TYPES = new Set(["jpg", "png", "webp", "gif"]);

/**
 * Use Gemini to extract all text from a PDF or image.
 * Returns plain text content, or null if extraction fails.
 */
async function geminiExtractText(
  base64: string,
  mimeType: string,
  purpose: "extract" | "translate" = "extract"
): Promise<{ text: string; detectedLanguage?: string; wasTranslated?: boolean } | null> {
  const key = GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) return null;

  const prompt =
    purpose === "translate"
      ? `You are a document translator. Extract all text from this document and translate it to English. Preserve the original structure, clause numbering, and formatting. First line must be "DETECTED_LANGUAGE: [language name]", then provide the full English translation.`
      : `Extract all text from this document exactly as written. Preserve all structure, numbering, headings, and formatting. Return only the extracted text, nothing else.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mimeType, data: base64 } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 8192, temperature: 0 },
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini text extraction failed:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!output) return null;

    if (purpose === "translate") {
      const lines = output.split("\n");
      let detectedLanguage = "Unknown";
      let text = output;
      if (lines[0]?.startsWith("DETECTED_LANGUAGE:")) {
        detectedLanguage = lines[0].replace("DETECTED_LANGUAGE:", "").trim();
        text = lines.slice(1).join("\n").trim();
      }
      return { text, detectedLanguage, wasTranslated: true };
    }

    return { text: output };
  } catch (err) {
    console.error("Gemini extraction error:", err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileType = ALLOWED_TYPES[file.type];
    if (!fileType) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, or image file (JPG, PNG, WebP)." },
        { status: 400 }
      );
    }

    const sizeLimit = IMAGE_TYPES.has(fileType) ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
    if (file.size > sizeLimit) {
      return NextResponse.json(
        { error: IMAGE_TYPES.has(fileType) ? "Image size exceeds 10MB limit." : "File size exceeds 25MB limit." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Persist source file to Supabase Storage — non-fatal
    let storagePath: string | null = null;
    try {
      const session = await auth();
      const email = session?.user?.email || "anonymous";
      storagePath = await uploadSourceFile(email, file.name, buffer, file.type);
    } catch (e) {
      console.error("Source file storage failed (non-fatal):", e);
    }

    // ── Images: return base64 for Claude vision in chat ──
    if (IMAGE_TYPES.has(fileType)) {
      const imageData = buffer.toString("base64");
      return NextResponse.json({
        fileName: file.name,
        fileType,
        textLength: 0,
        extractedText: `[Image attached: ${file.name}]`,
        imageData,
        imageMediaType: file.type,
        storagePath,
      });
    }

    let extractedText = "";

    // ── PDFs: use Gemini vision extraction (no native deps) ──
    if (fileType === "pdf") {
      const base64 = buffer.toString("base64");
      const result = await geminiExtractText(base64, "application/pdf");
      if (result?.text) {
        extractedText = result.text;
      } else {
        // Gemini unavailable — tell user clearly
        return NextResponse.json(
          { error: "Could not extract text from this PDF. Please try again in a moment." },
          { status: 422 }
        );
      }
    }

    // ── DOCX: use mammoth ──
    if (fileType === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    }

    // Trim excessive whitespace
    extractedText = extractedText.replace(/\n{3,}/g, "\n\n").trim();

    if (!extractedText) {
      return NextResponse.json(
        { error: "Could not extract text from this document. It may be a scanned image — please upload as JPG or PNG instead." },
        { status: 422 }
      );
    }

    // Detect if document might need translation
    const latinCharCount = (extractedText.match(/[a-zA-Z]/g) || []).length;
    const totalCharCount = extractedText.replace(/\s/g, "").length;
    const latinRatio = totalCharCount > 0 ? latinCharCount / totalCharCount : 0;
    const needsTranslation = latinRatio < 0.3 && totalCharCount > 50;

    let translatedText: string | undefined;
    let detectedLanguage: string | undefined;

    if (needsTranslation) {
      const base64 = buffer.toString("base64");
      const translation = await geminiExtractText(base64, file.type, "translate");
      if (translation?.text) {
        translatedText = translation.text;
        detectedLanguage = translation.detectedLanguage;
      }
    }

    return NextResponse.json({
      fileName: file.name,
      fileType,
      textLength: extractedText.length,
      extractedText: translatedText || extractedText,
      originalText: translatedText ? extractedText : undefined,
      needsTranslation,
      detectedLanguage,
      wasTranslated: !!translatedText,
      storagePath,
    });
  } catch (error) {
    console.error("Upload processing error:", error);
    return NextResponse.json(
      { error: "Failed to process document. Please try again." },
      { status: 500 }
    );
  }
}
