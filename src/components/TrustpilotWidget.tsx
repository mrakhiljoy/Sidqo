"use client";

import { useEffect, useRef } from "react";

interface TrustpilotWidgetProps {
  templateId?: string;
  businessUnitId?: string;
  theme?: "dark" | "light";
  height?: string;
  width?: string;
  stars?: string;
}

// Replace TRUSTPILOT_BUSINESS_UNIT_ID with your actual ID from
// your Trustpilot Business account URL: https://businessapp.b2b.trustpilot.com/
const TRUSTPILOT_BUSINESS_UNIT_ID = process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID || "";

export default function TrustpilotWidget({
  templateId = "5419b6a8b0d04a076446a9ad", // Mini widget
  businessUnitId = TRUSTPILOT_BUSINESS_UNIT_ID,
  theme = "dark",
  height = "24px",
  width = "100%",
  stars = "4,5",
}: TrustpilotWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Trustpilot && ref.current) {
      (window as any).Trustpilot.loadFromElement(ref.current, true);
    }
  }, []);

  if (!businessUnitId) return null;

  return (
    <div
      ref={ref}
      className="trustpilot-widget"
      data-locale="en-US"
      data-template-id={templateId}
      data-businessunit-id={businessUnitId}
      data-style-height={height}
      data-style-width={width}
      data-theme={theme}
      data-stars={stars}
    >
      <a
        href={`https://www.trustpilot.com/review/sidqo.com`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Trustpilot
      </a>
    </div>
  );
}
