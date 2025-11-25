import React from 'react';
import { cn } from './utils';

type Props = {
  color?: 'green' | 'gray' | 'orange';
  children: React.ReactNode;
};

export function Badge({ color = 'gray', children }: Props) {
  const palette: Record<string, string> = {
    green: 'bg-green-100 text-green-700',
    gray: 'bg-slate-100 text-slate-700',
    orange: 'bg-orange-100 text-orange-700',
  };

  return <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', palette[color])}>{children}</span>;
}
