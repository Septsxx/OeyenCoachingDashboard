"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      target.current = { x: e.clientX, y: e.clientY };
    }
    function onOver(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      if (el) {
        setActive(true);
        if (textRef.current) textRef.current.textContent = el.dataset.cursor ?? "";
      } else {
        setActive(false);
      }
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);

    let rafId: number;
    function loop() {
      pos.current.x += (target.current.x - pos.current.x) * 0.18;
      pos.current.y += (target.current.y - pos.current.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={ringRef} className={`lp-cursor ${active ? "lp-cursor-active" : ""}`}>
      <span ref={textRef} className="lp-cursor-text" />
    </div>
  );
}
