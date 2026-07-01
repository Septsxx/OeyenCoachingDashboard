"use client";

import { useEffect, useRef } from "react";

export function useParallax<T extends HTMLElement>(strength = 0.15) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rafId: number;

    function update() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const centerOffset = rect.top + rect.height / 2 - vh / 2;
      const translate = centerOffset * -strength;
      const scale = 1 + Math.min(Math.abs(centerOffset) / 2400, 0.08);
      el.style.transform = `translateY(${translate}px) scale(${scale})`;
      rafId = requestAnimationFrame(update);
    }
    rafId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(rafId);
  }, [strength]);

  return ref;
}
