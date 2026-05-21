import { CheckCircle2 } from "lucide-react";
import { LayoutType, PaneConfig } from "@/lib/setup-constants";
import { getGridCols, getGridRows } from "@/lib/setup-utils";

interface StepPreviewProps {
  rootPath: string;
  layout: LayoutType;
  activePanes: PaneConfig[];
}

export function StepPreview({ rootPath, layout, activePanes }: StepPreviewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{ fontSize: '0.9rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
        <CheckCircle2 size={16} color="var(--accent-primary)" />
        04. Final Protocol Validation
      </h3>

      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="panel animate-in" style={{ padding: '1.5rem', transitionDelay: '100ms' }}>
          <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>SUMMARY</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>DIRECTORY</div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>{rootPath || "NOT DEFINED"}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>LAYOUT GRID</div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>{layout}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>ACTIVE AGENTS</div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>{activePanes.length} PROCESSES</div>
            </div>
          </div>
        </div>

        {/* VISUAL GRID MINI-MAP */}
        <div className="animate-in" style={{ transitionDelay: '200ms' }}>
          <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>VIRTUAL PREVIEW</h4>
          <div style={{
            aspectRatio: '1',
            background: 'var(--border-color)',
            display: 'grid',
            gap: '2px',
            padding: '2px',
            gridTemplateColumns: getGridCols(layout),
            gridTemplateRows: getGridRows(layout)
          }}>
            {activePanes.map((pane, i) => (
              <div
                key={pane.id}
                className="animate-in"
                style={{
                  background: 'var(--bg-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transitionDelay: `${i * 50}ms`,
                  padding: '0.5rem',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  fontSize: '0.5rem',
                  fontFamily: 'JetBrains Mono',
                  color: 'var(--text-secondary)',
                  textAlign: 'center'
                }}>
                  <div style={{ color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>P {pane.id}</div>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                    {pane.command || "---"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
