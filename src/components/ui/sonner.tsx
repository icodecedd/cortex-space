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
    accent: "var(--text-secondary, #A3A3A3)",
    badgeBg: "rgba(163,163,163,0.1)",
    badgeBorder: "rgba(163,163,163,0.25)",
    label: "Loading",
  },
} as const

type ToastVariant = keyof typeof TOAST_VARIANTS

// ── Graph-paper icon box + floating type badge ───────────────────────────────
//
// The badge floats above the icon box (absolute, top: -11px, centred).
// marginTop on the wrapper reserves visual space so it doesn't overlap
// the toast's own top padding.
//
// Grid pattern uses neutral rgba so it reads on both dark and light bg.
function ToastIcon({
  children,
  variant,
}: {
  children: React.ReactNode
  variant: ToastVariant
}) {
  const v = TOAST_VARIANTS[variant]

  return (
    <div
      style={{
        position: "relative",
        flexShrink: 0,
        // Push icon down slightly so the overflowing badge isn't clipped
        marginTop: 6,
      }}
    >
      {/* ── Floating type badge ── */}
      <span
        style={{
          position: "absolute",
          top: -11,
          left: "50%",
          transform: "translateX(-50%)",
          display: "inline-flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          padding: "0 6px",
          height: 15,
          lineHeight: "15px",
          borderRadius: 999,
          backgroundColor: v.badgeBg,
          color: v.accent,
          border: `1px solid ${v.badgeBorder}`,
          fontFamily:
            "'JetBrains Mono', ui-monospace, 'Cascadia Mono', 'Segoe UI Mono', monospace",
          zIndex: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {v.label}
      </span>

      {/* ── Graph-paper icon box ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: 34,
          flexShrink: 0,
          borderRadius: "var(--radius-sm, 8px)",
          border: "1px solid var(--border-color, #262626)",
          backgroundColor: "var(--surface-color, #161616)",
          // Subtle crosshatch grid — works in both dark and light themes
          backgroundImage: [
            "linear-gradient(rgba(128,128,128,0.09) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(128,128,128,0.09) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "8px 8px",
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
          "--normal-bg": "var(--surface-color)",
          "--normal-text": "var(--text-primary)",
          "--normal-border": "var(--border-color)",
          "--border-radius": "var(--radius-md)",
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
        style: {
          // Extra top padding so the badge floating above the icon box
          // has breathing room and isn't clipped by the toast boundary
          paddingTop: "16px",
          overflow: "visible",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
