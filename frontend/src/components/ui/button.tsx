import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'default' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground shadow-sm hover:bg-blue-700 active:bg-blue-800',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-slate-200 dark:hover:bg-slate-700',
  outline: 'border border-input bg-card hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-red-700',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 rounded-lg px-3 text-sm',
  default: 'h-10 rounded-lg px-4 py-2 text-sm',
  lg: 'h-12 rounded-xl px-6 text-base',
  icon: 'h-10 w-10 rounded-lg',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      className,
      variant = 'default',
      size = 'default',
      isLoading = false,
      disabled = false,
      children,
      onClick,
      tabIndex,
      type,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    const isDisabled = disabled || isLoading;

    return (
      <Component
        ref={ref}
        aria-busy={isLoading || undefined}
        aria-disabled={asChild && isDisabled ? true : undefined}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          isDisabled && asChild && 'pointer-events-none opacity-50',
          className,
        )}
        disabled={asChild ? undefined : isDisabled}
        onClick={(event) => {
          if (isDisabled) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        tabIndex={asChild && isDisabled ? -1 : tabIndex}
        type={asChild ? undefined : (type ?? 'button')}
        {...props}
      >
        {isLoading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
        <Slottable>{children}</Slottable>
      </Component>
    );
  },
);
Button.displayName = 'Button';
