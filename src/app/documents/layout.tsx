import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Certified Legal Document Translation UAE — English to Arabic | Sidqo",
  description:
    "Fast, affordable, MOJ-certified legal translation in the UAE. Submit employment contracts, court documents, and legal notices for certified Arabic translation — delivered in 24 hours. Start now.",
  keywords:
    "legal translation UAE, certified translation Dubai, English to Arabic translation, MOJ certified translator, court document translation, MOHRE translation, legal document Arabic, certified legal translation Abu Dhabi, document generation UAE",
  alternates: { canonical: "/documents" },
  openGraph: {
    title:
      "Certified Legal Document Translation UAE — English to Arabic | Sidqo",
    description:
      "Fast, affordable, MOJ-certified legal translation in the UAE. Submit employment contracts, court documents, and legal notices for certified Arabic translation — delivered in 24 hours.",
    url: "https://sidqo.com/documents",
    siteName: "Sidqo",
    type: "website",
    images: [
      {
        url: "https://sidqo.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sidqo Legal Document Translation",
      },
    ],
  },
};

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
