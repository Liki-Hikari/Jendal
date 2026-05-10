'use client';

import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('rounded-[2rem] border border-slate-200 bg-white shadow-soft', className)} {...props}>
      {children}
    </div>
  );
}
