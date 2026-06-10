import { useState, useEffect, useRef } from "react";
import { ShortcutSettings, SHORTCUT_DEFAULTS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { getShortcutString } from "@/lib/shortcut-utils";
import { RotateCcw, Trash2, Monitor, Terminal as TerminalIcon, Zap, Command, AlertTriangle } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { SettingsCard } from "../shared/SettingsUI";
import { ConfirmActionDialog } from "@/components/dialogs/ConfirmActionDialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Human-readable labels for every shortcut key, used in conflict messages. */
const SHORTCUT_LABELS: Record<keyof ShortcutSettings, string> = {
  quickSwitcher: "Quick Switcher",
  newWorkspace: "New Workspace Flow",
  cycleNextWorkspace: "Cycle Next Workspace",
  cyclePrevWorkspace: "Cycle Prev Workspace",
  closeWorkspace: "Close Active Workspace",
  openShortcuts: "Shortcuts Cheatsheet",
  switchNormalMode: "Terminal Mode",
  switchAgentsMode: "AI Assisted Mode",
  splitHorizontal: "Split Horizontal",
  splitVertical: "Split Vertical",
  resetPane: "Reset Pane",
  closePane: "Close Pane",
  toggleZenMode: "Toggle Zen Mode",
  openTemplates: "Manage Templates",
  openSettings: "Open Preferences",
};

/** Returns the key of the shortcut that already owns `value`, excluding `ownKey`. */
function findConflict(
  value: string,
  ownKey: keyof ShortcutSettings,
  shortcuts: ShortcutSettings
): keyof ShortcutSettings | null {
  if (!value || value === "unassigned") return null;
  const normalized = value.replace(/\s+/g, "").toLowerCase();
  for (const [k, v] of Object.entries(shortcuts)) {
    if (k === ownKey) continue;
    if (v && v !== "unassigned" && v.replace(/\s+/g, "").toLowerCase() === normalized) {
      return k as keyof ShortcutSettings;
    }
  }
  return null;
}

interface ShortcutsTabProps {
  shortcuts: ShortcutSettings;
  onShortcutChange: (key: keyof ShortcutSettings, value: string) => Promise<void>;
  onResetShortcuts: () => Promise<void>;
}

export function ShortcutsTab({
  shortcuts,
  onShortcutChange,
  onResetShortcuts,
}: ShortcutsTabProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-0 pb-10 pr-2"
    >
      <ConfirmActionDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Reset Keyboard Shortcuts"
        description="Are you sure you want to reset all keyboard shortcuts back to their factory defaults? Any custom bindings you have recorded will be permanently lost."
        confirmLabel="Reset All"
        variant="destructive"
        onConfirm={onResetShortcuts}
      />

      <div className="flex items-center justify-between px-2 mb-8">
        <div>
          <h3 className="text-[14px] font-bold text-[var(--text-primary)] flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_10px_var(--accent-primary)]" />
            Keyboard Shortcuts
          </h3>
          <p className="text-[12.5px] text-[var(--text-secondary)] mt-1 font-medium">Reconfigure the shortcuts for your workspace.</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsConfirmOpen(true)}
          className="h-8 px-3 text-[10px] font-bold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] transition-all border border-[var(--accent-primary)]/20"
        >
          <RotateCcw size={12} className="mr-2" /> Reset All
        </Button>
      </div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Workspace & Navigation" 
          icon={<Monitor size={16} />}
          description="Manage workspace lifecycles and navigation flow."
        >
          <ShortcutItem label="Quick Switcher" shortcutKey="quickSwitcher" currentValue={shortcuts.quickSwitcher} defaultValue={SHORTCUT_DEFAULTS.quickSwitcher} onChange={onShortcutChange} allShortcuts={shortcuts} />
          <ShortcutItem label="New Workspace Flow" shortcutKey="newWorkspace" currentValue={shortcuts.newWorkspace} defaultValue={SHORTCUT_DEFAULTS.newWorkspace} onChange={onShortcutChange} allShortcuts={shortcuts} />
          <ShortcutItem label="Cycle Next Workspace" shortcutKey="cycleNextWorkspace" currentValue={shortcuts.cycleNextWorkspace} defaultValue={SHORTCUT_DEFAULTS.cycleNextWorkspace} onChange={onShortcutChange} allShortcuts={shortcuts} />
          <ShortcutItem label="Cycle Prev Workspace" shortcutKey="cyclePrevWorkspace" currentValue={shortcuts.cyclePrevWorkspace} defaultValue={SHORTCUT_DEFAULTS.cyclePrevWorkspace} onChange={onShortcutChange} allShortcuts={shortcuts} />
          <ShortcutItem label="Close Active Workspace" shortcutKey="closeWorkspace" currentValue={shortcuts.closeWorkspace} defaultValue={SHORTCUT_DEFAULTS.closeWorkspace} onChange={onShortcutChange} allShortcuts={shortcuts} critical />
          <ShortcutItem label="Shortcuts Cheatsheet" shortcutKey="openShortcuts" currentValue={shortcuts.openShortcuts} defaultValue={SHORTCUT_DEFAULTS.openShortcuts} onChange={onShortcutChange} allShortcuts={shortcuts} />
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Workflows" 
          icon={<Zap size={16} />}
          description="Switch between primary operational modes."
        >
          <ShortcutItem label="Terminal Mode" shortcutKey="switchNormalMode" currentValue={shortcuts.switchNormalMode} defaultValue={SHORTCUT_DEFAULTS.switchNormalMode} onChange={onShortcutChange} allShortcuts={shortcuts} />
          <ShortcutItem label="AI Assisted Mode" shortcutKey="switchAgentsMode" currentValue={shortcuts.switchAgentsMode} defaultValue={SHORTCUT_DEFAULTS.switchAgentsMode} onChange={onShortcutChange} allShortcuts={shortcuts} />
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Active Terminal Sessions" 
          icon={<TerminalIcon size={16} />}
          description="Direct control over active terminal panes and layouts."
        >
          <ShortcutItem label="Split Horizontal" shortcutKey="splitHorizontal" currentValue={shortcuts.splitHorizontal} defaultValue={SHORTCUT_DEFAULTS.splitHorizontal} onChange={onShortcutChange} allShortcuts={shortcuts} />
          <ShortcutItem label="Split Vertical" shortcutKey="splitVertical" currentValue={shortcuts.splitVertical} defaultValue={SHORTCUT_DEFAULTS.splitVertical} onChange={onShortcutChange} allShortcuts={shortcuts} />
          <ShortcutItem label="Reset Pane" shortcutKey="resetPane" currentValue={shortcuts.resetPane} defaultValue={SHORTCUT_DEFAULTS.resetPane} onChange={onShortcutChange} allShortcuts={shortcuts} />
          <ShortcutItem label="Close Pane" shortcutKey="closePane" currentValue={shortcuts.closePane} defaultValue={SHORTCUT_DEFAULTS.closePane} onChange={onShortcutChange} allShortcuts={shortcuts} critical />
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="System & Overlays" 
          icon={<Zap size={16} />}
          description="Toggle global interface elements and system preferences."
        >
          <ShortcutItem label="Toggle Zen Mode" shortcutKey="toggleZenMode" currentValue={shortcuts.toggleZenMode} defaultValue={SHORTCUT_DEFAULTS.toggleZenMode} onChange={onShortcutChange} allShortcuts={shortcuts} />
          <ShortcutItem label="Manage Templates" shortcutKey="openTemplates" currentValue={shortcuts.openTemplates} defaultValue={SHORTCUT_DEFAULTS.openTemplates} onChange={onShortcutChange} allShortcuts={shortcuts} />
          <ShortcutItem label="Open Preferences" shortcutKey="openSettings" currentValue={shortcuts.openSettings} defaultValue={SHORTCUT_DEFAULTS.openSettings} onChange={onShortcutChange} allShortcuts={shortcuts} />
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Setup Flow Hints" 
          icon={<Command size={16} />}
          description="Hardcoded hotkeys for the workspace initialization process."
        >
          <div className="space-y-1">
             <StaticShortcutItem label="Next Step / Launch" value="Ctrl + Enter" />
             <StaticShortcutItem label="Skip Preview & Launch" value="Ctrl + Shift + Enter" />
             <StaticShortcutItem label="Previous Step / Cancel" value="Esc" />
          </div>
        </SettingsCard>
      </motion.div>
    </motion.div>
  );
}

function StaticShortcutItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--text-primary)]/[0.02] transition-colors">
      <span className="text-[12px] font-bold text-[var(--text-secondary)]">{label}</span>
      <Kbd className="bg-transparent border-none p-0 text-[var(--text-secondary)] opacity-60 italic">{value}</Kbd>
    </div>
  );
}

interface ShortcutItemProps {
  label: string;
  shortcutKey: keyof ShortcutSettings;
  currentValue: string;
  defaultValue: string;
  onChange: (key: keyof ShortcutSettings, value: string) => Promise<void>;
  /** Full shortcuts map — needed for conflict detection. */
  allShortcuts: ShortcutSettings;
  critical?: boolean;
}

function ShortcutItem({ label, shortcutKey, currentValue, defaultValue, onChange, allShortcuts, critical }: ShortcutItemProps) {
  const [isRecording, setIsRecording] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /** Pending value that conflicts with another shortcut. */
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  /** The key of the action that conflicts with pendingValue. */
  const [conflictKey, setConflictKey] = useState<keyof ShortcutSettings | null>(null);

  const startRecording = () => {
    setPendingValue(null);
    setConflictKey(null);
    setIsRecording(true);
  };
  const stopRecording = () => setIsRecording(false);

  const dismissConflict = () => {
    setPendingValue(null);
    setConflictKey(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') {
      stopRecording();
      return;
    }
    const shortcutStr = getShortcutString(e.nativeEvent);
    if (shortcutStr) {
      // Check for conflicts before committing
      const conflict = findConflict(shortcutStr, shortcutKey, allShortcuts);
      if (conflict) {
        // Surface conflict inline — don't save yet
        setPendingValue(shortcutStr);
        setConflictKey(conflict);
        stopRecording();
      } else {
        onChange(shortcutKey, shortcutStr);
        stopRecording();
      }
    }
  };

  /** Accept the conflict: displace the other shortcut to "unassigned" and save ours. */
  const handleSwap = async () => {
    if (!pendingValue || !conflictKey) return;
    // First unassign the conflicting shortcut
    await onChange(conflictKey, "unassigned");
    // Then assign the new value to us
    await onChange(shortcutKey, pendingValue);
    dismissConflict();
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissConflict();
    onChange(shortcutKey, defaultValue);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissConflict();
    onChange(shortcutKey, "unassigned");
  };

  useEffect(() => {
    if (isRecording && buttonRef.current) buttonRef.current.focus();
  }, [isRecording]);

  const isModified = currentValue !== defaultValue;
  const isUnassigned = currentValue === "unassigned";
  const hasConflict = pendingValue !== null && conflictKey !== null;

  return (
    <div className="flex flex-col gap-0">
      <div className={cn(
        "group/item flex items-center justify-between p-2 rounded-lg transition-all duration-300",
        isRecording
          ? "bg-[var(--accent-primary)]/5"
          : hasConflict
          ? "bg-amber-500/5"
          : "hover:bg-[var(--text-primary)]/[0.03]"
      )}>
        <span className={cn(
          "text-[12px] font-bold tracking-tight transition-colors",
          isRecording
            ? "text-[var(--accent-primary)]"
            : hasConflict
            ? "text-amber-400"
            : "text-[var(--text-secondary)] group-hover/item:text-[var(--text-primary)]"
        )}>
          {label}
        </span>

        <div className="flex items-center gap-2">
          <button
            ref={buttonRef}
            onClick={startRecording}
            onKeyDown={handleKeyDown}
            onBlur={stopRecording}
            className={cn(
              "min-w-[110px] h-7 px-2.5 rounded-md border text-[10px] font-mono flex items-center justify-end gap-2 transition-all outline-none",
              isRecording
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.2)]"
                : hasConflict
                ? "border-amber-500/50 bg-amber-500/5"
                : "border-[var(--border-color)]/20 bg-[var(--bg-color)]/50 hover:border-[var(--text-secondary)]/40"
            )}
          >
            {isRecording ? (
              <span className="text-[var(--accent-primary)] animate-pulse flex items-center gap-1.5 font-bold text-[9px]">
                Recording
              </span>
            ) : (
              <>
                {isUnassigned ? (
                  <span className="text-[var(--text-secondary)]/40 italic font-medium">unassigned</span>
                ) : (
                  <Kbd className={cn(
                    "bg-transparent border-none p-0 text-[var(--text-primary)] transition-colors",
                    critical && "text-ansi-red"
                  )}>
                    {currentValue}
                  </Kbd>
                )}
              </>
            )}
          </button>

          <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity min-w-[56px] justify-end">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleReset}
              disabled={!isModified || isRecording || hasConflict}
              className={cn(
                "h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded",
                (!isModified || isRecording || hasConflict) && "hidden"
              )}
              title="Reset to default"
            >
              <RotateCcw size={11} />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleDelete}
                  disabled={isUnassigned || isRecording || hasConflict}
                  className={cn(
                    "h-6 w-6 text-[var(--text-secondary)]/60 hover:bg-red-500/10 hover:text-red-400 active:scale-95 rounded",
                    (isUnassigned || isRecording || hasConflict) && "hidden"
                  )}
                >
                  <Trash2 size={11} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4} className="text-[10px] bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                Unassign shortcut
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Conflict banner */}
      <AnimatePresence>
        {hasConflict && pendingValue && conflictKey && (
          <motion.div
            key="conflict"
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-2 mb-1 flex items-center justify-between gap-3 rounded-md border border-amber-500/25 bg-amber-500/8 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                <span className="text-[10px] text-amber-300/90 font-medium leading-tight">
                  <span className="font-mono text-amber-200">{pendingValue}</span>
                  {" is already used by "}
                  <span className="font-bold text-amber-200">{SHORTCUT_LABELS[conflictKey]}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleSwap}
                  className="h-5 px-2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/35 transition-colors border border-amber-500/30"
                >
                  Swap
                </button>
                <button
                  onClick={dismissConflict}
                  className="h-5 px-2 rounded text-[9px] font-bold text-[var(--text-secondary)]/60 hover:text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
