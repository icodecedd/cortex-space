import * as React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

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
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex flex-col gap-0.5 min-w-0">
        <Label
          htmlFor={htmlFor}
          className="text-[13px] font-medium cursor-pointer"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </Label>
        {description && (
          <span className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
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
        className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]"
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
