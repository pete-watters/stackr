import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from './lib/utils.js';

export interface AddressDisplayerProps extends HTMLAttributes<HTMLDivElement> {
  address: string;
  chunkSize?: number;
}

export const AddressDisplayer = forwardRef<HTMLDivElement, AddressDisplayerProps>(
  ({ address, chunkSize = 4, className, ...props }, ref) => {
    const chunks: string[] = [];
    for (let i = 0; i < address.length; i += chunkSize) {
      chunks.push(address.slice(i, i + chunkSize));
    }

    return (
      <div
        ref={ref}
        className={cn('inline-flex flex-wrap gap-1 font-mono text-sm', className)}
        {...props}
      >
        {chunks.map((chunk, i) => (
          <span key={i} className={i % 2 === 0 ? 'opacity-100' : 'opacity-50'}>
            {chunk}
          </span>
        ))}
      </div>
    );
  },
);

AddressDisplayer.displayName = 'AddressDisplayer';
