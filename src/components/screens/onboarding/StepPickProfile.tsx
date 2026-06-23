import { m } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Cpu, Check } from "@/components/ui/icons";
import { PROFILES } from "@/lib/onboarding";

// ── Layout Thumbnail ──────────────────────────────────────────────────────────

export const LayoutThumbnail = ({ type }: { type: string }) => {
  if (type.includes("Grid") || type.includes("2x2")) {
    return (
      <div className="w-10 h-7 rounded border border-[var(--border-color)]/30 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5 bg-[var(--bg-color)]/40 shrink-0">
        <div className="bg-[var(--accent-primary)]/30 rounded-[1px]" />
        <div className="bg-[var(--text-secondary)]/10 rounded-[1px]" />
        <div className="bg-[var(--text-secondary)]/10 rounded-[1px]" />
        <div className="bg-[var(--text-secondary)]/10 rounded-[1px]" />
      </div>
    );
  }
  if (type.includes("1x3")) {
    return (
      <div className="w-10 h-7 rounded border border-[var(--border-color)]/30 grid grid-cols-3 gap-0.5 p-0.5 bg-[var(--bg-color)]/40 shrink-0">
        <div className="bg-[var(--accent-primary)]/30 rounded-[1px]" />
        <div className="bg-[var(--text-secondary)]/10 rounded-[1px]" />
        <div className="bg-[var(--text-secondary)]/10 rounded-[1px]" />
      </div>
    );
  }
  return (
    <div className="w-10 h-7 rounded border border-[var(--border-color)]/30 flex gap-0.5 p-0.5 bg-[var(--bg-color)]/40 shrink-0">
      <div className="w-1/3 bg-[var(--text-secondary)]/10 rounded-[1px]" />
      <div className="flex-1 bg-[var(--accent-primary)]/30 rounded-[1px]" />
    </div>
  );
};

// ── Step: Pick Starter Profile ────────────────────────────────────────────────

export function StepPickProfile({
  selected,
  onSelect,
  proShell,
  setProShell,
}: {
  selected: "zen" | "intelligence" | "pro" | "creator" | "hacker" | null;
  onSelect: (id: "zen" | "intelligence" | "pro" | "creator" | "hacker") => void;
  proShell: string;
  setProShell: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      <div className="flex flex-col gap-1.5 text-center md:text-left">
        <span className="text-[10px] font-bold tracking-widest text-[var(--accent-primary)] uppercase">
          Starter Presets
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase select-none">
          Select Starter Profile
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Choose a pre-configured template tailored to your workflow. Hover to
          inspect details.
        </p>
      </div>

      <div className="w-full h-[1px] bg-[var(--border-color)] opacity-20" />

      <div className="flex flex-col gap-4">
        {PROFILES.map((profile) => {
          const isSelected = selected === profile.id;
          return (
            <div key={profile.id} className="flex flex-col">
              <m.div
                whileHover={{ y: -2, scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                onClick={() => onSelect(profile.id)}
                className={`cursor-pointer rounded-xl border p-5 transition-all duration-300 flex flex-col gap-4 bg-[var(--surface-color)]/20 relative overflow-hidden group ${
                  isSelected
                    ? "bg-[var(--surface-color)]/60"
                    : "border-[var(--border-color)]/40 hover:bg-[var(--surface-color)]/45"
                }`}
                style={{
                  borderColor: isSelected ? profile.color : undefined,
                  boxShadow: isSelected
                    ? `0 0 16px ${profile.color}15`
                    : undefined,
                }}
              >
                {/* Accent glow on hover */}
                <div
                  className="absolute top-0 right-0 w-[120px] h-[120px] rounded-full blur-[40px] pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                  style={{ backgroundColor: profile.color }}
                />

                <div className="flex items-start justify-between gap-4 z-10">
                  <div className="flex-1 flex flex-col gap-1.5 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {profile.name}
                      </span>
                      <span
                        className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded border"
                        style={{
                          color: profile.color,
                          borderColor: `${profile.color}25`,
                          backgroundColor: `${profile.color}08`,
                        }}
                      >
                        {profile.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] opacity-80 leading-relaxed max-w-[55ch]">
                      {profile.description}
                    </p>
                  </div>

                  {/* Radio indicator */}
                  <div
                    className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-200"
                    style={{
                      borderColor: isSelected
                        ? profile.color
                        : "var(--border-color)",
                      backgroundColor: isSelected
                        ? profile.color
                        : "transparent",
                    }}
                  >
                    {isSelected && (
                      <Check
                        size={10}
                        className="text-[var(--accent-contrast)]"
                      />
                    )}
                  </div>
                </div>

                {/* Info swatch items grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[var(--border-color)]/10 pt-4 z-10 text-left">
                  {/* Theme Info with Swatch */}
                  <div className="flex items-center gap-2.5 bg-[var(--bg-color)]/10 rounded-lg p-2.5 border border-[var(--border-color)]/20 hover:bg-[var(--bg-color)]/20 transition-colors">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-sm animate-pulse"
                      style={{ backgroundColor: profile.color }}
                    />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)] opacity-50">
                        Theme Visuals
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--text-primary)]">
                        {profile.themeName}
                      </span>
                    </div>
                  </div>

                  {/* Layout Info with Mini Thumbnail */}
                  <div className="flex items-center gap-2.5 bg-[var(--bg-color)]/10 rounded-lg p-2.5 border border-[var(--border-color)]/20 hover:bg-[var(--bg-color)]/20 transition-colors">
                    <LayoutThumbnail type={profile.layoutName} />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)] opacity-50">
                        Window Grid
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--text-primary)]">
                        {profile.layoutName}
                      </span>
                    </div>
                  </div>

                  {/* Included Agents info */}
                  <div className="flex items-center gap-2.5 bg-[var(--bg-color)]/10 rounded-lg p-2.5 border border-[var(--border-color)]/20 hover:bg-[var(--bg-color)]/20 transition-colors">
                    <div className="w-6 h-6 rounded bg-[var(--surface-color)] border border-[var(--border-color)]/30 flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                      <Cpu
                        size={12}
                        className="group-hover:rotate-12 transition-transform"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)] opacity-50">
                        Preinstalled Agents
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--text-primary)] truncate">
                        {profile.includedAgentLabels.length > 0
                          ? profile.includedAgentLabels.join(", ")
                          : "None"}
                      </span>
                    </div>
                  </div>
                </div>
              </m.div>

              {/* Custom shell dropdown for power users */}
              {profile.id === "pro" && isSelected && (
                <m.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="overflow-hidden px-4"
                >
                  <div
                    className="flex flex-col gap-2 pt-3 pb-2 border-l border-r border-b rounded-b-xl bg-[var(--surface-color)]/40 px-3 transition-colors"
                    style={{ borderColor: profile.color }}
                  >
                    <label
                      htmlFor="pro-shell-input"
                      className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider text-left"
                    >
                      Terminal Shell Preference
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="pro-shell-input"
                        value={proShell}
                        onChange={(e) => setProShell(e.target.value)}
                        placeholder="e.g. powershell.exe, bash, zsh"
                        className="h-8 text-xs bg-[var(--bg-color)] border-[var(--border-color)]"
                      />
                      <div className="flex gap-1">
                        {["powershell.exe", "cmd.exe", "wsl.exe"].map((sh) => (
                          <button
                            key={sh}
                            type="button"
                            onClick={() => setProShell(sh)}
                            className={`px-2 rounded text-[9px] font-bold border transition-colors ${
                              proShell === sh
                                ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)]"
                                : "bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/35"
                            }`}
                          >
                            {sh.split(".")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </m.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
