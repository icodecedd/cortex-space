import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--surface-color)",
          "--normal-text": "var(--text-primary)",
          "--normal-border": "var(--border-color)",
          "--success-bg": "var(--surface-color)",
          "--success-text": "var(--text-primary)",
          "--success-border": "var(--accent-primary)",
          "--error-bg": "var(--surface-color)",
          "--error-text": "var(--text-primary)",
          "--error-border": "#ef4444",
          "--border-radius": "var(--radius-md)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast border-[1px] shadow-2xl font-sans",
          title: "font-semibold text-sm",
          description: "text-xs opacity-70",
          actionButton: "bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold",
          cancelButton: "bg-transparent border-[var(--border-color)] text-[var(--text-secondary)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
