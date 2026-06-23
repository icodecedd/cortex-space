import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[18px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-zinc-300 dark:data-unchecked:bg-zinc-800/80 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-[size=default]:pl-[2px] data-[size=sm]:pl-[2px]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full transition-all group-data-[size=default]/switch:h-[14px] group-data-[size=default]/switch:w-[18px] group-data-[size=sm]/switch:h-[10px] group-data-[size=sm]/switch:w-[13px] group-data-[size=default]/switch:data-checked:translate-x-[10px] group-data-[size=sm]/switch:data-checked:translate-x-[7px] group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 bg-white dark:bg-zinc-400 data-checked:bg-[var(--bg-color)] dark:data-checked:bg-[var(--bg-color)]"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
