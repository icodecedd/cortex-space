import * as React from "react";
import { SectionHeader } from "../ui/SettingsUI";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Code, Trash2, Check, Plus } from "lucide-react";
import { ThemeName, ThemeDefinition } from "@/hooks/useTheme";
import { toast } from "sonner";

interface ThemesTabProps {
  theme: ThemeName;
  allThemes: ThemeDefinition[];
  resolvedScheme: 'light' | 'dark';
  setTheme: (theme: ThemeName) => void;
  addCustomTheme: (theme: ThemeDefinition) => Promise<void>;
  removeCustomTheme: (id: string) => Promise<void>;
  previewTheme: (config: ThemeDefinition) => void;
  cancelPreview: () => void;
}

function normalizeThemeInput(parsed: any): ThemeDefinition {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error("Invalid theme object");
  }
  if (!parsed.id || typeof parsed.id !== 'string') {
    throw new Error("Missing or invalid 'id' property.");
  }
  if (!parsed.name || typeof parsed.name !== 'string') {
    throw new Error("Missing or invalid 'name' property.");
  }

  if (parsed.dark && typeof parsed.dark === 'object') {
    const requiredPalette = ['bg', 'headerBg', 'footerBg', 'surface', 'border', 'textPrimary', 'textSecondary', 'accent'];
    for (const key of requiredPalette) {
      if (!parsed.dark[key]) {
        throw new Error(`Missing required theme palette property under dark: ${key}`);
      }
    }
    return {
      id: parsed.id,
      name: parsed.name,
      dark: parsed.dark,
      light: parsed.light,
      isCustom: true
    };
  } else {
    const required = ['bg', 'headerBg', 'footerBg', 'surface', 'border', 'textPrimary', 'textSecondary', 'accent'];
    for (const key of required) {
      if (!parsed[key]) {
        throw new Error(`Missing required theme property: ${key}`);
      }
    }
    return {
      id: parsed.id,
      name: parsed.name,
      dark: {
        bg: parsed.bg,
        headerBg: parsed.headerBg,
        footerBg: parsed.footerBg,
        surface: parsed.surface,
        border: parsed.border,
        textPrimary: parsed.textPrimary,
        textSecondary: parsed.textSecondary,
        accent: parsed.accent,
        ansi: parsed.ansi
      },
      light: parsed.light,
      isCustom: true
    };
  }
}

