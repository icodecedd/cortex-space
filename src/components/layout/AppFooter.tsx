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
    <footer className="h-8 bg-[var(--footer-bg)] border-t border-[var(--border-color)]/30 flex items-center justify-between flex-shrink-0 select-none z-50" style={{
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
              className="btn-tactile h-6 px-2 flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 border-none rounded cursor-pointer text-[11px] font-bold"
            >
              <Palette size={12} />
              <span>{activeThemeName}</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 bg-[var(--surface-color)] border-[var(--border-color)] animate-in p-1.5"
            style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.3), 0 0 20px rgba(0,0,0,0.2)' }}
          >
            <DropdownMenuGroup className="max-h-[300px] overflow-y-auto scrollbar-none">
              <DropdownMenuLabel
                style={{
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  padding: '0.85rem 0.85rem 0.5rem',
                  opacity: 0.9
                }}
              >
                {FOOTER_CONTENT.THEME_LABEL}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[var(--border-color)] opacity-50 mx-2 mb-1" />
              {allThemes.map(t => {
                const isActive = theme === t.id;
                return (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="focus:bg-[var(--text-primary)]/5 focus:text-[var(--accent-primary)]"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                      background: isActive ? 'rgba(var(--text-primary-rgb), 0.05)' : 'transparent',
                      cursor: 'pointer',
                      padding: '0.6rem 0.85rem',
                      margin: '0.15rem 0',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background-color 150ms ease, color 150ms ease'
                    }}
                  >
                    <span>{t.name}</span>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]" />
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
