import { Layout, ListView } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type ViewMode = 'card' | 'table';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn("flex items-center gap-0.5 bg-[var(--text-primary)]/[0.03] rounded-lg p-0.5 border border-[var(--border-color)]/50", className)}>
      <button
        onClick={() => onChange('card')}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all duration-200",
          value === 'card'
            ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-sm"
            : "text-[var(--text-secondary)]/60 hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5"
        )}
      >
        <Layout size={13} />
        Cards
      </button>
      <button
        onClick={() => onChange('table')}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all duration-200",
          value === 'table'
            ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-sm"
            : "text-[var(--text-secondary)]/60 hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5"
        )}
      >
        <ListView size={13} />
        Table
      </button>
    </div>
  );
}
