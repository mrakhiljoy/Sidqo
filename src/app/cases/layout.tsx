import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Case Strategy Builder — Build Your Legal Case | Sidqo",
  description:
    "Build a complete legal strategy for your UAE case. Get evidence checklists, timelines, legal arguments, and step-by-step action plans powered by AI analysis of UAE law.",
  keywords:
    "legal case strategy UAE, build legal case Dubai, evidence checklist UAE, legal action plan, UAE court preparation",
  alternates: { canonical: "/cases" },
  openGraph: {
    title: "AI Case Strategy Builder | Sidqo",
    description:
      "Build a complete legal strategy for your UAE case with AI-powered analysis.",
    url: "https://sidqo.com/cases",
    siteName: "Sidqo",
    type: "website",
  },
};

export default function CasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
