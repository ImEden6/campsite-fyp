/**
 * Image Optimization Utilities
 * Provides utilities for optimizing image loading and rendering
 */

/**
 * Generate srcset for responsive images
 * @param baseUrl - Base URL of the image
 * @param widths - Array of widths to generate
 * @returns srcset string
 */
export function generateSrcSet(baseUrl: string, widths: number[]): string {
  return widths
    .map((width) => `${baseUrl}?w=${width} ${width}w`)
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 * @param breakpoints - Object mapping breakpoints to sizes
 * @returns sizes string
 */
export function generateSizes(breakpoints: Record<string, string>): string {
  return Object.entries(breakpoints)
    .map(([breakpoint, size]) => {
      if (breakpoint === 'default') {
        return size;
      }
      return `(min-width: ${breakpoint}) ${size}`;
    })
    .join(', ');
}

/**
 * Lazy load image with Intersection Observer
 * @param img - Image element
 * @param src - Image source URL
 */
export function lazyLoadImage(img: HTMLImageElement, src: string): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement;
          image.src = src;
          image.classList.remove('lazy');
          observer.unobserve(image);
        }
      });
    });

    observer.observe(img);
  } else {
    // Fallback for browsers without IntersectionObserver
    img.src = src;
  }
}

/**
 * Preload critical images
 * @param urls - Array of image URLs to preload
 */
export function preloadImages(urls: string[]): void {
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Convert image to WebP format (client-side)
 * @param file - Image file
 * @param quality - Quality (0-1)
 * @returns Promise with WebP blob
 */
export async function convertToWebP(
  file: File,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not convert image to WebP'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => reject(new Error('Could not load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress image before upload
 * @param file - Image file
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @param quality - Quality (0-1)
 * @returns Promise with compressed blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not compress image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Could not load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get optimal image format based on browser support
 * @returns Preferred image format
 */
export function getOptimalImageFormat(): 'webp' | 'jpeg' {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  // Check WebP support
  const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  
  return supportsWebP ? 'webp' : 'jpeg';
}

/**
 * Calculate image dimensions to fit container while maintaining aspect ratio
 * @param imageWidth - Original image width
 * @param imageHeight - Original image height
 * @param containerWidth - Container width
 * @param containerHeight - Container height
 * @returns Calculated dimensions
 */
export function calculateImageDimensions(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number
): { width: number; height: number } {
  const imageRatio = imageWidth / imageHeight;
  const containerRatio = containerWidth / containerHeight;

  let width: number;
  let height: number;

  if (imageRatio > containerRatio) {
    // Image is wider than container
    width = containerWidth;
    height = containerWidth / imageRatio;
  } else {
    // Image is taller than container
    height = containerHeight;
    width = containerHeight * imageRatio;
  }

  return { width, height };
}

/**
 * Create a blur placeholder for progressive image loading
 * @param src - Image source URL
 * @param width - Placeholder width
 * @param height - Placeholder height
 * @returns Promise with data URL
 */
export async function createBlurPlaceholder(
  src: string,
  width: number = 20,
  height: number = 20
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.filter = 'blur(10px)';
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL());
    };

    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}
