import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UAE Law Research Tool for Lawyers — Cross-Reference Statutes Instantly | Sidqo",
  description:
    "Sidqo helps practicing attorneys quickly cross-reference UAE federal statutes, DIFC regulations, ADGM rules, and local legislation. Used by lawyers for preliminary research, client consultations, and out-of-jurisdiction matters.",
  keywords:
    "UAE law research tool, legal research UAE, cross reference UAE law, UAE statute search, AI legal research Dubai, UAE legislation database, lawyer tools UAE, DIFC law research, ADGM regulations search, UAE federal law database",
  alternates: { canonical: "/for-lawyers" },
  openGraph: {
    title: "UAE Law Research Tool for Lawyers | Sidqo",
    description:
      "Cross-reference UAE statutes instantly. Used by practicing attorneys for preliminary research, client consultations, and out-of-jurisdiction matters.",
    url: "https://sidqo.com/for-lawyers",
    siteName: "Sidqo",
    type: "website",
    images: [
      {
        url: "https://sidqo.com/og",
        width: 1200,
        height: 630,
        alt: "Sidqo — UAE Law Research for Legal Professionals",
      },
    ],
  },
};

export default function ForLawyersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
