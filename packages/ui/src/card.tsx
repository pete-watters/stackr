import { type HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ interactive, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`card ${interactive ? 'card--interactive' : ''} ${className ?? ''}`.trim()}
        {...props}
      />
    );
  },
);

Card.displayName = 'Card';
