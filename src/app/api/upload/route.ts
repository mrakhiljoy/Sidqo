import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
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

async function translateWithGemini(text: string): Promise<{ translated: string; detectedLanguage: string } | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a document translator. Translate the following document text to English. Preserve the original structure, clause numbering, and formatting as much as possible. First, on a single line, state the detected language in the format "DETECTED_LANGUAGE: [language name]", then provide the full translation.\n\n${text.slice(0, 30000)}`
            }]
          }],
          generationConfig: { maxOutputTokens: 8192 },
        }),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!output) return null;

    // Extract detected language from first line
    const lines = output.split("\n");
    let detectedLanguage = "Unknown";
    let translated = output;

    if (lines[0]?.startsWith("DETECTED_LANGUAGE:")) {
      detectedLanguage = lines[0].replace("DETECTED_LANGUAGE:", "").trim();
      translated = lines.slice(1).join("\n").trim();
    }

    return { translated, detectedLanguage };
  } catch (error) {
    console.error("Gemini translation error:", error);
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

    // Persist source file to Supabase Storage (for later vendor dispatch).
    // Non-fatal: if storage is misconfigured we still return extracted text.
    let storagePath: string | null = null;
    try {
      const session = await auth();
      const email = session?.user?.email || "anonymous";
      storagePath = await uploadSourceFile(email, file.name, buffer, file.type);
    } catch (e) {
      console.error("Source file storage failed (non-fatal):", e);
    }

    // Handle image uploads — return base64 for Claude vision
    if (IMAGE_TYPES.has(fileType)) {
      const imageData = buffer.toString("base64");
      return NextResponse.json({
        fileName: file.name,
        fileType,
        textLength: 0,
        extractedText: `[Image attached: ${file.name}]`,
        imageData,
        imageMediaType: file.type,
      });
    }

    let extractedText = "";
    let pageCount: number | undefined;

    if (fileType === "pdf") {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const info = await parser.getInfo();
      const textResult = await parser.getText();
      extractedText = textResult.text;
      pageCount = info?.total;
      await parser.destroy();
    } else if (fileType === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    }

    // Trim excessive whitespace
    extractedText = extractedText.replace(/\n{3,}/g, "\n\n").trim();

    if (!extractedText) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this document. It may be a scanned image — text-based PDFs and DOCX files work best.",
        },
        { status: 422 }
      );
    }

    // Detect if document might need translation (simple heuristic)
    const latinCharCount = (extractedText.match(/[a-zA-Z]/g) || []).length;
    const totalCharCount = extractedText.replace(/\s/g, "").length;
    const latinRatio = totalCharCount > 0 ? latinCharCount / totalCharCount : 0;
    const needsTranslation = latinRatio < 0.3 && totalCharCount > 50;

    let translatedText: string | undefined;
    let detectedLanguage: string | undefined;

    if (needsTranslation) {
      const translation = await translateWithGemini(extractedText);
      if (translation) {
        translatedText = translation.translated;
        detectedLanguage = translation.detectedLanguage;
      }
    }

    return NextResponse.json({
      fileName: file.name,
      fileType,
      pageCount,
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
