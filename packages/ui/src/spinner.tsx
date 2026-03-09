import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from './lib/utils.js';

type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', className, style, ...props }, ref) => {
    const px = sizeMap[size];
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn(
          'rounded-full border-2 border-muted border-t-primary animate-spin',
          className,
        )}
        style={{
          width: px,
          height: px,
          animationDuration: '0.6s',
          ...style,
        }}
        {...props}
      />
    );
  },
);

Spinner.displayName = 'Spinner';
