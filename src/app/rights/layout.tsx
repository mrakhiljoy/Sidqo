import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Know Your Rights in the UAE — Employee, Tenant & Consumer Rights | Sidqo",
  description:
    "Understand your legal rights in the UAE. Explore employment rights, tenant protections, consumer laws, immigration rules, and more — explained in plain language with citations to UAE federal law.",
  keywords:
    "UAE rights, employee rights UAE, tenant rights Dubai, consumer protection UAE, immigration rights UAE, RERA tenant rights, labour rights UAE",
  alternates: { canonical: "/rights" },
  openGraph: {
    title: "Know Your Rights in the UAE | Sidqo",
    description:
      "Understand your legal rights in the UAE — employment, tenancy, consumer, immigration, and more.",
    url: "https://sidqo.com/rights",
    siteName: "Sidqo",
    type: "website",
  },
};

export default function RightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
