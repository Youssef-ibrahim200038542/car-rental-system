"use client";

import Image from "next/image";
import { useState } from "react";

type CarImageProps = {
  src: string;
  /** Shown instead of `src` when it fails to load. */
  fallbackSrc?: string;
  alt: string;
  className?: string;
  sizes: string;
  preload?: boolean;
};

/**
 * A car photo that fills its (positioned) parent and swaps to a fallback on error.
 * Backend URLs are local IPs that Next's optimizer refuses, so they are served
 * as-is; same-origin /public images are optimized.
 */
export default function CarImage({
  src,
  fallbackSrc,
  alt,
  className,
  sizes,
  preload,
}: CarImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const currentSrc = failedSrc === src && fallbackSrc ? fallbackSrc : src;

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      unoptimized={/^https?:\/\//i.test(currentSrc)}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
