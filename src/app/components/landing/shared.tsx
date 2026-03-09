"use client";

import { useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import { LANDING_AVATAR_MAP } from "@/data/landing-content";
import { GAME_MASTER_AVATAR } from "@/lib/game-master-avatar";

/** Next.js Image with onError fallback via state */
export function SafeAvatar({
  src,
  fallback,
  alt,
  width,
  height,
  className,
  loading,
  priority,
}: {
  src: string;
  fallback: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  loading?: "lazy" | "eager";
  priority?: boolean;
}) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <NextImage
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? undefined : loading}
      priority={priority}
      onError={() => setImgSrc(fallback)}
    />
  );
}

/**
 * Native <img> avatar for landing page messages.
 * Uses decoding="sync" so the browser paints the (cached) image in the same
 * frame as the DOM insertion — no black-flash between mount and decode.
 */
function NativeAvatar({ src, fallback, alt, className }: {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      decoding="sync"
      className={className}
      onError={() => { if (ref.current) ref.current.src = fallback; }}
    />
  );
}

/** Shared avatar renderer for landing page preview messages */
export function PreviewAvatar({ name, isHost }: {
  name: string;
  isHost?: boolean;
  role?: string;
  personality?: string;
  gender?: string;
}) {
  const src = LANDING_AVATAR_MAP[name];

  if (isHost) {
    const avatarSrc = src || GAME_MASTER_AVATAR;
    return (
      <div className="w-9 h-9 rounded-full flex-shrink-0 ring-1 ring-zinc-600/50 overflow-hidden bg-zinc-700">
        <NativeAvatar
          src={avatarSrc}
          fallback={GAME_MASTER_AVATAR}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const initials = name.substring(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full flex-shrink-0 ring-1 ring-zinc-600/50 overflow-hidden bg-zinc-700">
      {src ? (
        <NativeAvatar
          src={src}
          fallback={GAME_MASTER_AVATAR}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white">
          {initials}
        </div>
      )}
    </div>
  );
}

export function StreamingText({
  text,
  speed = 30,
  onComplete,
}: {
  text: string;
  speed?: number;
  onComplete?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex >= text.length) {
      if (onComplete) {
        setTimeout(() => onComplete(), 800);
      }
      return;
    }
    const timeout = setTimeout(() => {
      setDisplayedText(text.slice(0, currentIndex + 1));
      setCurrentIndex(currentIndex + 1);
    }, speed);
    return () => clearTimeout(timeout);
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className="text-sm text-zinc-300 leading-relaxed">
      {displayedText}
      {currentIndex < text.length && (
        <span aria-hidden="true" className="inline-block w-[2px] h-4 bg-violet-400 animate-pulse ml-0.5" />
      )}
    </span>
  );
}
