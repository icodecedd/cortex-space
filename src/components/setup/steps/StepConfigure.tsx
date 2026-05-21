import { Cpu } from "lucide-react";
import { PaneConfig } from "@/lib/setup-constants";
import { PaneConfigCard } from "../ui-parts/PaneConfigCard";

interface StepConfigureProps {
  mode: 'normal' | 'agents';
  activePanes: PaneConfig[];
  updatePaneCommand: (id: number, command: string, isCustom?: boolean) => void;
}

export function StepConfigure({ mode, activePanes, updatePaneCommand }: StepConfigureProps) {
  return (
    <div className="animate-in">
      <h3 style={{ fontSize: '0.9rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Cpu size={16} color="var(--accent-primary)" />
        03. {mode === 'agents' ? 'Configure AI Agents' : 'Define Command Protocol'}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '1rem' }}>
        {activePanes.map((pane, index) => (
          <PaneConfigCard
            key={pane.id}
            pane={pane}
            index={index}
            mode={mode}
            onUpdate={updatePaneCommand}
          />
        ))}
      </div>
    </div>
  );
}
