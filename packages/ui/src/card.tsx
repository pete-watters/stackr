import type { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive, className, ...props }: CardProps) {
  return (
    <div
      className={`card ${interactive ? 'card--interactive' : ''} ${className ?? ''}`}
      {...props}
    />
  );
}
