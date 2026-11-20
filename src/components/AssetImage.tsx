import { useState, type ReactNode } from 'react';

interface AssetImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}

export function AssetImage({ src, alt, className = '', fallback }: AssetImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`inline-flex items-center justify-center rounded-2xl bg-[#EDE5FF] text-[#4A355A] ${className}`}
      >
        {fallback ?? '♥'}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
