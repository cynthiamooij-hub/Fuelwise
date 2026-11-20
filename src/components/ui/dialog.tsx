import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { title: string; description?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-deep/40" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-x-4 bottom-4 z-50 mx-auto max-h-[90dvh] max-w-lg overflow-y-auto rounded-3xl bg-surface p-6 shadow-xl sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2',
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="pr-10 font-serif text-2xl text-deep">{title}</DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="mt-2 text-muted">{description}</DialogPrimitive.Description>
        ) : (
          <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        )}
        <div className="mt-5">{children}</div>
        <DialogPrimitive.Close
          className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full text-deep hover:bg-fill"
          aria-label="Close"
        >
          <X className="size-5" aria-hidden />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
