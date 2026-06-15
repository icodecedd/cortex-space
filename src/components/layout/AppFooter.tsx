import * as React from "react";
import { Palette } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { ThemeName, ThemeDefinition } from "@/hooks/useTheme";
import { FOOTER_CONTENT } from "@/lib/content";
import { cn } from "@/lib/utils";

interface AppFooterProps {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  allThemes: ThemeDefinition[];
}

export const AppFooter = React.memo(({ theme, setTheme, allThemes }: AppFooterProps) => {
  const activeThemeName = allThemes.find(t => t.id === theme)?.name || theme;

  return (
    <footer className="h-8 bg-[var(--bg-color)] border-t border-white/5 flex items-center justify-between flex-shrink-0 select-none z-50 px-4">
      {/* Left Side: Dynamic Status & Info (Asymmetric) */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-ansi-green shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          <span className="text-[9px] font-black font-mono text-[var(--text-secondary)] uppercase tracking-[0.2em] opacity-50">
            System Operational
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-4 text-[9px] font-bold font-mono text-[var(--text-secondary)] opacity-30">
          <div className="w-px h-3 bg-white/10" />
          <span className="tracking-tighter">NODE_ENV: PRODUCTION</span>
          <div className="w-px h-3 bg-white/10" />
          <span className="tracking-tighter">PID: 7729</span>
        </div>
      </div>

      {/* Right Side: Theme Switcher & Actions */}
      <div className="flex items-center gap-4">
        <div className="w-px h-4 bg-white/10" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="xs"
              className="h-6 px-3 flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 border-none rounded-lg cursor-pointer text-[10px] font-black tracking-[0.1em] uppercase transition-all"
            >
              <Palette size={12} className="opacity-50" />
              <span className="tracking-tight">{activeThemeName}</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 bg-[var(--surface-color)]/90 backdrop-blur-2xl border-white/10 animate-in p-2 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] rounded-2xl"
          >
            <DropdownMenuGroup className="max-h-[320px] overflow-y-auto scrollbar-none">
              <DropdownMenuLabel
                className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-[0.25em] p-3 opacity-40"
              >
                {FOOTER_CONTENT.THEME_LABEL}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5 mx-2 mb-1" />
              {allThemes.map(t => {
                const isActive = theme === t.id;
                return (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer text-xs font-bold",
                      isActive ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" : "text-[var(--text-primary)] hover:bg-white/5"
                    )}
                  >
                    <span className="tracking-tight">{t.name}</span>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(var(--accent-primary-rgb),0.8)]" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </footer>
  );
});
