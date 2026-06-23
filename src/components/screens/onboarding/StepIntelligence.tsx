import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Download, Cpu } from '@/components/ui/icons';
import * as LobeIcons from '@lobehub/icons';

function resolveLobeIcon(name: string | undefined): any {
  if (!name || !name.trim()) return null;
  const trimmed = name.trim();
  
  // 1. Exact match
  if ((LobeIcons as any)[trimmed]) return (LobeIcons as any)[trimmed];

  // 2. Capitalized match (e.g. 'gemini' -> 'Gemini')
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  if ((LobeIcons as any)[capitalized]) return (LobeIcons as any)[capitalized];

  // 3. Case-insensitive TOC lookup
  const match = (LobeIcons.toc || []).find(
    (item: any) => item.id.toLowerCase() === trimmed.toLowerCase()
  );
  if (match && (LobeIcons as any)[match.id]) {
    return (LobeIcons as any)[match.id];
  }

  return null;
}

// Step B4: Intelligence (Agent Installation)
export function StepIntelligence({
  agents,
  installAgent,
  isInitialized,
}: {
  agents: any[];
  installAgent: (id: string) => Promise<void>;
  isInitialized: boolean;
}) {
  const [installingAll, setInstallingAll] = useState(false);
  const activeCount = agents.filter(a => a.isDefault && a.status === 'installed').length;
  const defaultAgents = agents.filter(a => a.isDefault);
  const uninstalledDefaults = defaultAgents.filter(a => a.status === 'not-installed' || a.status === 'error');

  const handleInstallAll = async () => {
    setInstallingAll(true);
    for (const agent of uninstalledDefaults) {
      try {
        await installAgent(agent.id);
      } catch (err) {
        console.error("Failed to install", agent.label, err);
      }
    }
    setInstallingAll(false);
  };

  const getAgentIcon = (agent: any) => {
    // 0. Check if the icon is a base64 string
    if (agent.icon && agent.icon.startsWith("data:image/")) {
      return (
        <img
          src={agent.icon}
          className="w-7 h-7 object-contain rounded-md"
          alt={agent.label}
        />
      );
    }

    // 1. Try matching explicitly saved icon name
    let IconComponent = resolveLobeIcon(agent.icon);
    
    // 2. Try matching the label (e.g. "Gemini" -> Gemini)
    if (!IconComponent) {
      IconComponent = resolveLobeIcon(agent.label);
    }

    // 3. Try matching the command (e.g. "gemini" -> Gemini)
    if (!IconComponent) {
      IconComponent = resolveLobeIcon(agent.command);
    }

    if (IconComponent) {
      return IconComponent.Color ? <IconComponent.Color size={28} /> : <IconComponent size={28} />;
    }

    return <Cpu size={28} className="text-[var(--accent-primary)] opacity-80" />;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold tracking-widest text-[var(--accent-primary)] uppercase">
          AI Intelligence Setup
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase select-none">
          Agent Installations
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Download, scan, and activate pre-packaged intelligence agents inside your local path binaries.
        </p>
      </div>

      {isInitialized && uninstalledDefaults.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/5 gap-4">
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-[var(--text-primary)]">Install default AI agents</span>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              {uninstalledDefaults.length} default AI agent{uninstalledDefaults.length > 1 ? 's are' : ' is'} not installed yet.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleInstallAll}
            disabled={installingAll}
            className="h-8 text-[10.5px] font-bold px-3 bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--accent-contrast)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
          >
            {installingAll ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Download size={12} />
                Install All
              </>
            )}
          </Button>
        </div>
      )}

      <div className="w-full h-[1px] bg-[var(--border-color)] opacity-20" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {defaultAgents.map((agent) => (
          <div
            key={agent.id}
            className="flex flex-col justify-between p-4 border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)]/30 hover:bg-[var(--surface-color)]/60 transition-colors gap-4 group"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 text-[var(--text-primary)] group-hover:scale-105 transition-transform duration-300">
                {getAgentIcon(agent)}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-[var(--text-primary)]">{agent.label}</span>
                <span className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed line-clamp-2">
                  {agent.description || `Pre-packaged ${agent.label} intelligence agent.`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border-color)]/30 pt-3 mt-auto">
              <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-60 truncate max-w-[100px]" title={`cmd: ${agent.command}`}>
                {agent.command}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isInitialized ? (
                  <div className="flex items-center gap-1.5 font-bold text-[10px] text-[var(--text-secondary)] uppercase">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Checking...</span>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {agent.status === 'installed' && (
                      <m.div key="inst" className="flex items-center gap-1.5 font-bold text-[10px] text-[var(--ansi-green)] uppercase">
                        <span>Installed</span>
                        <CheckCircle2 size={13} />
                      </m.div>
                    )}
                    {agent.status === 'installing' && (
                      <m.div key="instg" className="flex items-center gap-1.5 font-bold text-[10px] text-[var(--accent-primary)] uppercase">
                        <span>Installing</span>
                        <Loader2 size={13} className="animate-spin" />
                      </m.div>
                    )}
                    {agent.status === 'not-installed' && (
                      <div key="notinst" className="flex items-center gap-2">
                        {agent.installCommand ? (
                          <>
                            <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">Available</span>
                            <m.button
                              type="button"
                              onClick={() => installAgent(agent.id)}
                              className="px-2.5 py-1 text-[10px] font-bold border border-[var(--border-color)] rounded-lg bg-[var(--surface-color)] hover:border-[var(--accent-primary)]/50 hover:text-[var(--accent-primary)] transition-all flex items-center gap-1 active:scale-[0.97]"
                            >
                              <Download size={11} />
                              Install
                            </m.button>
                          </>
                        ) : (
                          <span className="text-[9px] font-bold text-[var(--ansi-red)] uppercase">Unavailable</span>
                        )}
                      </div>
                    )}
                    {agent.status === 'error' && (
                      <m.div key="err" className="flex items-center gap-2">
                        <span className="font-bold text-[9px] text-[var(--ansi-red)] uppercase">Unavailable</span>
                        <button
                          type="button"
                          onClick={() => installAgent(agent.id)}
                          className="px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--surface-color)] text-[9px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          Retry
                        </button>
                      </m.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isInitialized && (
        <div className="text-center font-mono text-[10px] text-[var(--text-secondary)] opacity-70">
          {activeCount} of {defaultAgents.length} default agents configured successfully
        </div>
      )}
    </div>
  );
}

