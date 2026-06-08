import { Button } from "@/components/ui/button";

export function AboutTab() {
  return (
    <div className="m-0 h-full flex flex-col">
      <div className="flex flex-col items-center justify-center flex-1 py-4 text-center space-y-5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
        <div className="w-16 h-16 rounded-2xl bg-[var(--border-color)]/40 flex items-center justify-center shadow-inner border border-[var(--border-color)] p-2.5">
          <img
            src="/cortex-logo (2).png"
            alt="Cortex Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Cortex Space
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-mono">
            v0.1.0-alpha
          </p>
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] max-w-[280px] text-center leading-relaxed">
          A highly optimized, modular workspace orchestrator. Designed
          for maximum throughput and rich aesthetics.
        </p>
        <div className="pt-4 flex gap-3">
          <Button variant="outline" className="h-8 text-[11px] px-4">
            View Documentation
          </Button>
          <Button variant="outline" className="h-8 text-[11px] px-4">
            Check for Updates
          </Button>
        </div>
      </div>
    </div>
  );
}
