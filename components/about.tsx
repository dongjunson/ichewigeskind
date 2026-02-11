"use client";

import { useEffect, useRef, useState } from "react";

export function About() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} id="about" className="px-6 py-32 md:px-16 lg:px-24">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-16 md:gap-24">
        <div className="md:w-1/3">
          <p
            className={`font-sans text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4 transition-all duration-[1500ms] ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            About
          </p>
          <h2
            className={`font-serif text-4xl md:text-5xl text-primary transition-all duration-[1500ms] delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0 blur-0"
                : "opacity-0 translate-y-4 blur-[2px]"
            }`}
          >
            The
            <br />
            Process
          </h2>
        </div>

        <div
          className={`md:w-2/3 transition-all duration-[1500ms] delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="font-sans text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
            This journal is a quiet space for the analog images I make while
            wandering. I shoot exclusively on film -- mostly 35mm and medium
            format -- drawn to the unpredictability, the grain, and the physical
            weight of each exposure.
          </p>
          <p className="font-sans text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
            Every photograph here was developed by hand and scanned from the
            negative. No digital manipulation, no filters. Just chemistry, light,
            and whatever truth the emulsion chooses to hold.
          </p>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed">
            Current cameras: Leica M6, Hasselblad 500C/M, Contax T2
            <br />
            Preferred stocks: Portra 400, Tri-X 400, CineStill 800T, HP5 Plus
          </p>
        </div>
      </div>
    </section>
  );
}
