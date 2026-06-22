import { useColorScheme } from "@/hooks/useColorScheme"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "@/components/ui/icons"

// ── Per-variant color + label config ────────────────────────────────────────
const TOAST_VARIANTS = {
  success: {
    accent: "#22c55e",
    badgeBg: "rgba(34,197,94,0.12)",
    badgeBorder: "rgba(34,197,94,0.28)",
    label: "Success",
  },
  info: {
    accent: "#3b82f6",
    badgeBg: "rgba(59,130,246,0.12)",
    badgeBorder: "rgba(59,130,246,0.28)",
    label: "Info",
  },
  warning: {
    accent: "#f59e0b",
    badgeBg: "rgba(245,158,11,0.12)",
    badgeBorder: "rgba(245,158,11,0.28)",
    label: "Warning",
  },
  error: {
    accent: "#ef4444",
    badgeBg: "rgba(239,68,68,0.12)",
    badgeBorder: "rgba(239,68,68,0.28)",
    label: "Error",
  },
  loading: {
    accent: "var(--accent-primary, #FF66B2)",
    badgeBg: "rgba(255,102,178,0.12)",
    badgeBorder: "rgba(255,102,178,0.28)",
    label: "Loading",
  },
} as const

type ToastVariant = keyof typeof TOAST_VARIANTS

// ── App-style icon box + status dot badge ───────────────────────────────
function ToastIcon({
  children,
  variant,
}: {
  children: React.ReactNode
  variant: ToastVariant
}) {
  const v = TOAST_VARIANTS[variant]
  const { resolvedScheme } = useColorScheme()
  const isLight = resolvedScheme === "light"

  return (
    <div
      data-icon=""
      style={{
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* ── Status dot indicator ── */}
      <span
        style={{
          position: "absolute",
          top: -2,
          right: -2,
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: v.accent,
          boxShadow: `0 0 6px ${v.accent}`,
          border: `1.5px solid ${isLight ? "#ffffff" : "#0f0f11"}`,
          zIndex: 2,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      {/* ── iOS-style app icon box ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: "8px",
          border: isLight ? "1px solid rgba(0, 0, 0, 0.06)" : "1px solid rgba(255, 255, 255, 0.05)",
          background: isLight ? "linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%)" : "linear-gradient(135deg, #2a2a2a 0%, #161616 100%)",
          color: v.accent,
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Toaster ──────────────────────────────────────────────────────────────────
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedScheme } = useColorScheme()

  return (
    <Sonner
      theme={resolvedScheme as ToasterProps["theme"]}
      className="toaster group"
      closeButton={true}
      icons={{
        success: (
          <ToastIcon variant="success">
            <CircleCheckIcon className="size-4" />
          </ToastIcon>
        ),
        info: (
          <ToastIcon variant="info">
            <InfoIcon className="size-4" />
          </ToastIcon>
        ),
        warning: (
          <ToastIcon variant="warning">
            <TriangleAlertIcon className="size-4" />
          </ToastIcon>
        ),
        error: (
          <ToastIcon variant="error">
            <OctagonXIcon className="size-4" />
          </ToastIcon>
        ),
        loading: (
          <ToastIcon variant="loading">
            <Loader2Icon className="size-4 animate-spin" />
          </ToastIcon>
        ),
      }}
      style={
        {
          zIndex: 10000,
          pointerEvents: "auto",
          // Keep Cortex Space's design tokens as Sonner CSS vars
          "--normal-bg": resolvedScheme === "light" ? "#ffffff" : "#0f0f11",
          "--normal-text": "var(--text-primary)",
          "--normal-border": resolvedScheme === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)",
          "--border-radius": "12px",
          "--toast-padding": "16px",
          "--toast-gap": "16px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          // Style the native action button to match the deliverable's inline
          // action button aesthetic (ghost, mono label, accent on hover)
          actionButton: "cn-toast-action",
          cancelButton: "cn-toast-cancel",
        },
      }}
      {...props}
    />
  )
}


export { Toaster }
