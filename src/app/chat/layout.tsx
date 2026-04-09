import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Legal Consultation for UAE — Get Instant Guidance on UAE Law | Sidqo",
  description:
    "Get instant AI-powered legal guidance on UAE federal law. Ask about employment rights, visa issues, tenancy disputes, family law, and more — free, private, 24/7 available.",
  keywords:
    "AI lawyer UAE, legal consultation Dubai, UAE employment law, ask legal question UAE, free legal advice Dubai, MOHRE complaint, labour law UAE, visa questions, tenancy disputes",
  alternates: { canonical: "/chat" },
  openGraph: {
    title: "AI Legal Consultation for UAE — Get Instant Guidance | Sidqo",
    description:
      "Ask about any UAE legal issue — employment, visas, tenancy, family law, and more. Instant AI guidance based on UAE federal law.",
    url: "https://sidqo.com/chat",
    siteName: "Sidqo",
    type: "website",
    images: [
      {
        url: "https://sidqo.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sidqo AI Legal Consultation",
      },
    ],
  },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
