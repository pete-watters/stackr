import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './lib/utils.js';

const calloutVariants = cva('flex gap-3 rounded-lg border p-4', {
  variants: {
    variant: {
      info: 'border-ring/30 bg-ring/10 text-ring',
      warning: 'border-warning/30 bg-warning/10 text-warning',
      error: 'border-destructive/30 bg-destructive/10 text-destructive',
      success: 'border-success/30 bg-success/10 text-success',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

export type CalloutVariant = 'info' | 'warning' | 'error' | 'success';

export interface CalloutProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof calloutVariants> {
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
    <div ref={ref} className={cn(calloutVariants({ variant, className }))} role="alert" {...props}>
      <span className="shrink-0">{icon ?? variantIcons[variant!]}</span>
      <div className="min-w-0">{children}</div>
    </div>
  ),
);

Callout.displayName = 'Callout';
