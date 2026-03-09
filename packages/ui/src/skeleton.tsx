import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ width, height = '1em', borderRadius = 4, className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={`skeleton ${className ?? ''}`.trim()}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  ),
);

Skeleton.displayName = 'Skeleton';
