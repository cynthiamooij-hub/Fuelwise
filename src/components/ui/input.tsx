import * as React from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'min-h-11 w-full rounded-xl border border-line bg-white/70 px-4 text-base text-deep placeholder:text-muted/70 focus-visible:border-terracotta-dark',
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('min-h-11 w-full rounded-xl border border-line bg-white/70 px-4 text-base text-deep', className)}
      {...props}
    />
  )
}
