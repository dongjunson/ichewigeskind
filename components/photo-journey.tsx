"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GalleryImage } from "@/lib/gallery";

gsap.registerPlugin(ScrollTrigger);

const JOURNEY_COUNT = 10;
const SCROLL_PER_FRAME = 75;
const FRAME_TILTS = [-1.4, 1.1, -0.9, 1.6, -1.2, 0.8, -1.6, 1.3, -0.7, 1.5];

function padIndex(value: number) {
  return String(value).padStart(2, "0");
}

function formatFullDate(createdTime?: string) {
  return createdTime?.slice(0, 10).replaceAll("-", ".") ?? null;
}

function formatTickLabel(createdTime?: string) {
  if (!createdTime) return null;
  const [, month, day] = createdTime.slice(0, 10).split("-");
  return `${month}.${day}`;
}

function formatGhostLabel(createdTime?: string) {
  if (!createdTime) return null;
  const [year, month] = createdTime.slice(0, 10).split("-");
  return `${year}.${month}`;
}

function getFrameSrc(item: GalleryImage) {
  return item.thumbnailSrc?.replace(/=s\d+$/, "=s1600") ?? item.src;
}

function tickPosition(index: number, total: number) {
  return total > 1 ? `${(index / (total - 1)) * 100}%` : "50%";
}

function JourneyFrame({
  item,
  isActive,
  priority,
  tilt,
}: {
  item: GalleryImage;
  isActive: boolean;
  priority: boolean;
  tilt: number;
}) {
  const [src, setSrc] = useState(() => getFrameSrc(item));

  return (
    <div
      className={`journey-frame absolute inset-0 flex items-center justify-center px-4 py-3 md:px-12 md:py-5 ${
        isActive ? "is-active" : ""
      }`}
      style={{ "--tilt": `${tilt}deg` } as CSSProperties}
    >
      <button
        type="button"
        tabIndex={isActive ? 0 : -1}
        onClick={() =>
          window.dispatchEvent(new CustomEvent("gallery:open", { detail: { id: item.id } }))
        }
        className="group relative h-full w-full max-w-[92vw] cursor-zoom-in focus-visible:outline-none md:max-w-[70vw]"
        aria-label={`Open ${item.title}`}
      >
        <Image
          src={src}
          alt={item.alt}
          fill
          unoptimized
          priority={priority}
          sizes="(max-width: 768px) 88vw, 64vw"
          className="object-contain drop-shadow-[0_28px_56px_rgba(0,0,0,0.65)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.015] group-focus-visible:scale-[1.015]"
          onError={() => {
            if (src !== item.src) setSrc(item.src);
          }}
        />
      </button>
    </div>
  );
}

export function PhotoJourney({ items: source = [] }: { items?: GalleryImage[] }) {
  const items = useMemo(() => source.slice(0, JOURNEY_COUNT), [source]);
  const total = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const activeIndexRef = useRef(0);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || total < 2) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const setFill = fillRef.current ? gsap.quickSetter(fillRef.current, "scaleX") : null;
    const setGhostX = ghostRef.current ? gsap.quickSetter(ghostRef.current, "xPercent") : null;
    setFill?.(0);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${total * SCROLL_PER_FRAME}%`,
      pin: true,
      anticipatePin: 1,
      snap: reduceMotion
        ? undefined
        : {
            snapTo: 1 / (total - 1),
            duration: { min: 0.25, max: 0.7 },
            ease: "power2.out",
            delay: 0.08,
          },
      onUpdate: (self) => {
        setFill?.(self.progress);
        setGhostX?.((0.5 - self.progress) * 8);
        const index = Math.round(self.progress * (total - 1));
        if (activeIndexRef.current !== index) {
          activeIndexRef.current = index;
          setActiveIndex(index);
        }
      },
    });
    triggerRef.current = trigger;

    return () => {
      trigger.kill();
      triggerRef.current = null;
    };
  }, [total]);

  if (total === 0) return null;

  const activeItem = items[activeIndex] ?? items[0];
  const ghostLabel = formatGhostLabel(activeItem.createdTime) ?? padIndex(activeIndex + 1);

  const scrollToIndex = (index: number) => {
    const trigger = triggerRef.current;
    if (!trigger || total < 2) return;
    const top = trigger.start + ((trigger.end - trigger.start) * index) / (total - 1);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="timeline"
      aria-label="Photo timeline"
      className="film-grain relative flex h-[100svh] flex-col overflow-hidden bg-background"
    >
      <div
        ref={ghostRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
      >
        <span key={ghostLabel} className="journey-ghost-text animate-fade-in-slow font-date">
          {ghostLabel}
        </span>
      </div>

      <div className="relative z-20 flex items-start justify-between px-6 pt-20 md:px-16 md:pt-24 lg:px-24">
        <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          Timeline
        </p>
        <div className="text-right">
          <p key={activeIndex} className="animate-fade-in font-date text-sm text-primary">
            {padIndex(activeIndex + 1)}
            <span className="text-muted-foreground"> / {padIndex(total)}</span>
          </p>
          <p className="mt-1 font-date text-[11px] text-muted-foreground">
            {formatFullDate(activeItem.createdTime) ?? "—"}
          </p>
        </div>
      </div>

      <div className="relative z-10 min-h-0 flex-1">
        {items.map((item, index) => (
          <JourneyFrame
            key={item.id}
            item={item}
            isActive={index === activeIndex}
            priority={index === 0}
            tilt={FRAME_TILTS[index % FRAME_TILTS.length]}
          />
        ))}
      </div>

      <div className="relative z-20 px-8 pb-8 pt-3 md:px-16 md:pb-10 lg:px-24">
        <div className="relative">
          <div className="h-px w-full bg-border" />
          <div
            ref={fillRef}
            className="absolute left-0 top-0 h-px w-full origin-left bg-primary/70"
            style={{ transform: "scaleX(0)" }}
          />
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToIndex(index)}
              className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 p-3 focus-visible:outline-none"
              style={{ left: tickPosition(index, total) }}
              aria-label={`Go to photo ${index + 1} of ${total}`}
              aria-current={index === activeIndex}
            >
              <span
                className={`block h-1.5 w-1.5 rounded-full transition-all duration-500 ${
                  index <= activeIndex ? "bg-primary" : "bg-muted-foreground/40"
                } ${
                  index === activeIndex
                    ? "scale-[2] shadow-[0_0_12px_hsl(var(--primary)/0.55)]"
                    : "group-hover:scale-150 group-focus-visible:scale-150"
                }`}
              />
            </button>
          ))}
        </div>
        <div className="relative mt-4 hidden h-4 sm:block">
          {items.map((item, index) => (
            <span
              key={item.id}
              className={`absolute -translate-x-1/2 font-date text-[10px] tracking-wide transition-colors duration-500 ${
                index === activeIndex ? "text-primary" : "text-muted-foreground/60"
              }`}
              style={{ left: tickPosition(index, total) }}
            >
              {formatTickLabel(item.createdTime) ?? padIndex(index + 1)}
            </span>
          ))}
        </div>
        <div className="mt-4 flex justify-between font-date text-[10px] text-muted-foreground sm:hidden">
          <span>{formatTickLabel(items[0]?.createdTime) ?? padIndex(1)}</span>
          <span className="text-primary">{formatFullDate(activeItem.createdTime) ?? ""}</span>
          <span>{formatTickLabel(items[total - 1]?.createdTime) ?? padIndex(total)}</span>
        </div>
      </div>
    </section>
  );
}
