import * as React from "react";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Trash2, Check, Plus, Code, Palette } from "@/components/ui/icons";
import { ThemeName, ThemeDefinition } from "@/hooks/useTheme";
import { toast } from "sonner";

import { ViewMode } from "@/components/ui/view-toggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface ThemesTabProps {
  theme: ThemeName;
  allThemes: ThemeDefinition[];
  resolvedScheme: "light" | "dark";
  setTheme: (theme: ThemeName) => void;
  addCustomTheme: (theme: ThemeDefinition) => Promise<void>;
  removeCustomTheme: (id: string) => Promise<void>;
  previewTheme: (config: ThemeDefinition) => void;
  cancelPreview: () => void;
  searchQuery: string;
  viewMode: ViewMode;
  isAdding: boolean;
  setIsAdding: (adding: boolean) => void;
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

function normalizeThemeInput(parsed: any): ThemeDefinition {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid theme object");
  }
  if (!parsed.id || typeof parsed.id !== "string") {
    throw new Error("Missing or invalid 'id' property.");
  }
  if (!parsed.name || typeof parsed.name !== "string") {
    throw new Error("Missing or invalid 'name' property.");
  }

  if (parsed.dark && typeof parsed.dark === "object") {
    const requiredPalette = ["bg", "headerBg", "footerBg", "surface", "border", "textPrimary", "textSecondary", "accent"];
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
      isCustom: true,
    };
  } else if (parsed.light && typeof parsed.light === "object") {
    const requiredPalette = ["bg", "headerBg", "footerBg", "surface", "border", "textPrimary", "textSecondary", "accent"];
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
      isCustom: true,
    };
  } else {
    const required = ["bg", "headerBg", "footerBg", "surface", "border", "textPrimary", "textSecondary", "accent"];
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
        ansi: parsed.ansi,
      },
      light: parsed.light,
      isCustom: true,
      isLegacy: true,
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
  searchQuery,
  viewMode,
  isAdding,
  setIsAdding,
  activeSubTab,
  onSubTabChange,
}: ThemesTabProps) {
  const [jsonInput, setJsonInput] = React.useState("");
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
      toast.success(`${normalized.name} created successfully`, {
        description: "The theme has been added to your library.",
      });
      setJsonInput("");
      setIsAdding(false);
      setIsPreviewing(false);
    } catch (err: any) {
      toast.error("Failed to create Theme", {
        description: "Check your JSON formatting and required keys.",
      });
    }
  };

  const handleCopyJson = (t: ThemeDefinition) => {
    const { isCustom, ...rest } = t; // Strip internal flag
    navigator.clipboard.writeText(JSON.stringify(rest, null, 2));
    toast.success(`${t.name} copied successfully`, {
      description: "The theme JSON is ready to paste.",
    });
  };

  const activeThemes = useMemo(() => allThemes, [allThemes]);

  const customThemes = useMemo(
    () => allThemes.filter((t: ThemeDefinition) => t.isCustom),
    [allThemes]
  );

  const filtered = useMemo(() => {
    const list = activeSubTab === "custom" ? customThemes : activeThemes;
    return list.filter(
      (t: ThemeDefinition) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (THEME_DESCRIPTIONS[t.id] || "User-created theme").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeSubTab, activeThemes, customThemes, searchQuery]);

  const renderContent = () => {
    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={Palette}
          title={searchQuery ? "No Themes Found" : activeSubTab === "custom" ? "No Custom Themes" : "No Themes Installed"}
          description={
            searchQuery
              ? `No themes matching "${searchQuery}" were found.`
              : activeSubTab === "custom"
              ? "Create your own theme JSON schema to add custom palettes."
              : "No interface themes available."
          }
          iconColor="text-[var(--accent-primary)]/40"
          action={
            !searchQuery && activeSubTab === "custom"
              ? {
                  label: "Create Theme",
                  onClick: () => setIsAdding(true),
                  icon: Plus,
                }
              : undefined
          }
          compact
        />
      );
    }

    if (viewMode === "card") {
      return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filtered.map((t: ThemeDefinition) => {
            const isActive = theme === t.id;
            return (
              <Card
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "group/theme cursor-pointer transition-all hover:bg-[var(--text-primary)]/[0.04] text-left overflow-hidden border",
                  isActive
                    ? "border-[var(--accent-primary)] bg-[var(--text-primary)]/5 shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.05)]"
                    : "border-[var(--border-color)] bg-[var(--text-primary)]/[0.02]"
                )}
              >
                <CardContent className="flex flex-row items-center p-4 gap-4">
                  {/* Visual Palette Representation */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--bg-color)]/40 shrink-0 border border-[var(--border-color)]/10">
                    <div className="flex gap-0.5">
                      {(() => {
                        const previewPalette = (() => {
                          if (t.light && t.dark) {
                            return resolvedScheme === "light" ? t.light : t.dark;
                          }
                          if (t.light) return t.light;
                          if (t.dark) {
                            if (resolvedScheme === "light" && t.isLegacy) {
                              return {
                                bg: "#FAFAFA",
                                surface: "#FFFFFF",
                                accent: t.dark.accent,
                              };
                            }
                            return t.dark;
                          }
                          return {
                            bg: "#FAFAFA",
                            surface: "#FFFFFF",
                            accent: "#000000",
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

                  {/* Name and Metadata */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[13px] font-bold tracking-tight truncate"
                        style={{
                          color: isActive ? "var(--accent-primary)" : "var(--text-primary)",
                        }}
                      >
                        {t.name}
                      </span>
                      {isActive && (
                        <Badge
                          variant="default"
                          className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-primary)]/90 text-[8px] px-1.5 h-4"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 leading-tight line-clamp-2">
                      {t.isCustom ? "User-created theme" : THEME_DESCRIPTIONS[t.id] || "Core Cortex preset"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
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
                      <TooltipContent side="bottom" className="text-xs">
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
                        <TooltipContent side="bottom" className="text-[10px]">
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
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Name</TableHead>
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Description</TableHead>
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Type</TableHead>
            <TableHead className="w-24 text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((t: ThemeDefinition) => {
            const isActive = theme === t.id;
            return (
              <TableRow
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "cursor-pointer transition-all",
                  isActive
                    ? "bg-[var(--accent-primary)]/[0.02] hover:bg-[var(--accent-primary)]/[0.04]"
                    : "text-[var(--text-secondary)]/70 hover:bg-[var(--text-primary)]/[0.02]"
                )}
              >
                <TableCell>
                  <Palette size={14} className={isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]/50"} />
                </TableCell>
                <TableCell>
                  <span className={cn("text-[12px] font-bold", isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]")}>
                    {t.name}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] leading-relaxed">
                    {t.isCustom ? "User-created theme" : THEME_DESCRIPTIONS[t.id] || "Core preset theme"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-[10px] font-medium tracking-tight opacity-75">
                    {t.isCustom ? "Custom" : "Preset"}
                  </span>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-[var(--text-secondary)]/50 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5"
                      onClick={() => handleCopyJson(t)}
                    >
                      <Copy size={12} />
                    </Button>
                    {t.isCustom && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-[var(--text-secondary)]/50 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => removeCustomTheme(t.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      {isAdding && (
        <Card className="bg-[var(--accent-primary)]/[0.03] border border-[var(--accent-primary)]/20 ring-0 shadow-none p-5 animate-in fade-in slide-in-from-top-2 duration-300 text-left">
          <CardContent className="p-0 space-y-4">
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
                <Badge variant="outline" className="text-[9px] border-[var(--border-color)] text-[var(--text-secondary)] font-bold">
                  Standard Schema
                </Badge>
              </div>
            </div>
            <Textarea
              placeholder='{ "id": "my-theme", "name": "My Theme", "dark": { "bg": "#...", ... }, "light": { ... } }'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="min-h-[140px] font-mono text-[11px] bg-[var(--bg-color)]/40 border-[var(--border-color)]/25 focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)] text-[var(--text-primary)]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setIsPreviewing(false);
                  cancelPreview();
                }}
                className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleImportTheme}
                className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] font-bold h-8"
              >
                <Check size={12} className="mr-1.5" />
                Import Theme
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={activeSubTab}
        onValueChange={onSubTabChange}
        className="space-y-4"
      >
        <div className="flex items-center justify-between mb-2">
          <TabsList className="bg-[var(--text-primary)]/[0.03]">
            <TabsTrigger
              value="all"
              className="text-[11px] font-bold tracking-wider"
            >
              All ({activeThemes.length})
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              className="text-[11px] font-bold tracking-wider"
            >
              Custom ({customThemes.length})
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={() => setIsAdding(!isAdding)}
            className="h-8 px-4 text-[11px] font-bold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:opacity-90 rounded-md transition-all flex gap-2"
          >
            <Plus
              size={14}
              strokeWidth={3}
              className={cn(
                "transition-transform duration-300",
                isAdding && "rotate-45"
              )}
            />{" "}
            {isAdding ? "Cancel" : "Import Theme"}
          </Button>
        </div>

        <TabsContent value="all">{renderContent()}</TabsContent>
        <TabsContent value="custom">{renderContent()}</TabsContent>
      </Tabs>
    </div>
  );
}
