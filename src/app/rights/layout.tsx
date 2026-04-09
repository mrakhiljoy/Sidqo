import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Know Your Rights in the UAE — Employment, Tenant & Consumer Rights | Sidqo",
  description:
    "Understand your legal rights in the UAE across all areas: employment, tenancy, consumer protection, immigration, family law, and more. Explained clearly with citations to UAE federal law.",
  keywords:
    "UAE rights, employee rights UAE, tenant rights Dubai, consumer protection UAE, immigration rights UAE, RERA tenant rights, labour rights UAE, family law rights, business law UAE",
  alternates: { canonical: "/rights" },
  openGraph: {
    title: "Know Your Rights in the UAE — Employee, Tenant & Consumer Rights | Sidqo",
    description:
      "Understand your legal rights across all areas of UAE law. Employment, tenancy, consumer, immigration, family law, and more.",
    url: "https://sidqo.com/rights",
    siteName: "Sidqo",
    type: "website",
    images: [
      {
        url: "https://sidqo.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Know Your Rights in UAE",
      },
    ],
  },
};

export default function RightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
