import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Legal Consultation — Ask About UAE Law | Sidqo",
  description:
    "Get instant AI-powered legal guidance on UAE federal law. Ask about employment rights, visa issues, tenancy disputes, family law, and more — free, private, and available 24/7.",
  keywords:
    "AI lawyer UAE, legal consultation Dubai, UAE employment law, ask legal question UAE, free legal advice Dubai, MOHRE complaint, labour law UAE",
  alternates: { canonical: "/chat" },
  openGraph: {
    title: "AI Legal Consultation — Ask About UAE Law | Sidqo",
    description:
      "Get instant AI-powered legal guidance on UAE federal law. Ask about employment rights, visa issues, tenancy disputes, and more.",
    url: "https://sidqo.com/chat",
    siteName: "Sidqo",
    type: "website",
  },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
