import { CheckCircle2, Terminal } from "lucide-react";
import { AGENT_PRESETS, PaneConfig } from "@/lib/setup-constants";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";

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
  <Combobox
    items={AGENT_PRESETS}
    value={pane.command}
    onValueChange={(val) => {
      if (val) {
        const isPreset = AGENT_PRESETS.some(p => p.command === val);
        onUpdate(pane.id, val as string, !isPreset);
      }
    }}
  >
    <ComboboxInput
      placeholder="Select or type agent command..."
      className="font-mono bg-[rgba(255,255,255,0.02)] border-[var(--border-color)]"
      style={{ fontSize: '0.8rem' }}
    />
    <ComboboxContent
      className="bg-[var(--surface-color)] border-[var(--border-color)]"
      style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}
    >
      <ComboboxEmpty>No agents found.</ComboboxEmpty>
      <ComboboxList>
        {(preset: { label: string, command: string }) => (
          <ComboboxItem
            key={preset.label}
            value={preset.command}
            className="flex items-center justify-between gap-4 font-mono text-[0.75rem]"
          >
            <span>{preset.label}</span>
            <span className="text-[0.6rem] opacity-40">
              {preset.command}
            </span>
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  </Combobox>
) : (
        <Input
          type="text"
          value={pane.command}
          onChange={(e) => {
            onUpdate(pane.id, e.target.value, true);
          }}
          style={{ fontSize: '0.8rem' }}
          placeholder={
            pane.id === 1 ? "e.g. npm run dev" :
            pane.id === 2 ? "e.g. npm run start" :
            pane.id === 3 ? "e.g. ls -la" :
            pane.id === 4 ? "e.g. git status" :
            "e.g. command..."
          }
          className="w-full font-mono bg-[rgba(255,255,255,0.02)] border-[var(--border-color)]"
        />
      )}
    </div>
  );
}


