import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
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
  iconColor = "text-white/20",
  compact = false
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center animate-in fade-in duration-700",
      compact ? "py-8" : "py-16",
      className
    )}>
      <div className={cn(
        "rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-inner",
        compact ? "w-12 h-12 mb-4" : "w-16 h-16 mb-6",
        iconColor.replace('text-', 'bg-').replace('/40', '/5').replace('/20', '/5')
      )}>
        <Icon size={compact ? 24 : 32} className={cn("opacity-40", iconColor)} />
      </div>
      
      <h4 className={cn(
        "font-bold text-white/90 mb-2 tracking-tight",
        compact ? "text-sm" : "text-base"
      )}>
        {title}
      </h4>
      
      <p className={cn(
        "text-white/30 mb-8 leading-relaxed font-medium mx-auto",
        compact ? "text-[11px] max-w-[280px]" : "text-[12px] max-w-[340px]"
      )}>
        {description}
      </p>

      {action && (
        <Button
          variant="outline"
          size={compact ? "xs" : "sm"}
          onClick={action.onClick}
          className={cn(
            "gap-2.5 font-mono font-bold tracking-wider border-white/10 bg-white/5 hover:bg-white/10 hover:text-[var(--accent-primary)] transition-all duration-300",
            compact ? "h-7 text-[9px] px-3" : "h-9 text-[11px]"
          )}
        >
          {action.icon && <action.icon size={compact ? 12 : 16} />}
          {action.label.toUpperCase()}
        </Button>
      )}
    </div>
  )
}
