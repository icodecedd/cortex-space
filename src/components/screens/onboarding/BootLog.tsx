import { memo } from "react";
import type { SysCheck, CheckStatus } from "@/lib/onboarding";

export const BootLog = memo(function BootLog({
  checks,
  finished,
}: {
  checks: SysCheck[];
  finished: boolean;
}) {
  const statusColor: Record<CheckStatus, string> = {
    pending: "var(--text-secondary)",
    checking: "var(--accent-primary)",
    ok: "var(--ansi-green, #10B981)",
    warn: "var(--ansi-yellow, #F59E0B)",
    fail: "var(--ansi-red, #EF4444)",
  };

  return (
    <div
      className="rounded-lg border border-[var(--border-color)]/30 bg-[var(--bg-color)]/60 p-4 font-mono text-[11px] leading-relaxed select-none overflow-hidden"
      style={{
        fontFamily: "var(--terminal-font-family, monospace)",
        minHeight: "148px",
      }}
    >
      {checks.map((check) => (
        <div
          key={check.id}
          className="grid grid-cols-[14px_1fr] gap-1.5 transition-all duration-300"
          style={{
            color: statusColor[check.status],
            opacity: check.status === "pending" ? 0.55 : 1,
          }}
        >
          <span className="text-[var(--accent-primary)]/70">&gt;</span>
          <span>
            {check.label}...
            {check.status === "checking" && (
              <span
                className="ml-1 text-[var(--accent-primary)] animate-pulse"
                style={{ animation: "cortex-blink 1s step-end infinite" }}
              >
                _
              </span>
            )}
            {check.detail && (
              <span className="block text-[10px] text-[var(--text-secondary)] opacity-70">
                {check.detail}
              </span>
            )}
          </span>
        </div>
      ))}
      {finished && (
        <div className="grid grid-cols-[14px_1fr] gap-1.5 mt-1 text-[var(--ansi-green, #10B981)]">
          <span className="text-[var(--accent-primary)]/70">&gt;</span>
          <span>Boot sequence complete. System ready.</span>
        </div>
      )}
    </div>
  );
});
