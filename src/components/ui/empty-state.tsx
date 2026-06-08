import { IconType } from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface EmptyStateProps {
  icon: IconType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: IconType;
  };
  className?: string;
  iconColor?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconColor = "text-[var(--text-secondary)]",
  compact = false
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center animate-in fade-in duration-700",
      "w-full h-full min-h-[160px] rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--text-primary)]/[0.01]",
      compact ? "p-6" : "p-10",
      className
    )}>
      <div className={cn(
        "rounded-xl bg-[var(--text-primary)]/[0.03] border border-[var(--border-color)]/50 flex items-center justify-center mb-4 shadow-sm relative overflow-hidden",
        compact ? "w-10 h-10" : "w-14 h-14"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--text-primary)]/5 via-transparent to-transparent opacity-50" />
        <Icon size={compact ? 16 : 24} className={cn("opacity-70 z-10", iconColor)} />
      </div>
      
      <h4 className={cn(
        "font-semibold text-[var(--text-primary)] mb-1.5 tracking-tight",
        compact ? "text-[12px]" : "text-[14px]"
      )}>
        {title}
      </h4>
      
      <p className={cn(
        "text-[var(--text-secondary)] font-medium mx-auto",
        action ? "mb-5" : "mb-0",
        compact ? "text-[11px] max-w-[240px] leading-snug" : "text-[12px] max-w-[320px] leading-relaxed"
      )}>
        {description}
      </p>

      {action && (
        <Button
          variant="outline"
          size={compact ? "xs" : "sm"}
          onClick={action.onClick}
          className={cn(
            "gap-2 font-semibold tracking-wide border-[var(--border-color)] bg-[var(--text-primary)]/5 hover:bg-[var(--text-primary)]/10 hover:text-[var(--text-primary)] transition-all duration-300 shadow-sm",
            compact ? "h-7 text-[10px] px-3 rounded-md" : "h-9 text-[11px] px-4 rounded-md"
          )}
        >
          {action.icon && <action.icon size={compact ? 12 : 14} className="opacity-70" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
