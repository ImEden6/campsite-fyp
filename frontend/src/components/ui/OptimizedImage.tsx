import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';
import { generateSrcSet, generateSizes } from '@/utils/imageOptimization';
import { useLazyFramerMotion } from '@/hooks/useLazyFramerMotion';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  responsive?: boolean;
  widths?: number[];
  breakpoints?: Record<string, string>;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage - Performance-optimized image component
 * Features:
 * - Lazy loading with Intersection Observer
 * - Responsive images with srcset
 * - Progressive loading with blur placeholder
 * - Error handling with fallback
 * - WebP format support
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  lazy = true,
  responsive = true,
  widths = [320, 640, 768, 1024, 1280, 1536],
  breakpoints = {
    '640px': '100vw',
    '768px': '50vw',
    '1024px': '33vw',
    default: '25vw',
  },
  fallback: _fallback,
  onLoad,
  onError,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const { motion } = useLazyFramerMotion();
  const MotionImg = motion?.img;

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // start loading 50px before entering viewport
      }
    );

    const target = imgRef.current;
    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // srcset for responsive images
  const srcSet = responsive ? generateSrcSet(src, widths) : undefined;
  const sizes = responsive ? generateSizes(breakpoints) : undefined;

  // Error state
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width, height }}
      >
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <ImageOff className="w-8 h-8" />
          <span className="text-xs">Failed to load image</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Blur placeholder while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Actual image */}
      {isInView && (
        MotionImg ? (
          <MotionImg
            ref={imgRef}
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            loading={lazy ? 'lazy' : 'eager'}
            onLoad={handleLoad}
            onError={handleError}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={props.style}
            title={props.title}
            id={props.id}
            draggable={props.draggable}
          />
        ) : (
          <img
            ref={imgRef}
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            loading={lazy ? 'lazy' : 'eager'}
            onLoad={handleLoad}
            onError={handleError}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={props.style}
            title={props.title}
            id={props.id}
            draggable={props.draggable}
          />
        )
      )}
    </div>
  );
}
