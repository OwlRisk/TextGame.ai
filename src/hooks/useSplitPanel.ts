import { useState, useRef, useEffect } from "react";

interface UseSplitPanelOptions {
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export function useSplitPanel(opts: UseSplitPanelOptions = {}) {
  const { initialWidth = 420, minWidth = 280, maxWidth = 900 } = opts;

  const [previewWidth, setPreviewWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startW: 0 });

  useEffect(() => {
    if (!isDragging) return;
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

  const onDragStart = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startW: previewWidth };
    setIsDragging(true);
  };

  return { previewWidth, isDragging, onDragStart, minWidth };
}
