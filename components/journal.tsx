"use client";

import { useEffect, useRef, useState } from "react";

interface JournalEntry {
  date: string;
  title: string;
  excerpt: string;
  film: string;
}

const entries: JournalEntry[] = [
  {
    date: "December 2025",
    title: "On Waiting",
    excerpt:
      "There is a particular kind of patience that film demands. Not the anxious waiting of a delayed train, but the contemplative stillness of watching light change across a room. Each frame is a meditation -- a quiet agreement between you and the moment that this instant, this exact arrangement of shadow and warmth, is worth preserving.",
    film: "Kodak Portra 400",
  },
  {
    date: "November 2025",
    title: "Night Walks in Tokyo",
    excerpt:
      "CineStill 800T was made for these streets. The halation around neon signs isn't a flaw -- it's the camera seeing what the eye already feels. Wet pavement becomes a second sky, and every alleyway holds a photograph if you're willing to slow down enough to find it.",
    film: "CineStill 800T",
  },
  {
    date: "October 2025",
    title: "The Greenhouse Sessions",
    excerpt:
      "I spent three mornings in an abandoned greenhouse on the outskirts of the city. The light there moves differently -- filtered through decades of grime on the glass, it arrives soft, golden, and ancient. The plants don't care about composition. They grow toward the light, and you follow.",
    film: "Kodak Ektar 100",
  },
];

function JournalCard({ entry, index }: { entry: JournalEntry; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    <article
      ref={ref}
      className={`border-t border-border pt-8 pb-12 transition-all duration-[1500ms] ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 200}ms` }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <time className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {entry.date}
        </time>
        <span className="font-sans text-xs text-muted-foreground">{entry.film}</span>
      </div>
      <h3 className="font-serif text-2xl md:text-3xl text-primary mb-4">{entry.title}</h3>
      <p className="font-sans text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
        {entry.excerpt}
      </p>
      <button
        type="button"
        className="mt-6 font-sans text-xs uppercase tracking-[0.2em] text-primary border-b border-primary/30 pb-1 transition-all duration-500 hover:border-primary/80 hover:text-primary/80"
      >
        Continue Reading
      </button>
    </article>
  );
}

export function Journal() {
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
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} id="journal" className="px-6 py-32 md:px-16 lg:px-24 bg-card">
      <div className="max-w-3xl mx-auto">
        <div className="mb-16">
          <p
            className={`font-sans text-xs uppercase tracking-[0.35em] text-muted-foreground mb-4 transition-all duration-[1500ms] ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            Journal
          </p>
          <h2
            className={`font-serif text-4xl md:text-5xl text-primary transition-all duration-[1500ms] delay-200 ${
              isVisible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-4 blur-[2px]"
            }`}
          >
            Darkroom Notes
          </h2>
        </div>

        <div className="flex flex-col">
          {entries.map((entry, index) => (
            <JournalCard key={entry.title} entry={entry} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
