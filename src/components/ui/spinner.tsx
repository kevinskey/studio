import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent',
        className
      )}
      role="status"
      aria-label="loading"
    />
  );
};
