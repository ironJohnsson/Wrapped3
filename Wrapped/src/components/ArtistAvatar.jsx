import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

export function ArtistAvatar({
  src,
  name = '',
  size = 'w-12 h-12',
  className = '',
  textSize = 'text-base',
  borderColor = 'border-white/15',
  crossOrigin,
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const initial = (name || '').trim().charAt(0).toUpperCase();

  return (
    <div
      title={name}
      className={`rounded-full overflow-hidden bg-gradient-to-br from-purple-900/60 via-purple-950/40 to-zinc-900 border ${borderColor} shrink-0 shadow-md relative flex items-center justify-center select-none ${size} ${className}`}
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
      <div className={`w-full h-full flex items-center justify-center font-black ${textSize} text-purple-300 absolute z-0`}>
        {initial || <User size={16} className="text-purple-400" />}
      </div>
    </div>
  );
}

