'use client';

import React, { useState } from 'react';
import { Coffee } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export function SafeImage({ src, alt, className = '' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F5EBD6] text-[#063B20]/70 p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Coffee className="w-8 h-8 mb-2 stroke-[1.5]" />
        <span className="text-xs font-medium tracking-wide text-[#382015]/70">
          {alt}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
