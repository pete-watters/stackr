import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

export interface ItemLayoutProps extends HTMLAttributes<HTMLDivElement> {
  titleLeft: ReactNode;
  titleRight?: ReactNode;
  captionLeft?: ReactNode;
  captionRight?: ReactNode;
}

export const ItemLayout = forwardRef<HTMLDivElement, ItemLayoutProps>(
  ({ titleLeft, titleRight, captionLeft, captionRight, className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={`item-layout ${className ?? ''}`.trim()}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        ...style,
      }}
      {...props}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
        <div style={{ fontWeight: 500 }}>{titleLeft}</div>
        {captionLeft && <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{captionLeft}</div>}
      </div>
      {(titleRight || captionRight) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '2px',
            flexShrink: 0,
          }}
        >
          {titleRight && <div style={{ fontWeight: 500 }}>{titleRight}</div>}
          {captionRight && <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{captionRight}</div>}
        </div>
      )}
    </div>
  ),
);

ItemLayout.displayName = 'ItemLayout';
