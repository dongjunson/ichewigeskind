"use client";

import gsap from "gsap";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export function Hero({
  initialSrc,
  children,
}: {
  initialSrc?: string | null;
  children?: ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible || !subtitleRef.current || !titleRef.current) return;

    gsap.fromTo(
      subtitleRef.current,
      {
        opacity: 0,
        y: 24,
      },
      {
        opacity: 1,
        y: 0,
        duration: 2.2,
        delay: 0.4,
        ease: "power2.out",
      }
    );

    gsap.fromTo(
      titleRef.current,
      {
        opacity: 0,
        y: 40,
        filter: "blur(8px)",
      },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 2.5,
        delay: 0.9,
        ease: "power2.out",
      }
    );
  }, [isVisible]);

  const bgSrc = initialSrc ?? "/images/hero.jpg";

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={bgSrc}
          alt="ichewigeskind"
          fill
          className={`object-cover transition-opacity duration-[3000ms] ease-out ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          priority
          fetchPriority="high"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="relative z-10 grid min-h-[100svh] w-full grid-rows-[minmax(0,1fr)_auto] px-6 pb-14 pt-24 md:px-16 md:pb-20 md:pt-28 lg:px-24">
        {children}
        <div className="max-w-3xl">
          <p
            ref={subtitleRef}
            className="font-sans text-xs uppercase tracking-[0.35em] text-muted-foreground mb-6 opacity-0"
          >
            A Film Photography Journal
          </p>
          <h1
            ref={titleRef}
            className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight text-primary opacity-0"
          >
            ich ewiges kind.
          </h1>
        </div>
      </div>
    </section>
  );
}
