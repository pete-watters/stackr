import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { cn } from './lib/utils.js';

export interface ItemLayoutProps extends HTMLAttributes<HTMLDivElement> {
  titleLeft: ReactNode;
  titleRight?: ReactNode;
  captionLeft?: ReactNode;
  captionRight?: ReactNode;
}

export const ItemLayout = forwardRef<HTMLDivElement, ItemLayoutProps>(
  ({ titleLeft, titleRight, captionLeft, captionRight, className, ...props }, ref) => (
    <div ref={ref} className={cn('flex w-full items-start justify-between', className)} {...props}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="font-medium">{titleLeft}</div>
        {captionLeft && <div className="text-xs text-muted-foreground">{captionLeft}</div>}
      </div>
      {(titleRight || captionRight) && (
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          {titleRight && <div className="font-medium">{titleRight}</div>}
          {captionRight && <div className="text-xs text-muted-foreground">{captionRight}</div>}
        </div>
      )}
    </div>
  ),
);

ItemLayout.displayName = 'ItemLayout';
