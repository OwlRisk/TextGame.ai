import { useState, useRef, useEffect, useCallback } from "react";

interface UseSplitPanelOptions {
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  /** Reference to the container element to compute 50% width from. */
  containerRef?: React.RefObject<HTMLElement | null>;
}

export function useSplitPanel(opts: UseSplitPanelOptions = {}) {
  const { minWidth = 280, maxWidth = 900 } = opts;

  const [previewWidth, setPreviewWidth] = useState(() => {
    if (typeof window === "undefined") return opts.initialWidth ?? 420;
    // ~50% of available space (accounting for sidebar)
    const half = Math.floor((window.innerWidth - 80) / 2);
    return Math.min(maxWidth, Math.max(minWidth, half));
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startW: 0 });
  const hasUserDragged = useRef(false);

  // On mount: measure actual container and set 50%
  useEffect(() => {
    if (hasUserDragged.current) return;
    const container = opts.containerRef?.current;
    if (container) {
      const half = Math.floor(container.clientWidth / 2);
      setPreviewWidth(Math.min(maxWidth, Math.max(minWidth, half)));
    }
  }, [opts.containerRef, minWidth, maxWidth]);

  useEffect(() => {
    if (!isDragging) return;
    hasUserDragged.current = true;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - dragRef.current.startX;
      setPreviewWidth(() => {
        const next = dragRef.current.startW - delta;
        return Math.min(maxWidth, Math.max(minWidth, next));
      });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, minWidth, maxWidth]);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startW: previewWidth };
    setIsDragging(true);
  }, [previewWidth]);

  return { previewWidth, isDragging, onDragStart, minWidth };
}
