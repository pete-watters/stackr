import { type InputHTMLAttributes, forwardRef } from 'react';
import * as Label from '@radix-ui/react-label';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="input-group">
        {label && (
          <Label.Root className="input-label" htmlFor={inputId}>
            {label}
          </Label.Root>
        )}
        <input ref={ref} id={inputId} className={`input ${className ?? ''}`.trim()} {...props} />
        {error && (
          <span className="input-error" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
