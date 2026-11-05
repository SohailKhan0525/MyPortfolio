type SectionScroller = (target: HTMLElement) => void;
let activeScroller: SectionScroller | null = null;

/** A small bridge for commands that navigate without an anchor element. */
export function registerSectionScroller(scroller: SectionScroller): () => void {
  activeScroller = scroller;
  return () => {
    if (activeScroller === scroller) activeScroller = null;
  };
}

export function scrollToPortfolioSection(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;
  if (activeScroller) {
    activeScroller(target);
    return;
  }
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
}
