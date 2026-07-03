"use client";

import gsap from "gsap";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function Hero({ initialSrc }: { initialSrc?: string | null }) {
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

      <div className="relative z-10 flex min-h-[100svh] w-full items-end px-6 pb-16 pt-24 md:px-16 md:pb-24 md:pt-28 lg:px-24">
        <div className="max-w-3xl">
          <p
            ref={subtitleRef}
            className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-primary/75 mb-6 opacity-0 drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]"
          >
            A Journal of Analog Photography
          </p>
          <h1
            ref={titleRef}
            className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight text-primary opacity-0 drop-shadow-[0_3px_18px_rgba(0,0,0,0.82)]"
          >
            ich ewiges kind.
          </h1>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
        <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-primary/60">
          Scroll
        </span>
        <span className="scroll-cue-line" />
      </div>
    </section>
  );
}
