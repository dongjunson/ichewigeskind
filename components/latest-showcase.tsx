"use client";

import gsap from "gsap";
import Image from "next/image";
import type { PointerEvent } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import type { GalleryImage } from "@/lib/gallery";

const CARD_CLASSES = ["card-3", "card-2", "card-4", "card-1", "card-5"];
const OPEN_DELAYS = [0, 0.12, 0.12, 0.24, 0.24];
const MOBILE_QUERY = "(max-width: 640px)";

export function LatestShowcase({ items }: { items: GalleryImage[] }) {
  const latestItems = items.slice(0, 5);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cardRefs = useRef<HTMLElement[]>([]);
  const activeIndexTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const queueActiveIndex = (index: number | null) => {
    if (activeIndexTimeoutRef.current) {
      window.clearTimeout(activeIndexTimeoutRef.current);
    }

    activeIndexTimeoutRef.current = window.setTimeout(() => {
      setActiveIndex(index);
      activeIndexTimeoutRef.current = null;
    }, 90);
  };

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);
    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  useLayoutEffect(() => {
    return () => {
      if (activeIndexTimeoutRef.current) {
        window.clearTimeout(activeIndexTimeoutRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const cards = cardRefs.current.filter((card) => getComputedStyle(card).display !== "none");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (cards.length === 0 || reduceMotion) {
      setIsReady(true);
      return;
    }

    const targetVars = cards.map((card) => {
      const style = getComputedStyle(card);
      return {
        x: style.getPropertyValue("--card-x").trim(),
        z: style.getPropertyValue("--card-z").trim(),
        ry: style.getPropertyValue("--card-ry").trim(),
        scale: style.getPropertyValue("--card-scale").trim() || "1",
      };
    });

    gsap.fromTo(
      cards,
      {
        "--card-x": "0%",
        "--card-ry": "0deg",
        "--card-scale": "0.92",
      },
      {
        "--card-x": (index) => targetVars[index]?.x ?? "0%",
        "--card-ry": (index) => targetVars[index]?.ry ?? "0deg",
        "--card-scale": (index) => targetVars[index]?.scale ?? "1",
        duration: 1.25,
        ease: "expo.out",
        delay: (index) => OPEN_DELAYS[index] ?? 0,
        clearProps: "--card-x,--card-ry,--card-scale",
        onComplete: () => setIsReady(true),
      }
    );
  }, []);

  if (latestItems.length === 0) return null;

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isReady || isMobile) return;

    const candidates = cardRefs.current
      .map((card, index) => ({ card, index, rect: card?.getBoundingClientRect() }))
      .filter(({ card, rect }) => {
        if (!card || !rect || getComputedStyle(card).display === "none") return false;
        return (
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        );
      })
      .sort((a, b) => {
        const aCenter = a.rect.left + a.rect.width / 2;
        const bCenter = b.rect.left + b.rect.width / 2;
        return Math.abs(event.clientX - aCenter) - Math.abs(event.clientX - bCenter);
      });

    queueActiveIndex(candidates[0]?.index ?? null);
  };

  return (
    <section className="latest-showcase" aria-label="Latest frames">
      <div
        className={`latest-showcase__stage ${isReady ? "is-ready" : "is-animating"}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          if (isReady && !isMobile) setActiveIndex(null);
        }}
      >
        <div className="latest-showcase__scene">
          {latestItems.map((item, index) => (
            <article
              key={item.id}
              ref={(node) => {
                if (node) cardRefs.current[index] = node;
              }}
              className={`latest-showcase__card ${CARD_CLASSES[index]} ${
                activeIndex === index ? "is-active" : ""
              }`}
              onPointerEnter={() => {
                if (isMobile && index === 0) queueActiveIndex(index);
              }}
              onPointerLeave={() => {
                if (isMobile && index === 0) queueActiveIndex(null);
              }}
              onFocus={() => {
                if (!isMobile || index === 0) queueActiveIndex(index);
              }}
              onBlur={() => queueActiveIndex(null)}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                priority={index === 2}
                fetchPriority={index === 2 ? "high" : "auto"}
                sizes="(max-width: 768px) 70vw, 320px"
                className="latest-showcase__image"
              />
              <div className="latest-showcase__action">
                <a href="#work" className="latest-showcase__button">
                  View in gallery
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
