import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className, ...props }, ref) => (
    <span ref={ref} className={`badge badge--${variant} ${className ?? ''}`.trim()} {...props} />
  ),
);

Badge.displayName = 'Badge';
