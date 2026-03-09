import { defineRecipe } from '@pandacss/dev';

export const buttonRecipe = defineRecipe({
  className: 'button',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'semibold',
    borderRadius: 'md',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textStyle: 'label.01',
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  variants: {
    variant: {
      primary: {
        bg: 'accent.solid-default',
        color: 'white',
        _hover: { bg: 'accent.solid-hover' },
      },
      secondary: {
        bg: 'ink.component-bg-default',
        color: 'ink.text-primary',
        border: '1px solid',
        borderColor: 'ink.border-default',
        _hover: { bg: 'ink.component-bg-hover' },
      },
      ghost: {
        bg: 'transparent',
        color: 'ink.text-primary',
        _hover: { bg: 'ink.component-bg-hover' },
      },
      danger: {
        bg: 'error.solid-default',
        color: 'white',
        _hover: { opacity: 0.9 },
      },
    },
    size: {
      sm: { px: 'space.03', py: 'space.01', fontSize: 'sm' },
      md: { px: 'space.04', py: 'space.02', fontSize: 'md' },
      lg: { px: 'space.05', py: 'space.03', fontSize: 'lg' },
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export const cardRecipe = defineRecipe({
  className: 'card',
  base: {
    bg: 'ink.component-bg-default',
    borderRadius: 'lg',
    border: '1px solid',
    borderColor: 'ink.border-subtle',
    p: 'space.04',
  },
  variants: {
    interactive: {
      true: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        _hover: { borderColor: 'accent.border' },
      },
    },
  },
});

export const inputRecipe = defineRecipe({
  className: 'input',
  base: {
    width: '100%',
    bg: 'ink.bg-primary',
    color: 'ink.text-primary',
    border: '1px solid',
    borderColor: 'ink.border-default',
    borderRadius: 'md',
    px: 'space.03',
    py: 'space.02',
    textStyle: 'body.02',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    _focus: { borderColor: 'accent.solid-default' },
    _placeholder: { color: 'ink.text-muted' },
  },
});

export const badgeRecipe = defineRecipe({
  className: 'badge',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    px: 'space.02',
    py: 'space.01',
    borderRadius: 'round',
    textStyle: 'caption.01',
    fontWeight: 'medium',
  },
  variants: {
    variant: {
      default: {
        bg: 'ink.component-bg-default',
        color: 'ink.text-secondary',
      },
      success: {
        bg: 'success.bg-subtle',
        color: 'success.text',
      },
      warning: {
        bg: 'warning.bg-subtle',
        color: 'warning.text',
      },
      error: {
        bg: 'error.bg-subtle',
        color: 'error.text',
      },
      info: {
        bg: 'accent.bg-subtle',
        color: 'accent.text',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export const skeletonRecipe = defineRecipe({
  className: 'skeleton',
  base: {
    bg: 'ink.component-bg-default',
    animation: 'shimmer 1.5s ease-in-out infinite',
  },
});

export const spinnerRecipe = defineRecipe({
  className: 'spinner',
  base: {
    borderRadius: 'round',
    border: '2px solid',
    borderColor: 'ink.border-subtle',
    borderTopColor: 'accent.solid-default',
    animation: 'spin 0.6s linear infinite',
  },
  variants: {
    size: {
      sm: { width: '16px', height: '16px' },
      md: { width: '24px', height: '24px' },
      lg: { width: '32px', height: '32px' },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const recipes = {
  button: buttonRecipe,
  card: cardRecipe,
  input: inputRecipe,
  badge: badgeRecipe,
  skeleton: skeletonRecipe,
  spinner: spinnerRecipe,
};
