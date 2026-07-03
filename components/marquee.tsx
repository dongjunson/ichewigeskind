const MARQUEE_ITEMS = [
  "ich ewiges kind",
  "너와 함께하는 아름다운 일상들",
  "analog film journal",
  "grain · light · patience",
  "ich ewiges kind",
  "a journal of analog photography",
  "grain · light · patience",
];

const MARQUEE_COPIES = [0, 1];

export function Marquee() {
  return (
    <div aria-hidden="true" className="marquee border-y border-border/60 py-4 md:py-5">
      <div className="marquee__track">
        {MARQUEE_COPIES.map((copy) => (
          <div key={copy} className="marquee__group">
            {MARQUEE_ITEMS.map((text, index) => (
              <span
                key={`${copy}-${text}-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: static decorative list with repeated entries
                  index
                }`}
                className="flex items-center gap-10 font-serif text-sm italic tracking-[0.04em] text-muted-foreground md:text-base"
              >
                {text}
                <span className="h-1 w-1 rounded-full bg-primary/40" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
