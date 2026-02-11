"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [heroSrc, setHeroSrc] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch("/api/gallery")
      .then((res) => res.ok ? res.json() : Promise.resolve({ images: [] }))
      .then((data) => {
        const images = data?.images ?? [];
        if (images.length > 0) {
          const randomIndex = Math.floor(Math.random() * images.length);
          setHeroSrc(images[randomIndex].src);
        }
      })
      .catch(() => {});
  }, []);

  const bgSrc = heroSrc ?? "/images/hero.jpg";

  return (
    <section ref={ref} className="relative min-h-screen flex items-end">
      <div className="absolute inset-0">
        <Image
          src={bgSrc}
          alt="ichewigeskind"
          fill
          className={`object-cover transition-opacity duration-[3000ms] ease-out ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="relative z-10 w-full px-6 pb-24 md:px-16 lg:px-24">
        <div className="max-w-3xl">
          <p
            className={`font-sans text-xs uppercase tracking-[0.35em] text-muted-foreground mb-6 transition-all duration-[2000ms] delay-500 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            A Film Photography Journal
          </p>
          <h1
            className={`font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight text-primary transition-all duration-[2000ms] delay-700 ${
              isVisible
                ? "opacity-100 translate-y-0 blur-0"
                : "opacity-0 translate-y-6 blur-[4px]"
            }`}
          >
            ichewigeskind
          </h1>
        </div>
      </div>
    </section>
  );
}
