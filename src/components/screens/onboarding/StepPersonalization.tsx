import { Palette, Check } from '@/components/ui/icons';
import { useTheme } from '@/hooks/useTheme';

// Step B5: Personalization
export function StepPersonalization({
  allThemes,
  selectedTheme,
  setSelectedTheme,
  customFontSize,
  setCustomFontSize,
  customFontFamily,
  setCustomFontFamily,
  customLayout,
  setCustomLayout,
}: {
  allThemes: any[];
  selectedTheme: string;
  setSelectedTheme: (v: string) => void;
  customFontSize: number;
  setCustomFontSize: (v: number) => void;
  customFontFamily: string;
  setCustomFontFamily: (v: string) => void;
  customLayout: 'grid' | 'count';
  setCustomLayout: (v: 'grid' | 'count') => void;
}) {
  const { previewTheme, cancelPreview } = useTheme();

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl text-left">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold tracking-widest text-[var(--accent-primary)] uppercase">
          Custom: Appearance
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase select-none">
          Personalize Space
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Adjust visual themes in real time, set layout dimensions, and configure code editor fonts.
        </p>
      </div>

      <div className="w-full h-[1px] bg-[var(--border-color)] opacity-20" />

      {/* 1. Theme grid */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
          <Palette size={13} /> Visual Theme Color
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {allThemes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTheme(t.id)}
              onMouseEnter={() => previewTheme(t)}
              onMouseLeave={cancelPreview}
              className={`flex flex-col items-start p-2.5 rounded-xl border transition-all text-left relative overflow-hidden ${
                selectedTheme === t.id
                  ? 'border-[var(--accent-primary)] bg-[var(--surface-color)]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                  : 'border-[var(--border-color)] bg-[var(--surface-color)]/20 hover:border-[var(--border-color)]/80 hover:bg-[var(--surface-color)]/40'
              }`}
            >
              <span className="text-[11px] font-bold text-[var(--text-primary)] truncate max-w-full">
                {t.name}
              </span>
              
              {/* Color swatches */}
              <div className="flex gap-1 mt-2.5">
                <div className="w-3.5 h-3.5 rounded border border-white/5" style={{ backgroundColor: t.dark?.bg || '#000' }} />
                <div className="w-3.5 h-3.5 rounded border border-white/5" style={{ backgroundColor: t.dark?.accent || '#fff' }} />
                <div className="w-3.5 h-3.5 rounded border border-white/5" style={{ backgroundColor: t.dark?.surface || '#222' }} />
              </div>

              {selectedTheme === t.id && (
                <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center">
                  <Check size={8} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Layout selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-[var(--text-primary)]">Layout Mode</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCustomLayout('grid')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                customLayout === 'grid'
                  ? 'border-[var(--accent-primary)] bg-[var(--surface-color)]/60'
                  : 'border-[var(--border-color)] bg-[var(--surface-color)]/20 hover:border-[var(--border-color)]/70'
              }`}
            >
              {/* Mock Grid graphic */}
              <div className="grid grid-cols-2 gap-0.5 w-9 h-7 border border-[var(--border-color)] p-0.5 rounded bg-[var(--bg-color)]/60">
                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xs" />
                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xs" />
                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xs" />
                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xs" />
              </div>
              <span className="text-[10px] font-bold">Grid Layout</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomLayout('count')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                customLayout === 'count'
                  ? 'border-[var(--accent-primary)] bg-[var(--surface-color)]/60'
                  : 'border-[var(--border-color)] bg-[var(--surface-color)]/20 hover:border-[var(--border-color)]/70'
              }`}
            >
              {/* Mock Flex graphic */}
              <div className="flex flex-col gap-0.5 w-9 h-7 border border-[var(--border-color)] p-0.5 rounded bg-[var(--bg-color)]/60">
                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xs flex-1" />
                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xs flex-1" />
              </div>
              <span className="text-[10px] font-bold">Flex Layout</span>
            </button>
          </div>
        </div>

        {/* Font customization */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-[var(--text-primary)]">Monospace Font</span>
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]/10">
            {/* Font Family Selection */}
            <div className="flex flex-col gap-1">
              <label htmlFor="font-family-select" className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">Family</label>
              <select
                id="font-family-select"
                value={customFontFamily}
                onChange={(e) => setCustomFontFamily(e.target.value)}
                className="h-7 text-[10px] font-mono rounded bg-[var(--bg-color)] border-[var(--border-color)] py-0 text-[var(--text-primary)]"
              >
                <option value="JetBrains Mono">JetBrains Mono</option>
                <option value="Geist Mono">Geist Mono</option>
                <option value="Fira Code">Fira Code</option>
                <option value="Consolas">Consolas</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>

            {/* Font Size Selection */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[9px] font-bold text-[var(--text-secondary)] uppercase">
                <span>Size</span>
                <span className="font-mono text-[var(--accent-primary)]">{customFontSize}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="18"
                step="1"
                value={customFontSize}
                onChange={(e) => setCustomFontSize(parseInt(e.target.value, 10))}
                className="accent-[var(--accent-primary)] h-1 cursor-pointer w-full bg-[var(--surface-color)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
