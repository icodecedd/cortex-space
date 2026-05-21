import { FolderOpen, Grid3X3, Lock, X, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayoutType } from "@/lib/setup-constants";
import { LayoutSelector } from "../ui-parts/LayoutSelector";
import { PresetManager } from "../ui-parts/PresetManager";

interface StepWorkspaceProps {
  rootPath: string;
  setRootPath: (path: string) => void;
  isValidDir: boolean | null;
  handleBrowse: () => void;
  handleBreadcrumbClick: (index: number) => void;
  presets: { label: string; path: string }[];
  addPreset: () => void;
  removePreset: (path: string) => void;
  layout: LayoutType;
  handleLayoutChange: (layout: LayoutType) => void;
}

export function StepWorkspace({
  rootPath,
  setRootPath,
  isValidDir,
  handleBrowse,
  handleBreadcrumbClick,
  presets,
  addPreset,
  removePreset,
  layout,
  handleLayoutChange
}: StepWorkspaceProps) {
  return (
    <div>
      <section className="animate-in" style={{ marginBottom: '3rem', transitionDelay: '50ms' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FolderOpen size={16} color="var(--accent-primary)" />
          01. Define Working Directory
        </h3>

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'center', 
          background: 'rgba(255,255,255,0.03)', 
          border: `1px solid ${isValidDir === false ? '#ef4444' : 'var(--border-color)'}`, 
          padding: '0 1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem', 
          position: 'relative',
          transition: 'border-color 200ms ease'
        }}>
          <Lock size={14} color="var(--text-secondary)" />
          <input
            type="text"
            value={rootPath}
            onChange={(e) => setRootPath(e.target.value)}
            placeholder="NO DIRECTORY SELECTED / PASTE PATH"
            style={{
              padding: '0.75rem 0.5rem',
              flex: 1,
              fontSize: '0.8rem',
              background: 'transparent',
              border: 'none',
              color: rootPath ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'JetBrains Mono',
              outline: 'none'
            }}
          />
          {rootPath && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setRootPath("")}
                className="hover:text-white"
                style={{ opacity: 0.5 }}
              >
                <X size={12} />
              </Button>
              <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 0.5rem' }} />
              <Button
                variant="ghost"
                size="sm"
                className="btn-tactile"
                style={{ color: 'var(--accent-primary)', gap: '0.4rem', fontSize: '0.65rem' }}
                onClick={addPreset}
              >
                <BookmarkPlus size={14} />
                SAVE PRESET
              </Button>
             </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="btn-tactile"
            style={{ color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.05em' }}
            onClick={handleBrowse}
          >
            BROWSE
          </Button>
        </div>

        {rootPath && (
          <div
            className="animate-in"
            style={{
              marginTop: '1rem',
              fontSize: '0.65rem',
              color: 'var(--text-secondary)',
              fontFamily: 'JetBrains Mono',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.25rem',
              transitionDelay: '100ms'
            }}
          >
            {rootPath.split(/[\\/]/).filter(Boolean).map((part, i, arr) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  onClick={() => handleBreadcrumbClick(i)}
                  style={{
                    padding: '0.1rem 0.3rem',
                    border: 'none',
                    background: 'transparent',
                    color: i === arr.length - 1 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: 'inherit',
                    fontFamily: 'inherit'
                  }}
                >
                  {part.toUpperCase()}
                </button>
                {i < arr.length - 1 && <span>/</span>}
              </span>
            ))}
          </div>
        )}

        <PresetManager
          presets={presets}
          onSelect={setRootPath}
          onRemove={removePreset}
          onAdd={addPreset}
          rootPath={rootPath}
          isValidDir={isValidDir}
        />
      </section>

      <section className="animate-in" style={{ transitionDelay: '150ms' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Grid3X3 size={16} color="var(--accent-primary)" />
          02. Select Pane Layout
        </h3>
        <LayoutSelector currentLayout={layout} onLayoutChange={handleLayoutChange} />
      </section>
    </div>
  );
}
