'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonStyles = {
  default: 'bg-emerald-600 text-white hover:bg-emerald-700',
  outline: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
  secondary: 'bg-slate-900 text-white hover:bg-slate-800',
};

const sizeStyles = {
  default: 'h-12 px-5 text-sm',
  sm: 'h-11 px-4 text-sm',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-3xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        buttonStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
