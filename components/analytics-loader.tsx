"use client";

import { useEffect, useRef } from "react";

export function AnalyticsLoader({ gaId }: { gaId: string | null }) {
  const injected = useRef(false);

  useEffect(() => {
    if (!gaId || injected.current) return;
    if (document.querySelector(`script[src*="googletagmanager.com/gtag"]`)) return;

    injected.current = true;

    const script1 = document.createElement("script");
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script1);

    script1.onload = () => {
      if (document.getElementById("gtag-config")) return;
      const script2 = document.createElement("script");
      script2.id = "gtag-config";
      script2.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      document.head.appendChild(script2);
    };
  }, [gaId]);

  return null;
}
