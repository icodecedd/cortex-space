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

interface AppFooterProps {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  allThemes: ThemeDefinition[];
}

export const AppFooter = React.memo(({ theme, setTheme, allThemes }: AppFooterProps) => {
  const activeThemeName = allThemes.find(t => t.id === theme)?.name || theme;

  return (
    <footer className="h-8 bg-[var(--footer-bg)] border-t border-[var(--border-color)] flex items-center justify-between flex-shrink-0 select-none z-50" style={{
      paddingLeft: "8px",
      paddingRight: "8px",
    }}>
      {/* Left Side: Empty */}
      <div className="flex items-center gap-1.5" />

      {/* Right Side: Theme Switcher */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="xs"
              className="h-6 px-3 flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 border-none rounded-md cursor-pointer text-[10px] font-bold tracking-wider uppercase transition-all"
            >
              <Palette size={12} />
              <span>{activeThemeName}</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 bg-[var(--surface-color)]/95 backdrop-blur-xl border-[var(--border-color)] animate-in p-2 shadow-2xl rounded-xl"
          >
            <DropdownMenuGroup className="max-h-[300px] overflow-y-auto scrollbar-none">
              <DropdownMenuLabel
                style={{
                  fontSize: '9px',
                  color: 'var(--text-secondary)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  padding: '0.5rem 0.75rem',
                  opacity: 0.6
                }}
              >
                {FOOTER_CONTENT.THEME_LABEL}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[var(--text-primary)]/10 mx-2 mb-1" />
              {allThemes.map(t => {
                const isActive = theme === t.id;
                return (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="focus:bg-[var(--text-primary)]/5 focus:text-[var(--accent-primary)] rounded-lg"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                      background: isActive ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'transparent',
                      cursor: 'pointer',
                      padding: '0.5rem 0.75rem',
                      margin: '0.1rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 200ms ease'
                    }}
                  >
                    <span>{t.name}</span>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(var(--accent-primary-rgb),0.8)] animate-pulse" />
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
