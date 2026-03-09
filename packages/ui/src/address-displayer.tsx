import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';

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
        className={`address-displayer ${className ?? ''}`.trim()}
        style={{ fontFamily: 'monospace', display: 'inline-flex', flexWrap: 'wrap', gap: '0.25em' }}
        {...props}
      >
        {chunks.map((chunk, i) => (
          <span key={i} style={{ opacity: i % 2 === 0 ? 1 : 0.5 }}>
            {chunk}
          </span>
        ))}
      </div>
    );
  },
);

AddressDisplayer.displayName = 'AddressDisplayer';
