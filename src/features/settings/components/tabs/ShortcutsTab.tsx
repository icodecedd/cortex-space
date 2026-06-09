import { useState, useEffect, useRef } from "react";
import { ShortcutSettings, SHORTCUT_DEFAULTS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { getShortcutString } from "@/lib/shortcut-utils";
import { RotateCcw, Trash2, Monitor, Terminal as TerminalIcon, Zap, Command } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { motion, Variants } from "framer-motion";
import { SettingsCard } from "../shared/SettingsUI";
import { ConfirmActionDialog } from "@/components/dialogs/ConfirmActionDialog";

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
        title="Reset Control Mapping"
        description="Are you sure you want to reset all keyboard shortcuts back to their factory defaults? Any custom bindings you have recorded will be permanently lost."
        confirmLabel="Reset Matrix"
        variant="destructive"
        onConfirm={onResetShortcuts}
      />

      <div className="flex items-center justify-between px-2 mb-8">
        <div>
          <h3 className="text-[14px] font-bold tracking-[0.2em] text-[var(--text-primary)] uppercase flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_10px_var(--accent-primary)]" />
            Control Mapping
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-medium">Reconfigure the neural links of your workspace.</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsConfirmOpen(true)}
          className="h-8 px-3 text-[10px] font-bold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] transition-all uppercase tracking-widest border border-[var(--accent-primary)]/20"
        >
          <RotateCcw size={12} className="mr-2" /> Reset Matrix
        </Button>
      </div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Workspace & Navigation" 
          icon={<Monitor size={16} />}
          description="Manage workspace lifecycles and navigation flow."
        >
          <ShortcutItem label="Quick Switcher" shortcutKey="quickSwitcher" currentValue={shortcuts.quickSwitcher} defaultValue={SHORTCUT_DEFAULTS.quickSwitcher} onChange={onShortcutChange} />
          <ShortcutItem label="New Workspace Flow" shortcutKey="newWorkspace" currentValue={shortcuts.newWorkspace} defaultValue={SHORTCUT_DEFAULTS.newWorkspace} onChange={onShortcutChange} />
          <ShortcutItem label="Cycle Next Workspace" shortcutKey="cycleNextWorkspace" currentValue={shortcuts.cycleNextWorkspace} defaultValue={SHORTCUT_DEFAULTS.cycleNextWorkspace} onChange={onShortcutChange} />
          <ShortcutItem label="Cycle Prev Workspace" shortcutKey="cyclePrevWorkspace" currentValue={shortcuts.cyclePrevWorkspace} defaultValue={SHORTCUT_DEFAULTS.cyclePrevWorkspace} onChange={onShortcutChange} />
          <ShortcutItem label="Close Active Workspace" shortcutKey="closeWorkspace" currentValue={shortcuts.closeWorkspace} defaultValue={SHORTCUT_DEFAULTS.closeWorkspace} onChange={onShortcutChange} critical />
          <ShortcutItem label="Shortcuts Cheatsheet" shortcutKey="openShortcuts" currentValue={shortcuts.openShortcuts} defaultValue={SHORTCUT_DEFAULTS.openShortcuts} onChange={onShortcutChange} />
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Active Terminal Sessions" 
          icon={<TerminalIcon size={16} />}
          description="Direct control over active terminal panes and layouts."
        >
          <ShortcutItem label="Split Horizontal" shortcutKey="splitHorizontal" currentValue={shortcuts.splitHorizontal} defaultValue={SHORTCUT_DEFAULTS.splitHorizontal} onChange={onShortcutChange} />
          <ShortcutItem label="Split Vertical" shortcutKey="splitVertical" currentValue={shortcuts.splitVertical} defaultValue={SHORTCUT_DEFAULTS.splitVertical} onChange={onShortcutChange} />
          <ShortcutItem label="Reset Pane" shortcutKey="resetPane" currentValue={shortcuts.resetPane} defaultValue={SHORTCUT_DEFAULTS.resetPane} onChange={onShortcutChange} />
          <ShortcutItem label="Close Pane" shortcutKey="closePane" currentValue={shortcuts.closePane} defaultValue={SHORTCUT_DEFAULTS.closePane} onChange={onShortcutChange} critical />
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="System & Overlays" 
          icon={<Zap size={16} />}
          description="Toggle global interface elements and system preferences."
        >
          <ShortcutItem label="Toggle Zen Mode" shortcutKey="toggleZenMode" currentValue={shortcuts.toggleZenMode} defaultValue={SHORTCUT_DEFAULTS.toggleZenMode} onChange={onShortcutChange} />
          <ShortcutItem label="Manage Templates" shortcutKey="openTemplates" currentValue={shortcuts.openTemplates} defaultValue={SHORTCUT_DEFAULTS.openTemplates} onChange={onShortcutChange} />
          <ShortcutItem label="Open Preferences" shortcutKey="openSettings" currentValue={shortcuts.openSettings} defaultValue={SHORTCUT_DEFAULTS.openSettings} onChange={onShortcutChange} />
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
      <span className="text-[11px] font-bold text-[var(--text-secondary)]">{label}</span>
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
  critical?: boolean;
}

function ShortcutItem({ label, shortcutKey, currentValue, defaultValue, onChange, critical }: ShortcutItemProps) {
  const [isRecording, setIsRecording] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const startRecording = () => setIsRecording(true);
  const stopRecording = () => setIsRecording(false);

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
      onChange(shortcutKey, shortcutStr);
      stopRecording();
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(shortcutKey, defaultValue);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(shortcutKey, "unassigned");
  };

  useEffect(() => {
    if (isRecording && buttonRef.current) buttonRef.current.focus();
  }, [isRecording]);

  const isModified = currentValue !== defaultValue;
  const isUnassigned = currentValue === "unassigned";

  return (
    <div className={cn(
      "group/item flex items-center justify-between p-2 rounded-lg transition-all duration-300",
      isRecording ? "bg-[var(--accent-primary)]/5" : "hover:bg-[var(--text-primary)]/[0.03]"
    )}>
      <span className={cn(
        "text-[11px] font-bold tracking-tight transition-colors",
        isRecording ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)] group-hover/item:text-[var(--text-primary)]"
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
              : "border-[var(--border-color)]/20 bg-[var(--bg-color)]/50 hover:border-[var(--text-secondary)]/40"
          )}
        >
          {isRecording ? (
            <span className="text-[var(--accent-primary)] animate-pulse flex items-center gap-1.5 uppercase font-bold tracking-widest text-[9px]">
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
            disabled={!isModified || isRecording}
            className={cn(
              "h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded",
              (!isModified || isRecording) && "hidden"
            )}
            title="Reset to default"
          >
            <RotateCcw size={11} />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDelete}
            disabled={isUnassigned || isRecording}
            className={cn(
              "h-6 w-6 text-[var(--text-secondary)] hover:text-ansi-red hover:bg-ansi-red/10 rounded",
              (isUnassigned || isRecording) && "hidden"
            )}
            title="Unassign shortcut"
          >
            <Trash2 size={11} />
          </Button>
        </div>
      </div>
    </div>
  );
}
