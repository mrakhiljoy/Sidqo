import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      pageCount = data.numpages || 1;
      wordCount = data.text
        ? data.text.split(/\s+/).filter((w: string) => w.length > 0).length
        : 0;
    } else if (
      file.type === "image/jpeg" ||
      file.type === "image/png"
    ) {
      // Images are always 1 page; no word count extraction without OCR
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
