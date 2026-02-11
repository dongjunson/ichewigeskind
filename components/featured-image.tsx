"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export function FeaturedImage() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const offset = (elementCenter - viewportCenter) * 0.08;
        setScrollY(offset);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section ref={ref} className="px-6 py-16 md:px-16 lg:px-24">
      <div className="max-w-6xl mx-auto">
        <div
          className={`relative aspect-[21/9] overflow-hidden bg-secondary transition-all duration-[2000ms] ease-out ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
          }`}
        >
          <Image
            src="/images/gallery-4.jpg"
            alt="Abandoned greenhouse interior in golden hour light"
            fill
            className="object-cover"
            style={{ transform: `translateY(${scrollY}px)` }}
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/60 to-transparent h-1/3" />
          <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12">
            <p className="font-sans text-xs uppercase tracking-[0.35em] text-primary/80 mb-2">
              Featured
            </p>
            <h3 className="font-serif text-3xl md:text-4xl text-primary">
              Reclamation
            </h3>
            <p className="font-sans text-xs text-primary/60 mt-2">
              Kodak Ektar 100 -- Pentax 67
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
