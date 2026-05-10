'use client';

import type { ChangeEventHandler, ComponentType, SVGProps } from 'react';
import { cn } from '@/lib/utils';

interface InputProps {
  label: string;
  type?: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  action?: {
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    label: string;
    onClick: () => void;
  };
}

export function Input({ label, type = 'text', value, onChange, placeholder, icon: Icon, action }: InputProps) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="flex items-center justify-between text-sm font-semibold text-slate-800">{label}</span>
      <div className="mt-2 flex min-h-12 items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
        {Icon && <Icon className="h-5 w-5 text-slate-400" />}
        <input
          className={cn('min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none')}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={action.label}
          >
            <action.icon className="h-5 w-5" />
          </button>
        )}
      </div>
    </label>
  );
}
