import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const revalidate = 60; // Revalidate every 60 seconds

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          gap: "20px",
        }}
      >
        {/* Brand Name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textAlign: "center",
          }}
        >
          Sidqo
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 40,
            color: "white",
            textAlign: "center",
            maxWidth: "80%",
            fontWeight: "500",
          }}
        >
          AI Legal Guidance for UAE
        </div>

        {/* Sub-tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#cbd5e1",
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          Know Your Rights • Get Guidance • Build Your Case
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
