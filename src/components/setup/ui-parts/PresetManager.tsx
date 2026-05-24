import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PresetManagerProps {
  presets: { label: string; path: string }[];
  onSelect: (path: string) => void;
  onRemove: (path: string) => void;
  onAdd: () => void;
  rootPath: string;
  isValidDir: boolean | null;
}

export function PresetManager({ presets, onSelect, onRemove, onAdd, rootPath, isValidDir }: PresetManagerProps) {
  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: 700 }}>SAVED PRESETS</div>
      
      {presets.length === 0 ? (
        <div style={{ 
          border: '1px dashed var(--border-color)', 
          borderRadius: 'var(--radius-md)', 
          padding: '2rem', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>NO PRESETS CONFIGURED</div>
          <Button 
            variant="outline" 
            size="xs" 
            onClick={onAdd} 
            className="btn-tactile" 
            style={{ fontSize: '0.6rem' }}
            disabled={!rootPath || isValidDir === false}
          >
            {rootPath ? "SAVE CURRENT AS PRESET" : "DEFINE DIRECTORY TO START"}
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {presets.map((preset, index) => (
            <div 
              key={preset.path} 
              className="animate-in group" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '0.3rem 0.4rem 0.3rem 1rem',
                transition: 'all 200ms ease',
                transitionDelay: `${index * 40}ms`
              }}
            >
              <Button
                variant="ghost"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => onSelect(preset.path)}
                style={{
                  fontSize: '0.65rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                  marginRight: '0.75rem'
                }}
              >
                {preset.label}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-[22px] h-[22px] rounded-full hover:bg-[rgba(255,255,255,0.1)] hover:text-[var(--text-primary)]"
                onClick={() => onRemove(preset.path)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: 'var(--text-secondary)'
                }}
              >
                <X size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
