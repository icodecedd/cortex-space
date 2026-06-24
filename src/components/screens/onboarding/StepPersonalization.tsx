import { Palette, Check } from '@/components/ui/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const fontFamilies = [
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Fira Code', label: 'Fira Code' },
  { value: 'Cascadia Code', label: 'Cascadia Code' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Consolas', label: 'Consolas' },
  { value: 'Menlo', label: 'Menlo' },
  { value: 'JetBrainsMono Nerd Font', label: 'JetBrainsMono NF' },
  { value: 'FiraCode Nerd Font', label: 'FiraCode NF' },
  { value: 'Hack Nerd Font', label: 'Hack NF' },
  { value: 'MesloLGS NF', label: 'MesloLGS NF' },
  { value: 'CaskaydiaCove Nerd Font', label: 'CaskaydiaCove NF' },
  { value: 'Inconsolata Nerd Font', label: 'Inconsolata NF' },
  { value: 'SauceCodePro Nerd Font', label: 'SauceCodePro NF' },
  { value: 'monospace', label: 'System Monospace' },
];

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
  customShowFloatingHeader,
  setCustomShowFloatingHeader,
  customHeaderVisibility,
  setCustomHeaderVisibility,
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
  customShowFloatingHeader: boolean;
  setCustomShowFloatingHeader: (v: boolean) => void;
  customHeaderVisibility: 'hover' | 'always';
  setCustomHeaderVisibility: (v: 'hover' | 'always') => void;
}) {
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
              className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all text-left relative overflow-hidden ${
                selectedTheme === t.id
                  ? 'border-[var(--accent-primary)] bg-[var(--surface-color)]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                  : 'border-[var(--border-color)]/30 bg-[var(--surface-color)]/25 hover:border-[var(--border-color)]/60 hover:bg-[var(--surface-color)]/45'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex -space-x-1 shrink-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: t.dark?.accent || '#fff' }}
                  />
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: t.dark?.bg || '#000' }}
                  />
                </div>
                <span className="text-[11px] font-bold text-[var(--text-primary)] truncate">
                  {t.name}
                </span>
              </div>

              {selectedTheme === t.id && (
                <div className="w-3.5 h-3.5 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center shrink-0">
                  <Check size={8} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Layout & Font Customization */}
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
          <span className="text-xs font-bold text-[var(--text-primary)]">Editor Font</span>
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]/10">
            {/* Font Family Selection */}
            <div className="flex flex-col gap-1">
              <label htmlFor="font-family-select" className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">Family</label>
              <Select
                value={customFontFamily}
                onValueChange={setCustomFontFamily}
                size="sm"
              >
                <SelectTrigger
                  id="font-family-select"
                  className="h-9 w-full bg-white/[0.02] border-[var(--border-color)]/25 hover:border-[var(--accent-primary)]/30 focus:bg-[var(--bg-color)] focus:border-[var(--accent-primary)]/40 transition-all duration-500 rounded-lg placeholder:text-[var(--text-secondary)]/20 shadow-none font-bold"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {fontFamilies.map((f) => (
                    <SelectItem
                      key={f.value}
                      value={f.value}
                      className="cursor-pointer hover:bg-white/5 transition-all"
                    >
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size Selection */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[9px] font-bold text-[var(--text-secondary)] uppercase">
                <span>Size</span>
                <span className="text-[var(--accent-primary)]">{customFontSize}px</span>
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

      {/* 3. Terminal Header Config */}
      <div className="flex flex-col gap-3 mt-2">
        <span className="text-xs font-bold text-[var(--text-primary)]">Terminal Header Settings</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)]/20 bg-[var(--surface-color)]/10">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold">Show Floating Header</span>
              <span className="text-[10px] text-[var(--text-secondary)]">Toggle action bar on terminal panes</span>
            </div>
            <Switch
              checked={customShowFloatingHeader}
              onCheckedChange={setCustomShowFloatingHeader}
            />
          </div>

          <div className="flex flex-col gap-1.5 p-3.5 rounded-xl border border-[var(--border-color)]/20 bg-[var(--surface-color)]/10">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Header Visibility</span>
            <div className="grid grid-cols-2 gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={() => setCustomHeaderVisibility('hover')}
                disabled={!customShowFloatingHeader}
                className={`py-1.5 px-2 rounded-md font-sans text-[10px] font-bold border transition-colors ${
                  !customShowFloatingHeader
                    ? 'opacity-40 cursor-not-allowed border-[var(--border-color)]/10 text-[var(--text-secondary)]'
                    : customHeaderVisibility === 'hover'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)]'
                    : 'bg-transparent border-[var(--border-color)]/30 text-[var(--text-secondary)] hover:border-[var(--border-color)]/60'
                }`}
              >
                Reveal on Hover
              </button>
              <button
                type="button"
                onClick={() => setCustomHeaderVisibility('always')}
                disabled={!customShowFloatingHeader}
                className={`py-1.5 px-2 rounded-md font-sans text-[10px] font-bold border transition-colors ${
                  !customShowFloatingHeader
                    ? 'opacity-40 cursor-not-allowed border-[var(--border-color)]/10 text-[var(--text-secondary)]'
                    : customHeaderVisibility === 'always'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)]'
                    : 'bg-transparent border-[var(--border-color)]/30 text-[var(--text-secondary)] hover:border-[var(--border-color)]/60'
                }`}
              >
                Always Visible
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
