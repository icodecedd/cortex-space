import * as React from "react";
import { SettingsCard } from "../shared/SettingsUI";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Trash2, Check, Plus, Code, Palette } from "@/components/ui/icons";
import { ThemeName, ThemeDefinition } from "@/hooks/useTheme";
import { toast } from "sonner";
import { motion, Variants } from "framer-motion";

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
  } else if (parsed.light && typeof parsed.light === 'object') {
    const requiredPalette = ['bg', 'headerBg', 'footerBg', 'surface', 'border', 'textPrimary', 'textSecondary', 'accent'];
    for (const key of requiredPalette) {
      if (!parsed.light[key]) {
        throw new Error(`Missing required theme palette property under light: ${key}`);
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
      isCustom: true,
      isLegacy: true
    };
  }
}

const THEME_DESCRIPTIONS: Record<string, string> = {
  claude: "Anthropic's warm, organic paper-like aesthetic.",
  cursor: "A deep, modern dark mode inspired by AI code editors.",
  cortex: "The original high-contrast neon-pop experience.",
  tokyo: "A vibrant, neon-lit theme inspired by Tokyo at night.",
  nord: "An arctic, north-bluish clean and focused palette.",
  catppuccin: "A soothing, high-productivity pastel color scheme.",
  caffeine: "A warm, earthy workspace inspired by morning coffee.",
};

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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  };

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
      toast.success(`${normalized.name} created successfully`, { description: "The theme has been added to your library." });
      setJsonInput("");
      setIsImporting(false);
      setIsPreviewing(false);
    } catch (err: any) {
      toast.error("Failed to create Theme", { description: "Check your JSON formatting and required keys." });
    }
  };

  const handleCopyJson = (t: ThemeDefinition) => {
    const { isCustom, ...rest } = t; // Strip internal flag
    navigator.clipboard.writeText(JSON.stringify(rest, null, 2));
    toast.success(`${t.name} copied successfully`, { description: "The theme JSON is ready to paste." });
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-0 pb-10 pr-2"
    >
      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Interface Themes" 
          icon={<Palette size={16} />}
          description="Choose from our curated themes or create your own."
        >
          <div className="flex flex-col gap-6 px-1 pt-2 pb-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                Library
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsImporting(!isImporting)}
                className="h-7 text-[10px] gap-1.5 bg-[var(--accent-primary)]/5 hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold"
              >
                <Plus size={10} strokeWidth={3} />
                Create Theme
              </Button>
            </div>

            {isImporting && (
              <Card className="border-[var(--border-color)] bg-[var(--bg-color)]/20 animate-in fade-in slide-in-from-top-2 duration-300 mx-1">
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
                    className="min-h-[120px] font-mono text-[11px] bg-[var(--bg-color)]/40 border-[var(--border-color)]/20 focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)] text-[var(--text-primary)]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setIsImporting(false); setIsPreviewing(false); cancelPreview(); }} className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancel</Button>
                    <Button
                      size="sm"
                      onClick={handleImportTheme}
                      className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] font-bold h-8"
                    >
                      <Check size={12} className="mr-1.5" />
                      Add to Library
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-1">
              {allThemes.map((t) => {
                const isActive = theme === t.id;
                return (
                  <Card
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`group/theme cursor-pointer transition-all hover:bg-[var(--text-primary)]/[0.04] text-left overflow-hidden border ${
                      isActive
                        ? "border-[var(--accent-primary)] bg-[var(--text-primary)]/5 shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.05)]"
                        : "border-[var(--border-color)] bg-[var(--text-primary)]/[0.02]"
                    }`}
                  >
                    <CardContent className="flex flex-row items-center p-3 gap-4">
                      {/* The Icon Container */}
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--bg-color)]/40 shrink-0 border border-[var(--border-color)]/10">
                        {/* The Pills */}
                        <div className="flex gap-0.5">
                          {(() => {
                            const previewPalette = (() => {
                              if (t.light && t.dark) {
                                return resolvedScheme === 'light' ? t.light : t.dark;
                              }
                              if (t.light) return t.light;
                              if (t.dark) {
                                if (resolvedScheme === 'light' && t.isLegacy) {
                                  return {
                                    bg: "#FAFAFA",
                                    surface: "#FFFFFF",
                                    accent: t.dark.accent
                                  };
                                }
                                return t.dark;
                              }
                              return {
                                bg: "#FAFAFA",
                                surface: "#FFFFFF",
                                accent: "#000000"
                              };
                            })();
                            return (
                              <>
                                <div
                                  className="w-2.5 h-5 rounded-full border border-[var(--surface-color)] shadow-sm"
                                  style={{ backgroundColor: previewPalette.bg || "transparent" }}
                                />
                                <div
                                  className="w-2.5 h-5 rounded-full border border-[var(--surface-color)] shadow-sm"
                                  style={{ backgroundColor: previewPalette.surface || "transparent" }}
                                />
                                <div
                                  className="w-2.5 h-5 rounded-full border border-[var(--surface-color)] shadow-sm"
                                  style={{ backgroundColor: previewPalette.accent || "transparent" }}
                                />
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* The Text Block */}
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[13px] font-bold tracking-tight truncate"
                            style={{
                              color: isActive
                                ? "var(--accent-primary)"
                                : "var(--text-primary)",
                            }}
                          >
                            {t.name}
                          </span>
                          {isActive && (
                            <Badge
                              variant="default"
                              className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-primary)]/90 text-[8px] px-1 h-3.5"
                            >
                              Active
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 leading-tight line-clamp-2">
                          {t.isCustom ? "User-created theme" : (THEME_DESCRIPTIONS[t.id] || "Core Cortex preset")}
                        </span>
                      </div>

                      {/* Actions */}
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
                              className="w-7 h-7 rounded-md text-[var(--text-secondary)]/40 opacity-0 group-hover/theme:opacity-100 transition-all hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
                            >
                              <Copy size={12} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                            Copy JSON
                          </TooltipContent>
                        </Tooltip>
                        {t.isCustom && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCustomTheme(t.id);
                                }}
                                className="w-7 h-7 text-[var(--text-secondary)]/60 opacity-0 group-hover/theme:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                              >
                                <Trash2 size={12} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={4} className="text-[10px] bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                              Delete Theme
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </SettingsCard>
      </motion.div>
    </motion.div>
  );
}
