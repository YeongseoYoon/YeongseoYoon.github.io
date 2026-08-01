import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger';
type Size = 'md' | 'lg' | 'pill';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

/** OCP: 새 스타일이 필요하면 맵에 항목만 추가한다. 사용처는 그대로. */
const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-brand hover:bg-brand-accessible text-white',
  secondary: 'bg-black/[.05] hover:bg-black/[.08] text-ink',
  outline: 'border border-black/15 bg-white hover:bg-black/[.03] text-ink',
  danger: 'bg-negative hover:bg-negative-accessible text-white',
};

const SIZE_CLASS: Record<Size, string> = {
  md: 'h-10 px-4 rounded-lg text-sm',
  lg: 'h-14 px-8 rounded-full text-[17px]',
  pill: 'h-12 px-6 rounded-full text-[15px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
