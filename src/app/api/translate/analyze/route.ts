import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

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

    if (file.type === "application/pdf") {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const info = await parser.getInfo();
      const textResult = await parser.getText();
      pageCount = info?.total || 1;
      wordCount = textResult?.text
        ? textResult.text.split(/\s+/).filter((w: string) => w.length > 0).length
        : 0;
      await parser.destroy();
    } else if (file.type === "image/jpeg" || file.type === "image/png") {
      // Images: 1 page, no word count without OCR
      pageCount = 1;
      wordCount = 0;
    }

    return NextResponse.json({ pageCount, wordCount });
  } catch (error) {
    console.error("File analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze file" },
      { status: 500 }
    );
  }
}
