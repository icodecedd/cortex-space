import * as React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "@/components/ui/icons";

export function SettingsCard({
  title,
  icon,
  description,
  children,
  onReset,
}: {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  onReset?: () => void;
}) {
  return (
    <div className="bg-[var(--surface-color)]/30 border border-[var(--border-color)]/30 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] group hover:border-[var(--accent-primary)]/20 transition-all duration-500 relative mb-5">
      {icon && (
        <div className="absolute top-0 right-0 p-1 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
          {icon}
        </div>
      )}
      
      <div className="p-5 pb-3 border-b border-[var(--border-color)]/10 bg-[var(--text-primary)]/[0.02] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            {icon && <span className="text-[var(--accent-primary)]">{icon}</span>}
            <h4 className="text-[13px] font-bold text-[var(--text-primary)]">{title}</h4>
          </div>
          {description && (
            <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed font-medium">{description}</p>
          )}
        </div>
        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-3 text-[10px] font-bold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] transition-all border border-[var(--accent-primary)]/20"
          >
            <RotateCcw size={12} className="mr-2" /> Reset
          </Button>
        )}
      </div>
      
      <div className="p-3 space-y-1">
        {children}
      </div>
    </div>
  );
}

export function SettingsRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group/row flex items-center justify-between gap-4 p-2 rounded-lg transition-all duration-300 hover:bg-[var(--text-primary)]/[0.03]">
      <div className="flex flex-col gap-0.5 min-w-0">
        <Label
          htmlFor={htmlFor}
          className="text-[13px] font-bold cursor-pointer transition-colors group-hover/row:text-[var(--text-primary)]"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </Label>
        {description && (
          <span className="text-[11px] leading-relaxed font-medium" style={{ color: "var(--text-secondary)", opacity: 0.85 }}>
            {description}
          </span>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SectionHeader({
  title,
  onReset,
}: {
  title: string;
  onReset?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3
        className="text-[11.5px] font-bold uppercase tracking-wider text-[var(--text-secondary)]/80"
      >
        {title}
      </h3>
      {onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="flex items-center gap-1 text-[10px] transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--accent-primary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-secondary)")
          }
        >
          <RotateCcw size={8} />
          Reset
        </Button>
      )}
    </div>
  );
}

export function Divider() {
  return (
    <div
      className="my-5"
      style={{ height: "1px", background: "var(--border-color)" }}
    />
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="flex rounded-lg overflow-hidden border"
      style={{ borderColor: "var(--border-color)" }}
    >
      {options.map((opt, i) => (
        <button
          key={opt.value}
          disabled={opt.disabled}
          onClick={() => !opt.disabled && onChange(opt.value)}
          className="text-[11px] font-medium px-3 py-1.5 transition-all"
          style={{
            background:
              value === opt.value
                ? "var(--accent-primary)"
                : "var(--surface-color)",
            color:
              value === opt.value
                ? "var(--accent-contrast)"
                : opt.disabled
                  ? "var(--text-secondary)"
                  : "var(--text-primary)",
            borderRight:
              i < options.length - 1 ? "1px solid var(--border-color)" : "none",
            opacity: opt.disabled ? 0.4 : 1,
            cursor: opt.disabled ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {opt.label}
          {opt.disabled && (
            <span
              className="ml-1 text-[9px]"
              style={{ color: "var(--text-secondary)" }}
            >
              soon
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
