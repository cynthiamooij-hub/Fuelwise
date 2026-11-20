import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

/** 44px tall hit area around a 28px track. */
export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'relative inline-flex h-11 w-16 shrink-0 cursor-pointer items-center rounded-full before:absolute before:inset-x-1 before:h-7 before:rounded-full before:bg-line before:transition-colors data-[state=checked]:before:bg-olive',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="relative z-10 ml-2 block size-5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-7" />
    </SwitchPrimitive.Root>
  )
}
