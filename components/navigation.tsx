"use client";

import { useEffect, useState } from "react";

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 lg:px-24 py-6 transition-all duration-700 ${
        scrolled ? "bg-background/90 backdrop-blur-sm" : "bg-transparent"
      } ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <a
        href="/"
        className="font-serif text-lg text-primary tracking-wide transition-opacity duration-300 hover:opacity-70"
      >
        ichewigeskind
      </a>
      <div className="flex items-center gap-8">
        <a
          href="#work"
          className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-300 hover:text-primary"
        >
          Work
        </a>
        <a
          href="#journal"
          className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-300 hover:text-primary"
        >
          Journal
        </a>
        <a
          href="#about"
          className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-300 hover:text-primary"
        >
          About
        </a>
      </div>
    </nav>
  );
}
