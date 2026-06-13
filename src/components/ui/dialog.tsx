"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "@/components/ui/icons"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      asChild
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/40 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
    </DialogPrimitive.Overlay>
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  isDeep = false,
  open, // We need to pass this explicitly for AnimatePresence and depth logic
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  isDeep?: boolean // Whether this modal should trigger background recession (pushback)
  open?: boolean
}) {
  const shouldReduceMotion = useReducedMotion();

  // Notify the app about the depth level for background effects
  React.useEffect(() => {
    if (!isDeep || !open) return;
    
    const event = new CustomEvent('cortex:modal-depth-changed', { 
      detail: { isDeep: true } 
    });
    window.dispatchEvent(event);
    
    return () => {
      const cleanupEvent = new CustomEvent('cortex:modal-depth-changed', { 
        detail: { isDeep: false } 
      });
      window.dispatchEvent(cleanupEvent);
    };
  }, [isDeep, open]);

  return (
    <DialogPortal forceMount>
      <AnimatePresence>
        {open && (
          <>
            <DialogOverlay forceMount />
            <DialogPrimitive.Content
              data-slot="dialog-content"
              forceMount
              asChild
              className={cn(
                "fixed z-[51] outline-none",
                className
              )}
              {...props}
            >
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                transition={shouldReduceMotion ? { duration: 0.1 } : {
                  type: "spring",
                  stiffness: 400,
                  damping: 30
                }}
                // Standard centering for normal modals, custom might be used via className
                className={cn(
                  !className?.includes("inset-0") && "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                  "grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-2xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-border shadow-2xl",
                  className
                )}
              >
                {children}
                {showCloseButton && (
                  <DialogPrimitive.Close data-slot="dialog-close" asChild>
                    <Button
                      variant="ghost"
                      className="absolute top-2 right-2"
                      size="icon-sm"
                    >
                      <XIcon />
                      <span className="sr-only">Close</span>
                    </Button>
                  </DialogPrimitive.Close>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </>
        )}
      </AnimatePresence>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-2xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
