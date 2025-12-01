/**
 * SafeLink Component
 * Secure wrapper for links with automatic security attributes
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';
import { isSafeUrl, sanitizeUrl } from '@/utils/security';
import { cn } from '@/utils/cn';

type RouterLinkOptions = Pick<LinkProps, 'reloadDocument' | 'replace' | 'state' | 'preventScrollReset' | 'relative'>;

interface SafeLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
    RouterLinkOptions {
  to: string;
  external?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * SafeLink component for internal and external links
 * Automatically adds security attributes for external links
 */
const SafeLink: React.FC<SafeLinkProps> = ({
  to,
  external = false,
  children,
  className,
  reloadDocument,
  replace,
  state,
  preventScrollReset,
  relative,
  ...props
}) => {
  // Check if URL is safe
  if (!isSafeUrl(to)) {
    console.warn('Unsafe URL blocked:', to);
    return (
      <span className={cn('cursor-not-allowed text-gray-400', className)} title="Invalid link">
        {children}
      </span>
    );
  }

  // Sanitize URL
  const safeUrl = sanitizeUrl(to);

  // Determine if link is external
  const isExternal = external || to.startsWith('http://') || to.startsWith('https://') || to.startsWith('//');

  // For internal links, use React Router Link
  if (!isExternal) {
    return (
      <Link
        to={safeUrl}
        className={className}
        reloadDocument={reloadDocument}
        replace={replace}
        state={state}
        preventScrollReset={preventScrollReset}
        relative={relative}
        {...props}
      >
        {children}
      </Link>
    );
  }

  // For external links, use anchor tag with security attributes
  return (
    <a
      href={safeUrl}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
};

export default SafeLink;

/**
 * ExternalLink component specifically for external links
 */
interface ExternalLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'> {
  href: string;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

export const ExternalLink: React.FC<ExternalLinkProps> = ({
  href,
  children,
  className,
  showIcon = false,
  ...props
}) => {
  // Check if URL is safe
  if (!isSafeUrl(href)) {
    console.warn('Unsafe URL blocked:', href);
    return (
      <span className={cn('cursor-not-allowed text-gray-400', className)} title="Invalid link">
        {children}
      </span>
    );
  }

  // Sanitize URL
  const safeUrl = sanitizeUrl(href);

  return (
    <a
      href={safeUrl}
      className={cn('inline-flex items-center gap-1', className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
      {showIcon && (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      )}
    </a>
  );
};
