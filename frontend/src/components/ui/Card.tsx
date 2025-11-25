import React from 'react';
import { cn } from './utils';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  actions?: React.ReactNode;
};

export function Card({ title, actions, className, children, ...props }: CardProps) {
  return (
    <div className={cn('card p-5', className)} {...props}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h3 className="section-title">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
