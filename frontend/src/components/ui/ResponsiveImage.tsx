/**
 * ResponsiveImage Component
 * Optimized image component with lazy loading and responsive sizing
 */

import React, { useState } from 'react';
import { cn } from '@/utils/cn';

export interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: '1:1' | '4:3' | '16:9' | '21:9';
  loading?: 'lazy' | 'eager';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  sizes?: string;
  srcSet?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className,
  aspectRatio,
  loading = 'lazy',
  objectFit = 'cover',
  sizes,
  srcSet,
  placeholder,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const aspectRatioClasses = {
    '1:1': 'aspect-square',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video',
    '21:9': 'aspect-[21/9]',
  };

  const objectFitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          aspectRatio && aspectRatioClasses[aspectRatio],
          className
        )}
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        aspectRatio && aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {/* Placeholder/Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse">
          {placeholder && (
            <img
              src={placeholder}
              alt=""
              className={cn(
                'w-full h-full blur-sm',
                objectFitClasses[objectFit]
              )}
            />
          )}
        </div>
      )}

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        sizes={sizes}
        srcSet={srcSet}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full transition-opacity duration-300',
          objectFitClasses[objectFit],
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
};

export default ResponsiveImage;
