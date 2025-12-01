/**
 * Resource Hints Utilities
 * Provides utilities for preloading, prefetching, and preconnecting resources
 */

/**
 * Preload a resource
 * @param href - Resource URL
 * @param as - Resource type
 * @param type - MIME type (optional)
 */
export function preload(
  href: string,
  as: 'script' | 'style' | 'image' | 'font' | 'fetch',
  type?: string
): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  if (type) {
    link.type = type;
  }
  
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
}

/**
 * Prefetch a resource for future navigation
 * @param href - Resource URL
 */
export function prefetch(href: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Preconnect to an origin
 * @param origin - Origin URL
 * @param crossorigin - Whether to use CORS
 */
export function preconnect(origin: string, crossorigin: boolean = false): void {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  
  if (crossorigin) {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
}

/**
 * DNS prefetch for an origin
 * @param origin - Origin URL
 */
export function dnsPrefetch(origin: string): void {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = origin;
  document.head.appendChild(link);
}

/**
 * Preload critical fonts
 * @param fonts - Array of font URLs
 */
export function preloadFonts(fonts: string[]): void {
  fonts.forEach((font) => {
    preload(font, 'font', 'font/woff2');
  });
}

/**
 * Preload critical images
 * @param images - Array of image URLs
 */
export function preloadImages(images: string[]): void {
  images.forEach((image) => {
    preload(image, 'image');
  });
}

/**
 * Preload critical scripts
 * @param scripts - Array of script URLs
 */
export function preloadScripts(scripts: string[]): void {
  scripts.forEach((script) => {
    preload(script, 'script');
  });
}

/**
 * Preload critical styles
 * @param styles - Array of stylesheet URLs
 */
export function preloadStyles(styles: string[]): void {
  styles.forEach((style) => {
    preload(style, 'style');
  });
}

/**
 * Setup resource hints for external services
 */
export function setupExternalResourceHints(): void {
  const apiUrl = import.meta.env.VITE_API_URL;
  const wsUrl = import.meta.env.VITE_WS_URL;
  
  // Preconnect to API
  if (apiUrl) {
    try {
      const apiOrigin = new URL(apiUrl).origin;
      preconnect(apiOrigin);
    } catch {
      console.warn('Invalid API URL for preconnect:', apiUrl);
    }
  }
  
  // Preconnect to WebSocket
  if (wsUrl) {
    try {
      const wsOrigin = new URL(wsUrl).origin;
      preconnect(wsOrigin);
    } catch {
      console.warn('Invalid WebSocket URL for preconnect:', wsUrl);
    }
  }
  
  // Preconnect to Stripe
  preconnect('https://js.stripe.com');
  preconnect('https://api.stripe.com');
  
  // DNS prefetch for common CDNs
  dnsPrefetch('https://fonts.googleapis.com');
  dnsPrefetch('https://fonts.gstatic.com');
}

/**
 * Preload route-specific resources
 * @param route - Route name
 */
export function preloadRouteResources(route: string): void {
  const routeResources: Record<string, string[]> = {
    'map-editor': [
      // Preload Konva library chunks
      '/assets/js/canvas-vendor-*.js',
    ],
    'analytics': [
      // Preload chart library chunks
      '/assets/js/charts-vendor-*.js',
    ],
    'booking': [
      // Preload form and payment chunks
      '/assets/js/form-vendor-*.js',
      '/assets/js/stripe-vendor-*.js',
    ],
  };
  
  const resources = routeResources[route];
  if (resources) {
    resources.forEach((resource) => {
      prefetch(resource);
    });
  }
}

/**
 * Initialize all resource hints
 */
export function initResourceHints(): void {
  // Setup external resource hints
  setupExternalResourceHints();
  
  // Preload critical fonts (if any)
  // preloadFonts(['/fonts/inter-var.woff2']);
  
  // Preload critical images
  // preloadImages(['/logo.svg', '/hero-image.webp']);
}
