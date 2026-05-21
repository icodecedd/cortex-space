import { CheckCircle2 } from "lucide-react";
import { LayoutType } from "@/lib/setup-constants";
import { getGridCols, getGridRows, getPaneCount } from "@/lib/setup-utils";

interface LayoutSelectorProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

const LAYOUT_OPTIONS: LayoutType[] = ['1x1', '1x2', '2x1', '2x2', '3x3'];

export function LayoutSelector({ currentLayout, onLayoutChange }: LayoutSelectorProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
      {LAYOUT_OPTIONS.map((l, index) => (
        <div
          key={l}
          onClick={() => onLayoutChange(l)}
          className="layout-card animate-in"
          style={{
            aspectRatio: '1',
            border: `1px solid ${currentLayout === l ? 'var(--accent-primary)' : 'var(--border-color)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: currentLayout === l ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
            position: 'relative',
            willChange: 'transform',
            transitionDelay: `${index * 40}ms`
          }}
        >
          <LayoutMiniPreview type={l} />
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono',
            color: currentLayout === l ? 'var(--accent-primary)' : 'var(--text-secondary)'
          }}>{l}</span>
          {currentLayout === l && <CheckCircle2 size={12} style={{ position: 'absolute', top: '5px', right: '5px', color: 'var(--accent-primary)' }} />}
        </div>
      ))}
    </div>
  );
}

function LayoutMiniPreview({ type }: { type: LayoutType }) {
  const cols = getGridCols(type);
  const rows = getGridRows(type);
  const count = getPaneCount(type);

  return (
    <div className="layout-mini-preview" style={{ gridTemplateColumns: cols, gridTemplateRows: rows, margin: '0 auto 0.75rem' }}>
      {Array.from({ length: count }).map((_, i) => <div key={i} />)}
    </div>
  );
}
