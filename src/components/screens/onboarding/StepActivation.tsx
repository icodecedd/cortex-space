import { useState, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Settings, ChevronDown, ChevronRight } from '@/components/ui/icons';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import type { Agent } from '@/lib';
import type { FlowMode, Profile } from '@/lib/onboarding';
import { LayoutThumbnail } from './StepPickProfile';

// Step: Activation (Final Review — used by both flows)
export function StepActivation({
  path,
  setupLabel,
  themeName,
  layoutName,
  shellName,
  agentSummary,
  flowMode,
  profile,
  agents,
}: {
  path: string;
  setupLabel: string;
  themeName: string;
  layoutName: string;
  shellName: string;
  agentSummary: string;
  flowMode: FlowMode;
  profile: Profile | null;
  agents: Agent[];
}) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const includedAgents = useMemo(() => {
    if (!profile) return [];
    return profile.includedAgentIds
      .map((id) => agents.find((agent) => agent.id === id))
      .filter((agent): agent is Agent => Boolean(agent));
  }, [agents, profile]);

  const summaryRows = [
    ['Setup Type', setupLabel],
    ['Workspace Directory', path || 'System Default (~/)'],
    ['Visual Theme', themeName],
    ['Workspace Layout', layoutName],
    ['Shell Type', shellName || 'Auto Detect System'],
    ['Included Agents', agentSummary],
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl text-left">
      <div className="flex flex-col gap-1.5 text-center md:text-left">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ansi-green)] uppercase flex items-center gap-1 justify-center md:justify-start">
          <ShieldCheck size={11} /> Ready to Activate
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase select-none">
          {flowMode === 'starter' ? 'Configuration Receipt' : 'Configuration Summary'}
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          {flowMode === 'starter'
            ? 'Review your starter pack details below. Expand the details block if you want to inspect raw variables.'
            : 'Verify your custom configuration details below. Your workspace will launch directly with these parameters.'}
        </p>
      </div>

      <div className="w-full h-[1px] bg-[var(--border-color)] opacity-20" />

      {flowMode === 'starter' && profile ? (
        /* Scannable 3-column receipt (Theme, Agents, Layout) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-2xl border border-[var(--border-color)]/30 bg-[var(--surface-color)]/10 p-5 divide-y md:divide-y-0 md:divide-x divide-[var(--border-color)]/25">

          {/* Column 1: Theme */}
          <div className="flex flex-col gap-3 pb-4 md:pb-0 md:pr-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] opacity-55">
              01 / Visual Theme
            </span>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: profile.color }}
              />
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {profile.themeName}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] opacity-70 leading-relaxed">
              The pack will configure your UI colors and appearance presets to match the {profile.themeName} theme style.
            </p>
          </div>

          {/* Column 2: Agents */}
          <div className="flex flex-col gap-3 pt-4 md:pt-0 md:px-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] opacity-55">
              02 / Intelligence Pack
            </span>
            {includedAgents.length === 0 ? (
              <div className="text-[11px] text-[var(--text-secondary)] opacity-60 italic">
                No additional agent installations in this pack.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {includedAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between gap-2 bg-[var(--bg-color)]/20 p-2 rounded border border-[var(--border-color)]/10">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-[var(--text-primary)] truncate">{agent.label}</span>
                      <span className="text-[8px] font-mono text-[var(--text-secondary)] opacity-60 truncate">{agent.command}</span>
                    </div>
                    <span className="text-[8px] font-mono font-bold uppercase shrink-0" style={{
                      color: agent.status === 'installed' ? 'var(--ansi-green, #10B981)' : 'var(--accent-primary)'
                    }}>
                      {agent.status === 'installed' ? 'Installed' : 'To Install'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Layout & Shell */}
          <div className="flex flex-col gap-3 pt-4 md:pt-0 md:pl-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] opacity-55">
              03 / Grid Layout
            </span>
            <div className="flex items-center gap-3">
              <LayoutThumbnail type={profile.layoutName} />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[var(--text-primary)]">
                  {profile.layoutName}
                </span>
                <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-60">
                  Shell: {profile.shellValue || profile.shellLabel}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] opacity-70 leading-relaxed">
              Your startup panes will arrange in a {profile.layoutName} running system command triggers.
            </p>
          </div>

        </div>
      ) : (
        /* Default Custom Review Table */
        <div className="flex flex-col border border-[var(--border-color)] rounded-xl bg-[var(--bg-color)]/20 divide-y divide-[var(--border-color)]/30 overflow-hidden font-mono text-xs">
          {summaryRows.map(([key, val]) => (
            <div key={key} className="flex justify-between items-center p-3 gap-4">
              <span className="text-[var(--text-secondary)] opacity-60 font-bold">{key}</span>
              <span className="text-[var(--text-primary)] text-right break-all">{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Accordion for Configuration Summary (Only visible in Starter Flow as a collapsed detail drawer) */}
      {flowMode === 'starter' && (
        <div className="border border-[var(--border-color)]/30 rounded-lg bg-[var(--surface-color)]/20 overflow-hidden w-full">
          <button
            type="button"
            onClick={() => setIsSummaryOpen(!isSummaryOpen)}
            className="w-full flex items-center justify-between p-3 font-bold text-[10px] uppercase tracking-wider text-[var(--text-secondary)] hover:bg-[var(--surface-color)]/40 transition-colors select-none"
          >
            <div className="flex items-center gap-1.5 font-bold">
              <Settings size={12} className={isSummaryOpen ? 'text-[var(--accent-primary)] animate-pulse' : ''} />
              <span>Show Raw Configuration Summary</span>
            </div>
            {isSummaryOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          <AnimatePresence initial={false}>
            {isSummaryOpen && (
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden border-t border-[var(--border-color)]/20"
              >
                <div className="flex flex-col bg-[var(--bg-color)]/20 divide-y divide-[var(--border-color)]/30 font-mono text-[10px]">
                  {summaryRows.map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center p-2.5 gap-4">
                      <span className="text-[var(--text-secondary)] opacity-60 font-bold">{key}</span>
                      <span className="text-[var(--text-primary)] text-right break-all">{val}</span>
                    </div>
                  ))}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="text-[10px] text-[var(--text-secondary)] opacity-55 leading-relaxed bg-[var(--surface-color)]/30 border border-[var(--border-color)]/25 rounded-lg p-3">
        Your settings are stored locally in settings.json. You can alter these parameters at any time by triggering the global configuration panel (<KbdGroup className="gap-0.5"><Kbd>Cmd</Kbd><Kbd>,</Kbd></KbdGroup> or <KbdGroup className="gap-0.5"><Kbd>Ctrl</Kbd><Kbd>,</Kbd></KbdGroup>).
      </div>
    </div>
  );
}
