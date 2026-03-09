import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

export type CalloutVariant = 'info' | 'warning' | 'error' | 'success';

export interface CalloutProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CalloutVariant;
  icon?: ReactNode;
}

const variantIcons: Record<CalloutVariant, string> = {
  info: '\u2139\uFE0F',
  warning: '\u26A0\uFE0F',
  error: '\u274C',
  success: '\u2705',
};

export const Callout = forwardRef<HTMLDivElement, CalloutProps>(
  ({ variant = 'info', icon, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`callout callout--${variant} ${className ?? ''}`.trim()}
      role="alert"
      {...props}
    >
      <span className="callout-icon">{icon ?? variantIcons[variant]}</span>
      <div className="callout-content">{children}</div>
    </div>
  ),
);

Callout.displayName = 'Callout';
