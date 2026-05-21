import { CheckCircle2, Terminal } from "lucide-react";
import { AGENT_PRESETS, PaneConfig } from "@/lib/setup-constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaneConfigCardProps {
  pane: PaneConfig;
  index: number;
  mode: 'normal' | 'agents';
  onUpdate: (id: number, command: string, isCustom?: boolean) => void;
}

export function PaneConfigCard({ pane, index, mode, onUpdate }: PaneConfigCardProps) {
  return (
    <div
      className="panel animate-in"
      style={{
        padding: '1.25rem',
        transitionDelay: `${index * 60}ms`
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono', color: 'var(--accent-primary)' }}>
          PANE {String(pane.id).padStart(2, '0')}
        </span>
        {pane.command.trim() !== "" ? (
          <CheckCircle2 size={12} className="animate-in" style={{ color: 'var(--accent-primary)' }} />
        ) : (
          <Terminal size={12} color="var(--text-secondary)" />
        )}
      </div>
      <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
        {mode === 'agents' ? 'SELECT AGENT' : 'COMMAND EXECUTION'}
      </label>

      {mode === 'agents' ? (
        <Select
          value={pane.isCustom ? "CUSTOM" : pane.command}
          onValueChange={(value) => {
            if (value === "CUSTOM") {
              onUpdate(pane.id, "", true);
            } else {
              onUpdate(pane.id, value || "", false);
            }
          }}
        >
          <SelectTrigger className="w-full bg-[#000] border-[var(--border-color)] font-mono text-[0.8rem]">
            <SelectValue placeholder="SELECT AGENT" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--surface-color)] border-[var(--border-color)]">
            {AGENT_PRESETS.map(preset => (
              <SelectItem key={preset.label} value={preset.command} className="font-mono text-[0.8rem] focus:bg-[rgba(255,255,255,0.05)] focus:text-[var(--accent-primary)]">
                {preset.label}
              </SelectItem>
            ))}
            <SelectItem value="CUSTOM" className="font-mono text-[0.8rem] focus:bg-[rgba(255,255,255,0.05)] focus:text-[var(--accent-primary)]">
              CUSTOM COMMAND...
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <input
          type="text"
          value={pane.command}
          onChange={(e) => onUpdate(pane.id, e.target.value)}
          style={{ fontSize: '0.8rem' }}
          placeholder="e.g. npm run dev"
        />
      )}

      {(mode === 'agents' && pane.isCustom) && (
         <input
         type="text"
         value={pane.command}
         onChange={(e) => onUpdate(pane.id, e.target.value)}
         style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}
         placeholder="custom agent command..."
         autoFocus
       />
      )}
    </div>
  );
}
