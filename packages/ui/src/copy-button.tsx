'use client';

import { type ButtonHTMLAttributes, forwardRef, useState, useCallback } from 'react';
import { cn } from './lib/utils.js';

export interface CopyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  text: string;
  label?: string;
  copiedLabel?: string;
}

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ text, label = 'Copy', copiedLabel = 'Copied!', className, ...props }, ref) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback silently fails
      }
    }, [text]);

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleCopy}
        className={cn(
          'text-xs text-primary hover:text-primary/80 bg-transparent border-none cursor-pointer transition-colors',
          className,
        )}
        aria-label={copied ? copiedLabel : label}
        {...props}
      >
        {copied ? copiedLabel : label}
      </button>
    );
  },
);

CopyButton.displayName = 'CopyButton';
