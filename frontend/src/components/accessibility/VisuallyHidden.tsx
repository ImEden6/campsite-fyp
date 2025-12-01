import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@/utils/cn';

type VisuallyHiddenProps<C extends ElementType = 'span'> = {
  as?: C;
  children: ReactNode;
} & ComponentPropsWithoutRef<C>;

/**
 * VisuallyHidden component hides content visually but keeps it accessible to screen readers
 * Useful for providing additional context to assistive technologies
 */
const VisuallyHidden = <C extends ElementType = 'span'>({
  children,
  as,
  className,
  ...rest
}: VisuallyHiddenProps<C>) => {
  const Component = (as ?? 'span') as ElementType;

  return (
    <Component className={cn('sr-only', className)} {...rest}>
      {children}
    </Component>
  );
};

export default VisuallyHidden;
