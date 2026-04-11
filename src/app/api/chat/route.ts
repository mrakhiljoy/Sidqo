import Anthropic from "@anthropic-ai/sdk";
import { UAE_LAWYER_SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { ANTHROPIC_API_KEY } from "@/lib/env";

export async function POST(req: Request) {
  if (!ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set in .env.local");
    return new Response(
      JSON.stringify({ error: "API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const { messages } = await req.json() as {
      messages: Array<{
        role: string;
        content: string;
        document?: { imageData?: string; imageMediaType?: string };
      }>;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 8000,
            system: UAE_LAWYER_SYSTEM_PROMPT,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            thinking: { type: "adaptive" } as any,
            messages: messages.map((m) => {
              if (m.document?.imageData && m.document?.imageMediaType) {
                return {
                  role: m.role as "user" | "assistant",
                  content: [
                    {
                      type: "image" as const,
                      source: {
                        type: "base64" as const,
                        media_type: m.document.imageMediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                        data: m.document.imageData,
                      },
                    },
                    { type: "text" as const, text: m.content },
                  ],
                };
              }
              return {
                role: m.role as "user" | "assistant",
                content: m.content,
              };
            }),
          });

          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              );
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.error("Anthropic stream error:", message);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: `\n\n**Error:** ${message}` })}\n\n`)
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
