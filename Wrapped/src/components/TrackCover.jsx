import React, { useState, useEffect } from 'react';
import { Music } from 'lucide-react';

export function TrackCover({
  src,
  title = '',
  size = 'w-12 h-12',
  className = '',
  iconSize = 18,
  iconColor = 'text-[#1db954]',
  crossOrigin,
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  return (
    <div
      title={title}
      className={`rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 shrink-0 shadow-md relative flex items-center justify-center overflow-hidden select-none ${size} ${className}`}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          crossOrigin={crossOrigin}
          className={`w-full h-full object-cover relative z-10 transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      ) : null}
      <Music size={iconSize} className={`${iconColor} absolute z-0 opacity-80`} />
    </div>
  );
}
