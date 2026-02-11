"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  title: string;
}

const GRID_COLS = "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6";

function GalleryCard({
  item,
  index,
  onClick,
  priority = false,
}: {
  item: GalleryItem;
  index: number;
  onClick: () => void;
  priority?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(priority);
  const [imageLoaded, setImageLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) return;
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
  }, [priority]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`group w-full text-left transition-all duration-[800ms] ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${index * 40}ms` }}
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {!imageLoaded && (
          <div className="absolute inset-0 z-10 animate-pulse bg-muted" />
        )}
        <Image
          src={item.src || "/placeholder.svg"}
          alt={item.alt}
          fill
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          className={`object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
          onLoad={() => setImageLoaded(true)}
        />
      </div>
    </button>
  );
}

function ImageViewer({
  items,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  items: GalleryItem[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [imageLoading, setImageLoading] = useState(true);
  const item = items[currentIndex];

  useEffect(() => {
    setImageLoading(true);
  }, [currentIndex]);

  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [item, onClose, onPrev, onNext]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 z-[60] rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-4 top-1/2 z-[60] -translate-y-1/2 rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Previous"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 top-1/2 z-[60] -translate-y-1/2 rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Next"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      <div
        className="relative z-[50] flex max-h-[90vh] max-w-[90vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-white/60" />
          </div>
        )}
        {/* Use proxy for reliable display (Drive direct URLs often fail in img) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/gallery/image?id=${encodeURIComponent(item.id)}`}
          alt={item.alt}
          className={`max-h-[90vh] max-w-full w-auto object-contain transition-opacity duration-300 ${
            imageLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setImageLoading(false)}
        />
      </div>
    </div>
  );
}

export function Gallery({ initialItems = [] }: { initialItems?: GalleryItem[] }) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialItems.length > 0) return;
    fetch("/api/gallery")
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error ?? "Failed to load"); });
        return res.json();
      })
      .then((data) => setItems(data.images ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [initialItems.length]);

  const openViewer = (index: number) => setViewerIndex(index);
  const closeViewer = () => setViewerIndex(null);
  const goPrev = () =>
    setViewerIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length));
  const goNext = () =>
    setViewerIndex((i) => (i === null ? null : (i + 1) % items.length));

  return (
    <section className="w-full">
      {loading && (
        <div className={`grid ${GRID_COLS} gap-0`}>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse bg-secondary"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="p-8 text-center">
          <p className="text-muted-foreground font-sans text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className={`grid ${GRID_COLS} gap-0`}>
          {items.map((item, index) => (
            <GalleryCard
              key={item.id}
              item={item}
              index={index}
              onClick={() => openViewer(index)}
              priority={index < 6}
            />
          ))}
        </div>
      )}

      {viewerIndex !== null && (
        <ImageViewer
          items={items}
          currentIndex={viewerIndex}
          onClose={closeViewer}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </section>
  );
}
