"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  title: string;
  createdTime?: string;
}

interface GalleryResponse {
  images?: GalleryItem[];
  nextPageToken?: string | null;
  error?: string;
}

const GRID_COLS = "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6";
const LOADING_PLACEHOLDERS = Array.from(
  { length: 12 },
  (_, index) => `loading-placeholder-${index}`
);

function formatDriveDate(createdTime?: string) {
  return createdTime?.slice(0, 10) ?? null;
}

function GalleryCard({
  item,
  onClick,
  priority = false,
}: {
  item: GalleryItem;
  onClick: () => void;
  priority?: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const createdDate = formatDriveDate(item.createdTime);

  return (
    <button type="button" onClick={onClick} className="group w-full text-left">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {/* 스켈레톤: 영역 세팅 시점부터 이미지 로드 전까지 항상 표시 */}
        <div
          className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 transition-opacity duration-300 ${
            imageLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="absolute inset-0 bg-accent animate-pulse" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute inset-0 -translate-x-full animate-shimmer"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                width: "50%",
              }}
            />
          </div>
          <div className="relative z-10 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
        <Image
          src={item.src || "/placeholder.svg"}
          alt={item.alt}
          fill
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          className={`object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
            imageLoaded ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
          onLoad={() => setImageLoaded(true)}
        />
        {createdDate && (
          <span className="pointer-events-none absolute right-2 bottom-2 z-30 inline-flex h-5 min-w-[4.5rem] items-center justify-center rounded-sm border border-white/25 bg-black/75 px-1.5 font-date text-[10px] font-medium leading-none text-white shadow-sm backdrop-blur-sm">
            {createdDate}
          </span>
        )}
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
  const [loadedImageId, setLoadedImageId] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const item = items[currentIndex];

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
  const imageLoading = loadedImageId !== item.id;
  const hasMultipleItems = items.length > 1;

  const handleTouchEnd = (x: number, y: number) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || !hasMultipleItems) return;

    const deltaX = x - start.x;
    const deltaY = y - start.y;
    const isHorizontalSwipe = Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4;

    if (!isHorizontalSwipe) return;
    if (deltaX > 0) {
      onPrev();
    } else {
      onNext();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex touch-pan-y items-center justify-center bg-black/95"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      tabIndex={-1}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={(e) => {
        const touch = e.changedTouches[0];
        handleTouchEnd(touch.clientX, touch.clientY);
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 z-[60] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/80 shadow-lg backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {hasMultipleItems && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-3 top-1/2 z-[60] inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/85 shadow-lg backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:left-4 sm:h-14 sm:w-14"
            aria-label="Previous"
          >
            <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-3 top-1/2 z-[60] inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/85 shadow-lg backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:right-4 sm:h-14 sm:w-14"
            aria-label="Next"
          >
            <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8" />
          </button>
        </>
      )}

      <div className="relative z-[50] flex max-h-[90vh] max-w-[90vw] items-center justify-center min-h-[200px]">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-white/50 animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        {/* biome-ignore lint/performance/noImgElement: Drive proxy images need natural lightbox sizing. */}
        <img
          src={`/api/gallery/image?id=${encodeURIComponent(item.id)}`}
          alt={item.alt}
          className={`max-h-[90vh] max-w-full w-auto object-contain transition-all duration-500 ease-out ${
            imageLoading ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
          }`}
          onLoad={() => setLoadedImageId(item.id)}
        />
      </div>
    </div>
  );
}

export function Gallery({
  initialItems = [],
  initialNextPageToken = null,
}: {
  initialItems?: GalleryItem[];
  initialNextPageToken?: string | null;
}) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(initialNextPageToken);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const mergeItems = (prev: GalleryItem[], incoming: GalleryItem[]) => {
    if (incoming.length === 0) return prev;
    const existingIds = new Set(prev.map((item) => item.id));
    const filtered = incoming.filter((item) => !existingIds.has(item.id));
    return filtered.length > 0 ? [...prev, ...filtered] : prev;
  };

  useEffect(() => {
    if (initialItems.length > 0) return;
    fetch("/api/gallery")
      .then((res) => {
        if (!res.ok) {
          return res.json().then((d: GalleryResponse) => {
            throw new Error(d.error ?? "Failed to load");
          });
        }
        return res.json() as Promise<GalleryResponse>;
      })
      .then((data) => {
        setItems(data.images ?? []);
        setNextPageToken(data.nextPageToken ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [initialItems.length]);

  const loadMore = async () => {
    if (!nextPageToken || loadingMore) return;

    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const params = new URLSearchParams({ pageToken: nextPageToken });
      const res = await fetch(`/api/gallery?${params.toString()}`);
      const data = (await res.json()) as GalleryResponse;

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load more");
      }

      setItems((prev) => mergeItems(prev, data.images ?? []));
      setNextPageToken(data.nextPageToken ?? null);
    } catch (e) {
      setLoadMoreError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  };

  const openViewer = (index: number) => setViewerIndex(index);
  const closeViewer = () => setViewerIndex(null);
  const goPrev = () =>
    setViewerIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length));
  const goNext = () => setViewerIndex((i) => (i === null ? null : (i + 1) % items.length));

  return (
    <section id="work" className="w-full pb-16 sm:pb-24">
      {loading && (
        <div className={`grid ${GRID_COLS} gap-0`}>
          {LOADING_PLACEHOLDERS.map((placeholder, i) => (
            <div
              key={placeholder}
              className="relative aspect-square overflow-hidden bg-secondary flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-accent animate-pulse" />
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  className="absolute inset-0 -translate-x-full animate-shimmer"
                  style={{
                    animationDelay: `${i * 0.12}s`,
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                    width: "50%",
                  }}
                />
              </div>
              <div className="relative z-10 flex gap-1">
                {[0, 1, 2].map((j) => (
                  <div
                    key={j}
                    className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse"
                    style={{ animationDelay: `${j * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-8 text-center">
          <p className="text-muted-foreground font-sans text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className={`grid ${GRID_COLS} gap-0`}>
            {items.map((item, index) => (
              <GalleryCard
                key={item.id}
                item={item}
                onClick={() => openViewer(index)}
                priority={index < 6}
              />
            ))}
          </div>
          {nextPageToken && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="more-button-soft text-[12px] font-serif italic tracking-[0.03em] text-primary/80 underline underline-offset-4 decoration-primary/30 transition-colors hover:text-primary hover:decoration-primary/60 focus-visible:outline-none focus-visible:text-primary disabled:opacity-40"
              >
                {loadingMore ? "loading..." : "more"}
              </button>
            </div>
          )}
          {loadMoreError && (
            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">{loadMoreError}</p>
            </div>
          )}
        </>
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
