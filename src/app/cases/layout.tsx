import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Case Strategy Builder — Build Your UAE Legal Case | Sidqo",
  description:
    "Build a complete legal strategy for your UAE case. Get AI-powered evidence checklists, timelines, legal arguments, and action plans based on UAE federal law. Prepare confidently for disputes and court.",
  keywords:
    "legal case strategy UAE, build legal case Dubai, evidence checklist UAE, legal action plan, UAE court preparation, case strategy builder, legal dispute UAE",
  alternates: { canonical: "/cases" },
  openGraph: {
    title: "AI Case Strategy Builder — Build Your Legal Case | Sidqo",
    description:
      "Build a complete legal strategy with evidence checklists, timelines, legal arguments, and action plans powered by AI analysis of UAE law.",
    url: "https://sidqo.com/cases",
    siteName: "Sidqo",
    type: "website",
    images: [
      {
        url: "https://sidqo.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sidqo Case Strategy Builder",
      },
    ],
  },
};

export default function CasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
