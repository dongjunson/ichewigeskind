"use client";

import gsap from "gsap";
import { Check, ChevronLeft, ChevronRight, Copy, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface GalleryItem {
  id: string;
  src: string;
  thumbnailSrc?: string;
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
const LOADING_DOTS = [0, 1, 2];
const HOVER_EFFECT_RANGE = 31;

function mergeGalleryItems(prev: GalleryItem[], incoming: GalleryItem[]) {
  if (incoming.length === 0) return prev;
  const existingIds = new Set(prev.map((item) => item.id));
  const filtered = incoming.filter((item) => !existingIds.has(item.id));
  return filtered.length > 0 ? [...prev, ...filtered] : prev;
}

function getInitialViewerIndex(items: GalleryItem[], selectedImageId?: string | null) {
  if (!selectedImageId) return null;
  const index = items.findIndex((item) => item.id === selectedImageId);
  return index === -1 ? null : index;
}

function formatDriveDate(createdTime?: string) {
  return createdTime?.slice(0, 10) ?? null;
}

function getPhotoPath(id: string) {
  return `/photos/${encodeURIComponent(id)}`;
}

function getPhotoIdFromPath(pathname: string) {
  if (!pathname.startsWith("/photos/")) return null;
  const [, , id] = pathname.split("/");
  return id ? decodeURIComponent(id) : null;
}

function LoadingDots({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dotClassName =
    variant === "light" ? "bg-white/55 shadow-[0_0_10px_rgba(255,255,255,0.18)]" : "bg-primary/45";

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ repeat: -1 })
        .to(".loading-dot", {
          y: -3,
          opacity: 1,
          duration: 0.45,
          ease: "sine.inOut",
          stagger: 0.12,
        })
        .to(
          ".loading-dot",
          {
            y: 0,
            opacity: 0.45,
            duration: 0.45,
            ease: "sine.inOut",
            stagger: 0.12,
          },
          0.45
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative z-10 flex items-center justify-center gap-1.5">
      {LOADING_DOTS.map((dot) => (
        <span
          key={dot}
          className={`loading-dot h-1.5 w-1.5 rounded-full opacity-45 ${dotClassName}`}
        />
      ))}
    </div>
  );
}

function GalleryCard({
  item,
  onClick,
  onHoverEnd,
  onHoverStart,
  isDimmed = false,
  isHovered = false,
  priority = false,
}: {
  item: GalleryItem;
  onClick: () => void;
  onHoverEnd: () => void;
  onHoverStart: () => void;
  isDimmed?: boolean;
  isHovered?: boolean;
  priority?: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(item.thumbnailSrc ?? item.src ?? "/placeholder.svg");
  const [hoverEnabled, setHoverEnabled] = useState(false);
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const createdDate = formatDriveDate(item.createdTime);
  const fallbackSrc = item.src ?? "/placeholder.svg";

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHoverEnabled(entry.isIntersecting);
      },
      {
        rootMargin: "900px 0px",
        threshold: 0,
      }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const markImageLoaded = () => setImageLoaded(true);

  const syncImageElement = (node: HTMLImageElement | null) => {
    if (!node?.complete) return;
    if (node.naturalWidth > 0) {
      markImageLoaded();
    } else if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    } else {
      markImageLoaded();
    }
  };

  const handleImageError = () => {
    if (imageSrc !== fallbackSrc) {
      setImageLoaded(false);
      setImageSrc(fallbackSrc);
      return;
    }
    markImageLoaded();
  };

  const imageTransitionClass = hoverEnabled
    ? isHovered
      ? "duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] transition-[opacity,transform,filter] group-hover:scale-105"
      : "duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] transition-[opacity,filter]"
    : "duration-500 ease-out transition-opacity";
  const imageFilterClass = isDimmed ? "grayscale brightness-[0.72]" : "grayscale-0 brightness-100";

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      onBlur={onHoverEnd}
      onFocus={onHoverStart}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") onHoverStart();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") onHoverEnd();
      }}
      className={`gallery-card w-full text-left ${hoverEnabled ? "group is-hover-enabled" : ""}`}
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <div
          className={`absolute inset-0 z-20 flex items-center justify-center bg-secondary transition-opacity duration-300 ${
            imageLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <LoadingDots />
        </div>
        <Image
          ref={syncImageElement}
          src={imageSrc}
          alt={item.alt}
          fill
          unoptimized
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          className={`gallery-card__image object-cover ${imageTransitionClass} ${imageFilterClass} ${
            imageLoaded ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
          onLoad={markImageLoaded}
          onError={handleImageError}
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
  const [failedImageId, setFailedImageId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
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

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  if (!item) return null;
  const imageError = failedImageId === item.id;
  const imageLoading = loadedImageId !== item.id && !imageError;
  const hasMultipleItems = items.length > 1;

  const markImageLoaded = () => {
    setFailedImageId(null);
    setLoadedImageId(item.id);
  };

  const markImageFailed = () => {
    setFailedImageId(item.id);
  };

  const syncImageElement = (node: HTMLImageElement | null) => {
    imageRef.current = node;
    if (!node?.complete) return;

    if (node.naturalWidth > 0) {
      markImageLoaded();
    } else {
      markImageFailed();
    }
  };

  const copyUrl = async () => {
    const url = `${window.location.origin}${getPhotoPath(item.id)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopied(true);
  };

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
      <div className="absolute right-4 top-4 z-[60] flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            copyUrl();
          }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/80 shadow-lg backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label={copied ? "Copied URL" : "Copy URL"}
        >
          {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/80 shadow-lg backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

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
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingDots variant="light" />
          </div>
        )}
        {imageError && (
          <div className="max-w-[70vw] rounded-md border border-white/15 bg-black/45 px-4 py-3 text-center text-sm text-white/75 shadow-lg backdrop-blur-md">
            Image could not be loaded.
          </div>
        )}
        {/* biome-ignore lint/performance/noImgElement: Drive proxy images need natural lightbox sizing. */}
        <img
          ref={syncImageElement}
          key={item.id}
          src={`/api/gallery/image?id=${encodeURIComponent(item.id)}`}
          alt={item.alt}
          className={`max-h-[90vh] max-w-full w-auto object-contain transition-all duration-500 ease-out ${
            imageLoading || imageError ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
          }`}
          onLoad={markImageLoaded}
          onError={markImageFailed}
        />
      </div>
    </div>
  );
}

export function Gallery({
  initialItems = [],
  initialNextPageToken = null,
  initialSelectedImage = null,
}: {
  initialItems?: GalleryItem[];
  initialNextPageToken?: string | null;
  initialSelectedImage?: GalleryItem | null;
}) {
  const selectedImageId = initialSelectedImage?.id ?? null;
  const seededItems = initialSelectedImage
    ? mergeGalleryItems(initialItems, [initialSelectedImage])
    : initialItems;
  const [items, setItems] = useState<GalleryItem[]>(seededItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(
    getInitialViewerIndex(seededItems, selectedImageId)
  );
  const [nextPageToken, setNextPageToken] = useState<string | null>(initialNextPageToken);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [supportsHover, setSupportsHover] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateSupportsHover = () => setSupportsHover(mediaQuery.matches);

    updateSupportsHover();
    mediaQuery.addEventListener("change", updateSupportsHover);
    return () => mediaQuery.removeEventListener("change", updateSupportsHover);
  }, []);

  useEffect(() => {
    if (supportsHover) return;
    setHoveredIndex(null);
  }, [supportsHover]);

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

  useEffect(() => {
    if (!initialSelectedImage) return;
    setItems((prev) => mergeGalleryItems(prev, [initialSelectedImage]));
  }, [initialSelectedImage]);

  useEffect(() => {
    if (!selectedImageId) return;
    if (getPhotoIdFromPath(window.location.pathname) !== selectedImageId) return;
    const index = items.findIndex((item) => item.id === selectedImageId);
    if (index !== -1) setViewerIndex(index);
  }, [items, selectedImageId]);

  useEffect(() => {
    const syncViewerWithLocation = () => {
      const photoId = getPhotoIdFromPath(window.location.pathname);
      if (!photoId) {
        setViewerIndex(null);
        return;
      }

      const index = items.findIndex((item) => item.id === photoId);
      if (index !== -1) {
        setViewerIndex(index);
      }
    };

    window.addEventListener("popstate", syncViewerWithLocation);
    return () => window.removeEventListener("popstate", syncViewerWithLocation);
  }, [items]);

  useEffect(() => {
    const handleOpenRequest = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return;
      setViewerIndex(index);
      window.history.pushState({ photoId: id }, "", getPhotoPath(id));
    };

    window.addEventListener("gallery:open", handleOpenRequest);
    return () => window.removeEventListener("gallery:open", handleOpenRequest);
  }, [items]);

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

      setItems((prev) => mergeGalleryItems(prev, data.images ?? []));
      setNextPageToken(data.nextPageToken ?? null);
    } catch (e) {
      setLoadMoreError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  };

  const openViewer = (index: number) => {
    const item = items[index];
    if (!item) return;
    setViewerIndex(index);
    window.history.pushState({ photoId: item.id }, "", getPhotoPath(item.id));
  };
  const closeViewer = () => {
    setViewerIndex(null);
    if (window.location.pathname.startsWith("/photos/")) {
      window.history.replaceState(null, "", "/#work");
    }
  };
  const goPrev = () =>
    setViewerIndex((i) => {
      if (i === null) return null;
      const nextIndex = (i - 1 + items.length) % items.length;
      const item = items[nextIndex];
      if (item) {
        window.history.replaceState({ photoId: item.id }, "", getPhotoPath(item.id));
      }
      return nextIndex;
    });
  const goNext = () =>
    setViewerIndex((i) => {
      if (i === null) return null;
      const nextIndex = (i + 1) % items.length;
      const item = items[nextIndex];
      if (item) {
        window.history.replaceState({ photoId: item.id }, "", getPhotoPath(item.id));
      }
      return nextIndex;
    });

  return (
    <section id="work" className="w-full pb-16 sm:pb-24">
      <div className="flex items-end justify-between px-6 pb-8 pt-16 md:px-16 md:pb-10 md:pt-24 lg:px-24">
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Archive
          </p>
          <h2 className="mt-2 font-serif text-3xl text-primary md:text-4xl">All frames</h2>
        </div>
        {!loading && !error && (
          <p className="font-date text-xs text-muted-foreground">
            {items.length}
            {nextPageToken ? "+" : ""} frames
          </p>
        )}
      </div>
      {loading && (
        <div className={`grid ${GRID_COLS} gap-0`}>
          {LOADING_PLACEHOLDERS.map((placeholder) => (
            <div
              key={placeholder}
              className="relative aspect-square overflow-hidden bg-secondary flex items-center justify-center"
            >
              <LoadingDots />
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
          <div className={`gallery-grid grid ${GRID_COLS} gap-0`}>
            {items.map((item, index) => (
              <GalleryCard
                key={item.id}
                item={item}
                isDimmed={
                  hoveredIndex !== null &&
                  hoveredIndex !== index &&
                  Math.abs(hoveredIndex - index) <= HOVER_EFFECT_RANGE
                }
                isHovered={hoveredIndex === index}
                onClick={() => openViewer(index)}
                onHoverEnd={() =>
                  setHoveredIndex((current) => (current === index ? null : current))
                }
                onHoverStart={() => {
                  if (supportsHover) setHoveredIndex(index);
                }}
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
