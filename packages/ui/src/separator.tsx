import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';

export const Separator = forwardRef<
  ElementRef<typeof SeparatorPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={`separator separator--${orientation} ${className ?? ''}`.trim()}
    {...props}
  />
));
Separator.displayName = 'Separator';
