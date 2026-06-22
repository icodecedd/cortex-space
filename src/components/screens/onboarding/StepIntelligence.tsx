import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Cpu, CheckCircle2, Loader2, Download
} from '@/components/ui/icons';

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

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl">
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

      {!isInitialized ? (
        <div className="flex items-center justify-center p-8 border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-color)]/20 gap-3">
          <Loader2 size={16} className="animate-spin text-[var(--accent-primary)]" />
          <span className="font-mono text-xs text-[var(--text-secondary)]">Scanning agent repositories...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {agents.filter(a => a.isDefault).map((agent) => (
            <div
              key={agent.id}
              className="flex items-center justify-between p-3.5 border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)]/30 hover:bg-[var(--surface-color)]/60 transition-colors gap-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  agent.status === 'installed' 
                    ? 'bg-[var(--ansi-green)]/10 text-[var(--ansi-green)]' 
                    : 'bg-[var(--surface-color)] text-[var(--text-secondary)]'
                }`}>
                  <Cpu size={15} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{agent.label}</span>
                  <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-60">cmd: {agent.command}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <AnimatePresence mode="wait">
                  {agent.status === 'installed' && (
                    <m.div key="inst" className="flex items-center gap-1.5 font-bold text-[9px] text-[var(--ansi-green)] uppercase">
                      <span>Detected</span>
                      <CheckCircle2 size={13} />
                    </m.div>
                  )}
                  {agent.status === 'installing' && (
                    <m.div key="instg" className="flex items-center gap-1.5 font-bold text-[9px] text-[var(--accent-primary)] uppercase">
                      <span>Installing</span>
                      <Loader2 size={13} className="animate-spin" />
                    </m.div>
                  )}
                  {agent.status === 'not-installed' && (
                    <m.button
                      key="notinst"
                      type="button"
                      onClick={() => installAgent(agent.id)}
                      className="px-2.5 py-1 text-[10px] font-bold border border-[var(--border-color)] rounded-lg bg-[var(--surface-color)] hover:border-[var(--accent-primary)]/50 hover:text-[var(--accent-primary)] transition-all flex items-center gap-1 active:scale-[0.97]"
                    >
                      <Download size={11} />
                      Install
                    </m.button>
                  )}
                  {agent.status === 'error' && (
                    <m.div key="err" className="flex items-center gap-1.5">
                      <span className="font-bold text-[9px] text-[var(--ansi-red)] uppercase">Failed</span>
                      <button
                        type="button"
                        onClick={() => installAgent(agent.id)}
                        className="px-1.5 py-0.5 rounded border border-[var(--border-color)] bg-[var(--surface-color)] text-[9px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        Retry
                      </button>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}

          <div className="text-center font-mono text-[10px] text-[var(--text-secondary)] opacity-70">
            {activeCount} of {agents.filter(a => a.isDefault).length} default agents configured successfully
          </div>
        </div>
      )}
    </div>
  );
}
