import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const buttonStyles = cva(
  'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed',
  {
    variants: {
      intent: {
        primary: 'bg-primary text-white hover:bg-slate-900 focus:ring-primary',
        secondary: 'bg-secondary text-slate-900 hover:bg-green-500 focus:ring-secondary',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-11 px-5 text-base',
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'md',
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export function Button({ className, intent, size, ...props }: ButtonProps) {
  return <button className={cn(buttonStyles({ intent, size, className }))} {...props} />;
}
