import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import PostHogProviderWrapper from "@/components/PostHogProvider";

export const metadata: Metadata = {
  title: "Sidqo — AI Legal Guidance for UAE",
  description:
    "Know your rights in the UAE. Get instant AI-powered legal guidance, generate professional documents, and build case strategies — powered by advanced AI trained on UAE legislation.",
  keywords:
    "UAE law, legal advice, AI lawyer, legal rights UAE, employment law, MOHRE, Dubai law, Abu Dhabi law",
  metadataBase: new URL("https://sidqo.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Sidqo — AI Legal Guidance for UAE",
    description:
      "Know your rights in the UAE. Get instant AI-powered legal guidance, generate professional documents, and build case strategies.",
    url: "https://sidqo.com",
    siteName: "Sidqo",
    type: "website",
    locale: "en_AE",
    images: [
      {
        url: "https://sidqo.com/og",
        width: 1200,
        height: 630,
        alt: "Sidqo — AI Legal Guidance for UAE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sidqo — AI Legal Guidance for UAE",
    description:
      "Know your rights in the UAE. Get instant AI-powered legal guidance, generate professional documents, and build case strategies.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
          rel="stylesheet"
        />
        <script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="ZnpruKUBbeklhBT5rxMOvQ"
          async
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Sidqo",
              url: "https://sidqo.com",
              description:
                "AI-powered legal guidance platform for UAE law. Get instant legal guidance, generate professional documents, and build case strategies.",
              areaServed: {
                "@type": "Country",
                name: "United Arab Emirates",
              },
              sameAs: [],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Sidqo",
              url: "https://sidqo.com",
              description:
                "AI-powered legal guidance for the UAE — know your rights, generate documents, build case strategies.",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://sidqo.com/chat?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LegalService",
              name: "Sidqo — AI Legal Guidance",
              description:
                "AI-powered legal guidance platform providing instant consultation, document generation, and case strategy building for UAE residents.",
              url: "https://sidqo.com",
              areaServed: {
                "@type": "Country",
                name: "United Arab Emirates",
              },
              serviceType: [
                "Legal Consultation",
                "Legal Document Generation",
                "Case Strategy Building",
              ],
              provider: {
                "@type": "Organization",
                name: "Sidqo",
                url: "https://sidqo.com",
              },
              availableLanguage: ["en", "ar"],
            }),
          }}
        />
      </head>
      <body className="antialiased noise-overlay">
        <Providers>
          <PostHogProviderWrapper>
            <Navbar />
            <main>{children}</main>
          </PostHogProviderWrapper>
        </Providers>
      </body>
    </html>
  );
}
