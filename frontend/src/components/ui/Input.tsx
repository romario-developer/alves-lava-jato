import React from 'react';
import { cn } from './utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      {label && <span className="font-medium">{label}</span>}
      <input
        className={cn(
          'h-10 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
