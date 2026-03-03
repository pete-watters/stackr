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
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  variants: {
    variant: {
      primary: {
        bg: 'accent',
        color: 'white',
        _hover: { bg: 'accent.hover' },
      },
      secondary: {
        bg: 'bg.secondary',
        color: 'text.primary',
        border: '1px solid',
        borderColor: 'border',
        _hover: { bg: 'bg.card' },
      },
      ghost: {
        bg: 'transparent',
        color: 'text.primary',
        _hover: { bg: 'bg.secondary' },
      },
    },
    size: {
      sm: { px: '3', py: '1.5', fontSize: 'sm' },
      md: { px: '4', py: '2', fontSize: 'md' },
      lg: { px: '6', py: '3', fontSize: 'lg' },
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
    bg: 'bg.card',
    borderRadius: 'lg',
    border: '1px solid',
    borderColor: 'border',
    p: '4',
  },
  variants: {
    interactive: {
      true: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        _hover: { borderColor: 'accent' },
      },
    },
  },
});

export const inputRecipe = defineRecipe({
  className: 'input',
  base: {
    width: '100%',
    bg: 'bg.input',
    color: 'text.primary',
    border: '1px solid',
    borderColor: 'border',
    borderRadius: 'md',
    px: '3',
    py: '2',
    fontSize: 'md',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    _focus: { borderColor: 'accent' },
    _placeholder: { color: 'text.muted' },
  },
});

export const recipes = {
  button: buttonRecipe,
  card: cardRecipe,
  input: inputRecipe,
};
