import { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { m, AnimatePresence, Variants, useReducedMotion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { getSetting, setSetting } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { useAgents } from '@/hooks/useAgents';
import { useTheme } from '@/hooks/useTheme';
import type { Agent } from '@/lib';
import { Loader2, ArrowRight } from '@/components/ui/icons';

import type {
  FlowMode,
  SysCheck,
  InstallableTool,
  PathValidationState,
  WorkspacePathValidation,
} from '@/lib/onboarding';
import { INITIAL_BOOT_CHECKS, PROFILES } from '@/lib/onboarding';

import { StepFoundation } from './onboarding/StepFoundation';
import { StepChoice } from './onboarding/StepChoice';
import { StepPickProfile } from './onboarding/StepPickProfile';
import { StepIntelligence } from './onboarding/StepIntelligence';
import { StepPersonalization } from './onboarding/StepPersonalization';
import { StepActivation } from './onboarding/StepActivation';

// ── Main Component ────────────────────────────────────────────────────────────

interface FirstRunOnboardingScreenProps {
  onComplete: () => void;
}

export const FirstRunOnboardingScreen = memo(function FirstRunOnboardingScreen({
  onComplete,
}: FirstRunOnboardingScreenProps) {
  const shouldReduceMotion = useReducedMotion();

  // Settings states
  const [workspacePath, setWorkspacePath] = useState('');
  const [flowMode, setFlowMode] = useState<FlowMode>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isApplyingStarterPack, setIsApplyingStarterPack] = useState(false);
  const [isWritingSettings, setIsWritingSettings] = useState(false);

  // Diagnostics & runtime scan
  const [bootFinished, setBootFinished] = useState(false);
  const [bootChecks, setBootChecks] = useState<SysCheck[]>(INITIAL_BOOT_CHECKS);
  const [systemShell, setSystemShell] = useState('cmd.exe');
  const [installingTools, setInstallingTools] = useState<Partial<Record<InstallableTool, boolean>>>({});
  const [pathValidation, setPathValidation] = useState<PathValidationState>({
    status: 'idle',
    message: '',
    normalizedPath: '',
  });
  const [checks, setChecks] = useState<SysCheck[]>([
    { id: 'node', label: 'Node.js Runtime', description: 'Requires v18.x or above', status: 'pending', detail: '' },
    { id: 'git', label: 'Git Version Control', description: 'Tracks repositories & themes', status: 'pending', detail: '' },
    { id: 'shell', label: 'Default Shell', description: 'Detect default command interpreter', status: 'pending', detail: '' },
    { id: 'disk', label: 'Disk Access', description: 'Verifying folder read/write rights', status: 'pending', detail: '' },
  ]);

  // Option A configuration states
  const [selectedProfile, setSelectedProfile] = useState<'zen' | 'intelligence' | 'pro' | 'creator' | 'hacker' | null>(null);
  const [proShellPreference, setProShellPreference] = useState('powershell.exe');

  // Option B configuration states
  const [customShell, setCustomShell] = useState('');
  const [customTheme, setCustomTheme] = useState('cortex');
  const [customFontSize, setCustomFontSize] = useState(12);
  const [customFontFamily, setCustomFontFamily] = useState('JetBrains Mono');
  const [customLayout, setCustomLayout] = useState<'grid' | 'count'>('grid');
  const [customShowFloatingHeader, setCustomShowFloatingHeader] = useState(true);
  const [customHeaderVisibility, setCustomHeaderVisibility] = useState<'hover' | 'always'>('hover');

  // Theme & Agent bindings
  const { setTheme, allThemes } = useTheme();
  const { agents, installAgent, isInitialized: isAgentsInitialized } = useAgents();

  // Run first-start checks against real local state before allowing setup to continue.
  useEffect(() => {
    let cancelled = false;

    const patchBoot = (id: string, update: Partial<SysCheck>) => {
      if (cancelled) return;
      setBootChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...update } : c)));
    };

    const runBootChecks = async () => {
      let hasFailure = false;
      setBootFinished(false);
      setBootChecks(INITIAL_BOOT_CHECKS);

      patchBoot('environment', { status: 'checking', detail: '' });
      try {
        const home = await invoke<string | null>('get_home_dir');
        if (!home) throw new Error('Home directory unavailable');
        patchBoot('environment', { status: 'ok', detail: `Home: ${home}` });
      } catch (error) {
        hasFailure = true;
        patchBoot('environment', {
          status: 'fail',
          detail: error instanceof Error ? error.message : 'Unable to initialize local environment',
        });
      }

      patchBoot('workspace-sync', { status: 'checking', detail: '' });
      try {
        const [workspaceDefault, legacyDefault] = await Promise.all([
          getSetting<string>('workspace.defaultPath', ''),
          getSetting<string>('cortex_default_path', ''),
        ]);
        const savedPath = workspaceDefault || legacyDefault;
        if (!cancelled) setWorkspacePath(savedPath);
        patchBoot('workspace-sync', {
          status: 'ok',
          detail: savedPath ? `Loaded saved workspace: ${savedPath}` : 'No saved workspace path; home directory will be used',
        });
      } catch (error) {
        hasFailure = true;
        patchBoot('workspace-sync', {
          status: 'fail',
          detail: error instanceof Error ? error.message : 'Failed to load local workspace settings',
        });
      }

      patchBoot('agents', { status: 'checking', detail: '' });
      if (!isAgentsInitialized) {
        patchBoot('agents', { status: 'checking', detail: 'Waiting for agent registry initialization' });
        return;
      }
      patchBoot('agents', {
        status: 'ok',
        detail: `${agents.filter((a) => a.isDefault).length} default agents registered`,
      });

      patchBoot('themes', { status: 'checking', detail: '' });
      if (allThemes.length > 0) {
        patchBoot('themes', { status: 'ok', detail: `${allThemes.length} themes available` });
      } else {
        hasFailure = true;
        patchBoot('themes', { status: 'fail', detail: 'No visual themes were loaded' });
      }

      patchBoot('shell', { status: 'checking', detail: '' });
      try {
        const shell = await invoke<string>('get_default_shell');
        if (!shell?.trim()) throw new Error('Default shell unavailable');
        if (!cancelled) setSystemShell(shell.trim());
        patchBoot('shell', { status: 'ok', detail: shell.trim() });
      } catch (error) {
        hasFailure = true;
        patchBoot('shell', {
          status: 'fail',
          detail: error instanceof Error ? error.message : 'Unable to detect default shell',
        });
      }

      if (!cancelled) setBootFinished(!hasFailure);
    };

    runBootChecks();

    return () => {
      cancelled = true;
    };
  }, [agents, allThemes.length, isAgentsInitialized]);

  useEffect(() => {
    if (!bootFinished) return;

    let cancelled = false;
    const rawPath = workspacePath;

    setPathValidation({
      status: 'checking',
      message: rawPath.trim() ? 'Validating workspace path...' : 'Validating home directory...',
      normalizedPath: '',
    });

    const id = window.setTimeout(async () => {
      try {
        const result = await invoke<WorkspacePathValidation>('validate_workspace_path', { path: rawPath });
        if (cancelled) return;
        setPathValidation({
          status: result.valid ? 'valid' : 'invalid',
          message: result.message,
          normalizedPath: result.normalized_path || '',
        });
      } catch (error) {
        if (cancelled) return;
        setPathValidation({
          status: 'invalid',
          message: error instanceof Error ? error.message : 'Path validation failed.',
          normalizedPath: '',
        });
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [bootFinished, workspacePath]);

  const selectedProfileData = useMemo(
    () => PROFILES.find((profile) => profile.id === selectedProfile) || null,
    [selectedProfile]
  );

  // Compute active steps list
  const steps = getStepsList(flowMode);
  const currentStep = steps[stepIndex];

  function getStepsList(flow: FlowMode): string[] {
    if (flow === 'starter') {
      return ['foundation', 'choice', 'pick-profile', 'activation'];
    }
    if (flow === 'custom') {
      return ['foundation', 'choice', 'intelligence', 'personalization', 'activation'];
    }
    return ['foundation', 'choice'];
  }

  // System scanner runner
  const runSystemScan = useCallback(async () => {
    const patch = (id: string, update: Partial<SysCheck>) =>
      setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...update } : c)));

    const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    // Reset statuses (except disk check, which is managed by pathValidation sync)
    setChecks((prev) =>
      prev.map((c) => (c.id === 'disk' ? c : { ...c, status: 'pending', detail: '' }))
    );

    // Node
    patch('node', { status: 'checking' });
    await delay(350);
    try {
      const v = await invoke<string>('check_node_version');
      const major = Number.parseInt(v.trim().replace(/^v/, '').split('.')[0] || '0', 10);
      if (Number.isFinite(major) && major >= 18) {
        patch('node', { status: 'ok', detail: v.trim().slice(0, 40) });
      } else {
        patch('node', { status: 'fail', detail: `${v.trim() || 'Unknown version'} detected; v18+ required` });
      }
    } catch (error) {
      patch('node', {
        status: 'fail',
        detail: typeof error === 'string' ? error : 'Node.js was not found on PATH',
      });
    }

    // Git
    patch('git', { status: 'checking' });
    await delay(350);
    try {
      const v = await invoke<string>('check_git_version');
      patch('git', { status: 'ok', detail: v ? v.trim().slice(0, 40) : 'Git detected' });
    } catch (error) {
      patch('git', {
        status: 'fail',
        detail: typeof error === 'string' ? error : 'Git was not found on PATH',
      });
    }

    // Shell
    patch('shell', { status: 'checking' });
    await delay(300);
    try {
      const v = await invoke<string>('get_default_shell');
      if (!v?.trim()) throw new Error('Default shell unavailable');
      patch('shell', { status: 'ok', detail: v.trim() });
    } catch (error) {
      patch('shell', {
        status: 'fail',
        detail: error instanceof Error ? error.message : 'Default shell unavailable',
      });
    }
  }, []);

  // Synchronize the disk validation status to the diagnostics checks list
  useEffect(() => {
    setChecks((prev) =>
      prev.map((c) => {
        if (c.id === 'disk') {
          return {
            ...c,
            status:
              pathValidation.status === 'valid'
                ? 'ok'
                : pathValidation.status === 'invalid'
                ? 'fail'
                : pathValidation.status === 'checking'
                ? 'checking'
                : 'pending',
            detail: pathValidation.message || '',
          };
        }
        return c;
      })
    );
  }, [pathValidation.status, pathValidation.message]);

  const installTool = useCallback(async (tool: InstallableTool) => {
    setInstallingTools((prev) => ({ ...prev, [tool]: true }));
    setChecks((prev) =>
      prev.map((check) =>
        check.id === tool
          ? { ...check, status: 'checking', detail: `Installing stable ${tool === 'node' ? 'Node.js LTS' : 'Git'} release...` }
          : check
      )
    );

    try {
      await invoke('install_dev_tool', { tool });
      await runSystemScan();
    } catch (error) {
      const detail = typeof error === 'string'
        ? error
        : error instanceof Error
        ? error.message
        : `Failed to install ${tool}.`;
      setChecks((prev) =>
        prev.map((check) =>
          check.id === tool
            ? { ...check, status: 'fail', detail }
            : check
        )
      );
    } finally {
      setInstallingTools((prev) => ({ ...prev, [tool]: false }));
    }
  }, [runSystemScan]);

  // Run scans when the foundation step loads
  useEffect(() => {
    if (currentStep === 'foundation') {
      runSystemScan();
    }
  }, [currentStep, runSystemScan]);

  // Profile-switching triggers instant visual theme change
  useEffect(() => {
    if (flowMode === 'starter' && currentStep === 'pick-profile' && selectedProfileData) {
      setTheme(selectedProfileData.themeId);
    }
  }, [selectedProfileData, flowMode, currentStep, setTheme]);

  // Apply theme customization dynamically
  useEffect(() => {
    if (flowMode === 'custom' && currentStep === 'personalization') {
      setTheme(customTheme);
    }
  }, [customTheme, flowMode, currentStep, setTheme]);

  const bootFailed = bootChecks.some((check) => check.status === 'fail');
  const isAnyAgentInstalling = agents.some((agent) => agent.status === 'installing');
  const workspacePathReady = pathValidation.status === 'valid';
  const selectedProfileMissingAgents = useMemo(() => {
    if (!selectedProfileData) return [];
    return selectedProfileData.includedAgentIds
      .map((id) => agents.find((agent) => agent.id === id))
      .filter((agent): agent is Agent => agent !== undefined && agent.status !== 'installed');
  }, [agents, selectedProfileData]);

  const scanPassed = checks.every((check) => check.status === 'ok' || check.status === 'warn');

  // Logic validation for moving forward
  const canProceed = useCallback(() => {
    if (currentStep === 'foundation') return bootFinished && workspacePathReady && scanPassed;
    if (currentStep === 'choice') return flowMode !== null;
    if (currentStep === 'pick-profile') return selectedProfile !== null;
    if (currentStep === 'activation') {
      return !isAnyAgentInstalling && !isApplyingStarterPack && !isWritingSettings;
    }
    if (currentStep === 'intelligence') return isAgentsInitialized && !isAnyAgentInstalling;
    return true;
  }, [
    currentStep,
    bootFinished,
    workspacePathReady,
    flowMode,
    selectedProfile,
    scanPassed,
    isAnyAgentInstalling,
    isApplyingStarterPack,
    isWritingSettings,
    isAgentsInitialized,
  ]);

  // Navigation handlers
  const commitSettings = useCallback(async () => {
    setIsWritingSettings(true);
    try {
      let path = pathValidation.normalizedPath || workspacePath.trim();
      let themeName = 'cortex';
      let layout = 'grid';
      let shell = '';

      if (flowMode === 'starter') {
        if (selectedProfileData) {
          themeName = selectedProfileData.themeId;
          layout = selectedProfileData.id === 'zen' ? 'count' : 'grid';
          shell = selectedProfileData.id === 'pro'
            ? proShellPreference
            : selectedProfileData.shellValue || '';
        }
      } else {
        themeName = customTheme;
        layout = customLayout;
        shell = customShell;

        await setSetting('terminal.fontSize', customFontSize);
        await setSetting('terminal.fontFamily', customFontFamily);
        await setSetting('demo.showFloatingTerminalHeader', customShowFloatingHeader);
        await setSetting('demo.terminalHeaderVisibility', customHeaderVisibility);
      }

      await Promise.all([
        setSetting('workspace.defaultPath', path),
        setSetting('cortex_default_path', path),
        setSetting('appearance.theme', themeName),
        setSetting('workspace.layout', layout),
        setSetting('terminal.shell', shell),
        setSetting('startup.hasOnboarded', true),
        setSetting('cortex_theme', themeName),
        setSetting('focus.customLayoutMode', layout),
        setSetting('startup.defaultShell', shell),
        setSetting('startup.hasCompletedOnboarding', true),
        setSetting('startup.hasOnboardedAgents', true),
      ]);

      setTheme(themeName);
      onComplete();
    } catch (error) {
      toast.error('Failed to save onboarding settings', {
        description: error instanceof Error ? error.message : 'Review the configuration and try again.',
      });
    } finally {
      setIsWritingSettings(false);
    }
  }, [
    workspacePath,
    pathValidation.normalizedPath,
    flowMode,
    selectedProfileData,
    proShellPreference,
    customTheme,
    customLayout,
    customShell,
    customFontSize,
    customFontFamily,
    setTheme,
    onComplete,
  ]);

  const goNext = useCallback(async () => {
    if (!canProceed()) return;

    if (currentStep === 'activation') {
      if (flowMode === 'starter') {
        const profile = selectedProfileData;
        if (profile && selectedProfileMissingAgents.length > 0) {
          setIsApplyingStarterPack(true);
          try {
            for (const agent of selectedProfileMissingAgents) {
              await installAgent(agent.id);
            }
            toast.success(`${profile.name} applied`, {
              description: selectedProfileMissingAgents.map((agent) => agent.label).join(', ') || 'Starter pack ready.',
            });
          } finally {
            setIsApplyingStarterPack(false);
          }
        }
      }
      await commitSettings();
      return;
    }

    setDirection(1);
    setStepIndex((i) => i + 1);
  }, [
    canProceed,
    currentStep,
    flowMode,
    selectedProfileData,
    selectedProfileMissingAgents,
    installAgent,
    commitSettings,
  ]);

  const goBack = useCallback(() => {
    if (stepIndex === 0 || isApplyingStarterPack || isAnyAgentInstalling || isWritingSettings) return;
    setDirection(-1);
    const nextIndex = stepIndex - 1;
    setStepIndex(nextIndex);
    if (nextIndex === 1) {
      setFlowMode(null);
      setSelectedProfile(null);
    }
  }, [stepIndex, isApplyingStarterPack, isAnyAgentInstalling, isWritingSettings]);

  // Keyboard navigation bindings
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (canProceed()) {
          e.preventDefault();
          goNext();
        }
      }
      if (e.key === 'Escape' && stepIndex > 0) {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canProceed, goNext, goBack, stepIndex]);

  const selectChoiceMode = (mode: FlowMode) => {
    setFlowMode(mode);
    if (mode === 'custom') {
      setSelectedProfile(null);
    }
    setDirection(1);
    setStepIndex(2); // Jump directly to the chosen branch's first step
  };

  const xAmt = shouldReduceMotion ? 0 : 40;
  const slideVariants: Variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * xAmt }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -xAmt }),
  };

  // Profile labels for activation summary review
  const getThemeDisplayName = () => {
    if (flowMode === 'starter') {
      return selectedProfileData?.themeName || 'Cortex Default';
    }
    return allThemes.find((t) => t.id === customTheme)?.name || customTheme;
  };

  const getLayoutDisplayName = () => {
    if (flowMode === 'starter') {
      return selectedProfileData?.layoutName || 'Flex Layout';
    }
    const target = customLayout;
    return target === 'grid' ? 'Grid Layout (2x2)' : 'Flex Layout';
  };

  const getShellDisplayName = () => {
    if (flowMode === 'starter') {
      if (selectedProfile === 'pro') return proShellPreference || selectedProfileData?.shellValue || 'powershell.exe';
      return selectedProfileData?.shellValue || selectedProfileData?.shellLabel || 'Default Shell';
    }
    return customShell || 'Default Shell';
  };

  const activeAgentsCount = flowMode === 'starter' && selectedProfileData
    ? selectedProfileData.includedAgentIds.filter((id) => {
        const agent = agents.find((item) => item.id === id);
        return agent?.status === 'installed';
      }).length
    : agents.filter((a) => a.isDefault && a.status === 'installed').length;
  const includedAgentSummary =
    flowMode === 'starter' && selectedProfileData
      ? selectedProfileData.includedAgentLabels.length > 0
        ? selectedProfileData.includedAgentLabels.join(', ')
        : 'No starter installs'
      : `${agents.filter((a) => a.isDefault && a.status === 'installed').length} of ${agents.filter((a) => a.isDefault).length} default agents installed`;

  return (
    <div className="relative w-full min-h-[100dvh] flex flex-col bg-[var(--bg-color)] overflow-hidden">
      {/* Dynamic theme accent ambient glow */}
      <div
        className="absolute top-[-20%] left-[50%] -translate-x-[50%] w-[600px] h-[300px] rounded-full blur-[120px] pointer-events-none opacity-10 transition-all duration-500"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      />

      {/* ── Top Header ─────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-b border-[var(--border-color)]/40 bg-[var(--bg-color)]/70 backdrop-blur-md z-10">
        <span className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
          Command Center Setup
        </span>
        <span className="text-[10px] text-[var(--text-secondary)] opacity-60">
          Step {stepIndex + 1} of {steps.length}
        </span>
      </div>

      {/* ── Visual Progress Bar ──────────────────────────────── */}
      <div className="flex-shrink-0 h-[1.5px] bg-[var(--border-color)]/25 z-10">
        <m.div
          className="h-full bg-[var(--accent-primary)]"
          initial={{ width: '0%' }}
          animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>

      {/* ── Main content area ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto z-10 flex flex-col items-center p-6 md:p-10">
        <div className="w-full max-w-2xl flex flex-col items-center my-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <m.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full flex justify-center text-center md:text-left"
            >
              {currentStep === 'foundation' && (
                <StepFoundation
                  path={workspacePath}
                  setPath={setWorkspacePath}
                  bootFinished={bootFinished}
                  bootChecks={bootChecks}
                  bootFailed={bootFailed}
                  pathValidation={pathValidation}
                  skip={shouldReduceMotion ?? false}
                  shell={customShell}
                  setShell={setCustomShell}
                  checks={checks}
                  systemShell={systemShell}
                  installingTools={installingTools}
                  onInstallTool={installTool}
                />
              )}

              {currentStep === 'choice' && (
                <StepChoice onSelect={selectChoiceMode} />
              )}

              {currentStep === 'pick-profile' && (
                <StepPickProfile
                  selected={selectedProfile}
                  onSelect={setSelectedProfile}
                  proShell={proShellPreference}
                  setProShell={setProShellPreference}
                />
              )}

              {currentStep === 'intelligence' && (
                <StepIntelligence
                  agents={agents}
                  installAgent={installAgent}
                  isInitialized={isAgentsInitialized}
                />
              )}

              {currentStep === 'personalization' && (
                <StepPersonalization
                  allThemes={allThemes}
                  selectedTheme={customTheme}
                  setSelectedTheme={setCustomTheme}
                  customFontSize={customFontSize}
                  setCustomFontSize={setCustomFontSize}
                  customFontFamily={customFontFamily}
                  setCustomFontFamily={setCustomFontFamily}
                  customLayout={customLayout}
                  setCustomLayout={setCustomLayout}
                  customShowFloatingHeader={customShowFloatingHeader}
                  setCustomShowFloatingHeader={setCustomShowFloatingHeader}
                  customHeaderVisibility={customHeaderVisibility}
                  setCustomHeaderVisibility={setCustomHeaderVisibility}
                />
              )}

              {currentStep === 'activation' && (
                <StepActivation
                  path={pathValidation.normalizedPath || workspacePath}
                  setupLabel={flowMode === 'starter' ? selectedProfileData?.name || 'Starter Pack' : 'Custom Setup'}
                  themeName={getThemeDisplayName()}
                  layoutName={getLayoutDisplayName()}
                  shellName={getShellDisplayName()}
                  agentSummary={includedAgentSummary || `${activeAgentsCount} agents ready`}
                  flowMode={flowMode}
                  profile={selectedProfileData}
                  agents={agents}
                />
              )}
            </m.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom Action Bar ────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-[var(--border-color)]/40 px-6 py-4 flex items-center justify-between bg-[var(--bg-color)]/70 backdrop-blur-md z-10">
        <Button
          onClick={goBack}
          disabled={stepIndex === 0 || isApplyingStarterPack || isAnyAgentInstalling || isWritingSettings}
          variant="ghost"
          className="text-xs h-8 px-3 font-semibold text-[var(--text-secondary)] disabled:opacity-30 hover:bg-[var(--surface-color)]/40 hover:text-[var(--text-primary)] transition-all"
          style={{ visibility: stepIndex === 0 ? 'hidden' : 'visible' }}
        >
          Back
        </Button>

        {/* Step indicator dots */}
        <div className="hidden sm:flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === stepIndex ? '16px' : '4px',
                backgroundColor:
                  i === stepIndex
                    ? 'var(--accent-primary)'
                    : i < stepIndex
                    ? 'color-mix(in srgb, var(--accent-primary) 35%, transparent)'
                    : 'var(--border-color)',
              }}
            />
          ))}
        </div>

        <Button
          onClick={goNext}
          disabled={!canProceed()}
          className={`text-xs h-8 px-4 font-bold border transition-all flex items-center gap-1.5 ${
            canProceed()
              ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--accent-contrast)] hover:brightness-110 active:scale-[0.98]'
              : 'bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)] opacity-50'
          }`}
        >
          {isWritingSettings ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Saving...
            </>
          ) : isApplyingStarterPack ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Installing...
            </>
          ) : currentStep === 'activation' ? (
            flowMode === 'starter' && selectedProfileMissingAgents.length > 0 ? 'Apply Pack & Launch' : 'Enter Workspace'
          ) : (
            <>
              Continue
              <ArrowRight size={13} className="shrink-0" />
            </>
          )}
        </Button>
      </div>

      {/* Retro CSS blink styling */}
      <style>{`
        @keyframes cortex-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
});
