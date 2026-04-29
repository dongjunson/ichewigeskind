"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const sloganRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!footerRef.current || !leftRef.current) return;

    const leftItems = leftRef.current.querySelectorAll("p");
    const trigger = footerRef.current;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger,
        start: "top 90%",
        toggleActions: "play none none reverse",
      },
    });

    const st = tl.scrollTrigger;

    if (leftItems.length) {
      tl.fromTo(
        leftItems,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.06,
          ease: "power2.out",
        }
      );
    }

    if (sloganRef.current) {
      tl.fromTo(
        sloganRef.current,
        { opacity: 0, y: 14 },
        {
          opacity: 0.85,
          y: 0,
          duration: 1,
          ease: "power2.out",
        },
        leftItems.length ? "-=0.5" : 0
      );
    }

    return () => st?.kill();
  }, []);

  return (
    <footer ref={footerRef} className="px-5 py-12 sm:px-6 md:px-16 lg:px-24 sm:py-16">
      <div className="max-w-7xl mx-auto flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div ref={leftRef}>
          <p className="font-serif text-xl sm:text-2xl text-primary mb-1.5 sm:mb-2 opacity-0">
            ich ewiges kind.
          </p>
          <p className="font-sans text-xs text-muted-foreground mb-1.5 sm:mb-2 opacity-0">
            A journal of analog photography
          </p>
          <p className="font-sans text-xs text-muted-foreground opacity-0">
            love@ichewigeskind.com
          </p>
        </div>
        <p
          ref={sloganRef}
          className="font-gowun text-xs sm:text-sm text-muted-foreground opacity-0 text-center sm:text-right"
        >
          너와 함께하는 아름다운 일상들
        </p>
      </div>
    </footer>
  );
}
