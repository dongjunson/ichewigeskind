"use client";

import { useEffect } from "react";

// Old shared links may still use the previous section id.
const HASH_ALIASES: Record<string, string> = { work: "frames" };

export function SectionHashSync({ ids }: { ids: string[] }) {
  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    if (sections.length === 0) return;

    // The browser anchor-jumps before the pinned timeline inserts its scroll
    // spacer, which pushes later sections down. Re-anchor once layout settles,
    // unless the user has already started scrolling on their own.
    const rawHash = window.location.hash.slice(1);
    const initialHash = HASH_ALIASES[rawHash] ?? rawHash;
    let reanchorTimer: number | null = null;
    const cancelReanchor = () => {
      if (reanchorTimer !== null) {
        window.clearTimeout(reanchorTimer);
        reanchorTimer = null;
      }
    };
    if (initialHash && ids.includes(initialHash)) {
      reanchorTimer = window.setTimeout(() => {
        reanchorTimer = null;
        document.getElementById(initialHash)?.scrollIntoView({ behavior: "auto" });
      }, 400);
      window.addEventListener("wheel", cancelReanchor, { once: true, passive: true });
      window.addEventListener("touchstart", cancelReanchor, { once: true, passive: true });
    }

    let currentHash = window.location.hash.slice(1) || null;
    let frame: number | null = null;

    const syncHash = () => {
      frame = null;
      if (window.location.pathname.startsWith("/photos/")) return;

      let active: string | null = null;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= window.innerHeight / 2) {
          active = section.id;
        }
      }
      if (active === currentHash) return;
      currentHash = active;
      window.history.replaceState(
        window.history.state,
        "",
        active ? `#${active}` : window.location.pathname
      );
    };

    const requestSync = () => {
      if (frame === null) frame = window.requestAnimationFrame(syncHash);
    };

    window.addEventListener("scroll", requestSync, { passive: true });
    requestSync();
    return () => {
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("wheel", cancelReanchor);
      window.removeEventListener("touchstart", cancelReanchor);
      cancelReanchor();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [ids]);

  return null;
}