export function ThemesTab({
  theme,
  allThemes,
  resolvedScheme,
  setTheme,
  addCustomTheme,
  removeCustomTheme,
  previewTheme,
  cancelPreview,
}: ThemesTabProps) {
  const [jsonInput, setJsonInput] = React.useState("");
  const [isImporting, setIsImporting] = React.useState(false);
  const [isPreviewing, setIsPreviewing] = React.useState(false);

  // Live Preview Logic
  React.useEffect(() => {
    if (!isPreviewing || !jsonInput.trim()) {
      if (!isPreviewing) cancelPreview();
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const normalized = normalizeThemeInput(parsed);
      previewTheme(normalized);
    } catch (e) {
      // Silently fail preview for invalid JSON
    }
  }, [jsonInput, isPreviewing, previewTheme, cancelPreview]);

  const handleImportTheme = async () => {
    if (!jsonInput.trim()) return;

    try {
      const parsed = JSON.parse(jsonInput);
      const normalized = normalizeThemeInput(parsed);

      await addCustomTheme(normalized);
      toast.success("Theme Imported", { description: `Successfully added "${normalized.name}" to your library.` });
      setJsonInput("");
      setIsImporting(false);
      setIsPreviewing(false);
    } catch (err: any) {
      toast.error("Invalid Theme JSON", { description: err.message || "Please check your formatting and required keys." });
    }
  };

  const handleCopyJson = (t: ThemeDefinition) => {
    const { isCustom, ...rest } = t; // Strip internal flag
    navigator.clipboard.writeText(JSON.stringify(rest, null, 2));
    toast.success("Copied to Clipboard", { description: `Theme JSON for "${t.name}" ready to paste.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Select Theme" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsImporting(!isImporting)}
          className="h-7 text-[10px] gap-1.5 bg-[var(--text-primary)]/5 hover:bg-[var(--text-primary)]/10"
        >
          <Plus size={10} />
          Import JSON
        </Button>
      </div>

      {isImporting && (
        <Card className="border-[var(--border-color)] bg-[var(--text-primary)]/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code size={14} className="text-[var(--accent-primary)]" />
                <span className="text-[12px] font-bold">Theme JSON Payload</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold">Live Preview</span>
                  <Switch
                    checked={isPreviewing}
                    onCheckedChange={setIsPreviewing}
                    className="scale-75 origin-right"
                  />
                </div>
                <Badge variant="outline" className="text-[9px] border-[var(--border-color)] text-[var(--text-secondary)] font-bold">Standard Schema</Badge>
              </div>
            </div>
            <Textarea
              placeholder='{ "id": "my-theme", "name": "My Theme", "dark": { "bg": "#...", ... }, "light": { ... } }'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="min-h-[120px] font-mono text-[11px] bg-[var(--bg-color)]/40 border-[var(--text-primary)]/5 focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)] text-[var(--text-primary)]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setIsImporting(false); setIsPreviewing(false); cancelPreview(); }} className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancel</Button>
              <Button
                size="sm"
                onClick={handleImportTheme}
                className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] gap-1.5"
              >
                <Check size={12} />
                Add to Library
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 pb-2">
        {allThemes.map((t) => {
          const isActive = theme === t.id;
          return (
            <Card
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`group cursor-pointer transition-all hover:bg-[var(--text-primary)]/5 text-left overflow-hidden ${
                isActive
                  ? "border-[var(--accent-primary)] bg-[var(--text-primary)]/5 shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.05)]"
                  : "border-[var(--border-color)] bg-transparent"
              }`}
              style={{ padding: 0, gap: 0 }}
            >
              <CardContent
                className="flex flex-col h-full relative"
                style={{ padding: "1.25rem", gap: 0 }}
              >
                <div className="flex items-center w-full mb-4 justify-between">
                  <div className="flex -space-x-2 shrink-0">
                    {(() => {
                      const previewPalette = resolvedScheme === 'light'
                        ? (t.light || {
                            bg: "#FAFAFA",
                            surface: "#FFFFFF",
                            accent: t.dark.accent
                          })
                        : t.dark;
                      return (
                        <>
                          <div
                            className="w-6 h-6 rounded-full border-2 border-[var(--surface-color)] shadow-sm"
                            style={{ backgroundColor: previewPalette.bg || "transparent", zIndex: 3 }}
                          />
                          <div
                            className="w-6 h-6 rounded-full border-2 border-[var(--surface-color)] shadow-sm"
                            style={{ backgroundColor: previewPalette.surface || "transparent", zIndex: 2 }}
                          />
                          <div
                            className="w-6 h-6 rounded-full border-2 border-[var(--surface-color)] shadow-sm"
                            style={{ backgroundColor: previewPalette.accent || "transparent", zIndex: 1 }}
                          />
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyJson(t);
                          }}
                          className="w-6 h-6 rounded-md opacity-0 group-hover:opacity-100 text-[var(--text-secondary)]/40 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all"
                        >
                          <Code size={12} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                        Copy JSON to clipboard
                      </TooltipContent>
                    </Tooltip>
                    {t.isCustom && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomTheme(t.id);
                        }}
                        className="w-6 h-6 rounded-md opacity-0 group-hover:opacity-100 text-[var(--text-secondary)]/40 hover:text-ansi-red hover:bg-ansi-red/10 transition-all"
                      >
                        <Trash2 size={12} />
                      </Button>
                    )}
                    {isActive && (
                      <Badge
                        variant="default"
                        className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-primary)]/90 text-[9px] px-1.5 h-5 ml-1"
                      >
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col text-left mt-auto">
                  <span
                    className="text-[13px] font-bold tracking-tight"
                    style={{
                      color: isActive
                        ? "var(--accent-primary)"
                        : "var(--text-primary)",
                    }}
                  >
                    {t.name}
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)] mt-1.5 leading-relaxed line-clamp-1">
                    {t.isCustom ? "User-imported theme" : "Core Cortex preset"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
