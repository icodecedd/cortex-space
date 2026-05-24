import { Palette } from "lucide-react";
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
import { ThemeName } from "@/hooks/useTheme";

interface AppFooterProps {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

export function AppFooter({ theme, setTheme }: AppFooterProps) {
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
              className="btn-tactile h-6 px-2 flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] rounded cursor-pointer text-[11px]"
            >
              <Palette size={12} />
              <span>{theme.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 bg-[var(--surface-color)] border-[var(--border-color)] animate-in p-1.5"
            style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  padding: '0.75rem 0.85rem 0.5rem',
                }}
              >
                Interface Theme
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[var(--border-color)] opacity-50 mx-2 mb-1" />
              {(['ayu', 'catppuccin', 'iceberg', 'nvim', 'monochrome', 'soft-monochrome', 'cortex'] as ThemeName[]).map(t => {
                const isActive = theme === t;
                return (
                  <DropdownMenuItem
                    key={t}
                    onClick={() => setTheme(t)}
                    style={{
                      fontSize: '0.75rem',
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                      background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                      cursor: 'pointer',
                      padding: '0.6rem 0.85rem',
                      margin: '0.15rem 0',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <span>{t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                    {theme === t && (
                      <div className="w-1 h-1 rounded-full bg-[var(--accent-primary)] shadow-[0_0_4px_var(--accent-primary)]" />
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
}
