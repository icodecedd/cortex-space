import { useState } from "react";
import { SettingsCard, SettingsRow } from "../shared/SettingsUI";
import { Switch } from "@/components/ui/switch";
import { DemoSettings, setSetting } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Layout, Keyboard, RefreshCcw } from "@/components/ui/icons";
import { motion, Variants } from "framer-motion";
import { ConfirmActionDialog } from "@/components/dialogs/ConfirmActionDialog";

interface DemoTabProps {
  demo: DemoSettings;
  setDemoSetting: <K extends keyof DemoSettings>(key: K, value: DemoSettings[K]) => Promise<void>;
  onResetDemo: () => Promise<void>;
}

export function DemoTab({
  demo,
  setDemoSetting,
  onResetDemo,
}: DemoTabProps) {
  const [isFactoryResetConfirmOpen, setIsFactoryResetConfirmOpen] = useState(false);

  const handleFactoryReset = async () => {
    const { clearAllSettings } = await import("@/lib/store");
    await clearAllSettings();
    window.location.reload();
  };

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
        open={isFactoryResetConfirmOpen}
        onOpenChange={setIsFactoryResetConfirmOpen}
        title="Factory Reset Application"
        description="Are you absolutely sure you want to completely wipe all application data? This will erase all your presets, snippets, templates, and workspace settings back to their factory defaults. This action cannot be undone."
        confirmLabel="Wipe Everything"
        variant="destructive"
        onConfirm={handleFactoryReset}
      />

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Destructive Operations" 
          icon={<AlertTriangle size={16} />}
          description="High-level system resets and environment wipes."
          onReset={onResetDemo}
        >
          <SettingsRow
            label="Test Agent Onboarding"
            description="Reset the onboarding flag and agent cache to simulate a new installation."
            htmlFor="demo-agent-onboarding"
          >
            <Button 
              id="demo-agent-onboarding"
              variant="outline" 
              size="xs" 
              onClick={async () => {
                await setSetting('startup.hasOnboardedAgents', false);
                await setSetting('cortex_agents', null);
                window.location.reload();
              }}
              className="h-7 text-[10px] uppercase font-bold tracking-wider bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
            >
              Trigger Demo
            </Button>
          </SettingsRow>
          <SettingsRow
            label="Factory Reset"
            description="Completely wipe all application data back to defaults."
            htmlFor="demo-factory-reset"
          >
            <Button 
              id="demo-factory-reset"
              variant="destructive" 
              size="xs" 
              onClick={() => setIsFactoryResetConfirmOpen(true)}
              className="h-7 text-[10px] uppercase font-bold tracking-wider"
            >
              Wipe Everything
            </Button>
          </SettingsRow>
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Navigation Debugging" 
          icon={<Layout size={16} />}
          description="Toggle visibility of experimental header components."
        >
          <SettingsRow
            label="Show Workspaces Tab"
            description="Toggle visibility of the workspace tabs in the header."
            htmlFor="demo-workspaces-toggle"
          >
            <Switch
              id="demo-workspaces-toggle"
              checked={demo.showWorkspacesTab}
              onCheckedChange={(v) => setDemoSetting("showWorkspacesTab", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="Show Cortex Library"
            description="Toggle visibility of the Space Templates (Rocket) button."
            htmlFor="demo-templates-toggle"
          >
            <Switch
              id="demo-templates-toggle"
              checked={demo.showTemplatesButton}
              onCheckedChange={(v) => setDemoSetting("showTemplatesButton", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="Show Shortcut Link"
            description="Toggle visibility of the Shortcuts button in the header."
            htmlFor="demo-shortcuts-toggle"
          >
            <Switch
              id="demo-shortcuts-toggle"
              checked={demo.showShortcutsButton}
              onCheckedChange={(v) => setDemoSetting("showShortcutsButton", v)}
            />
          </SettingsRow>
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Visual Hints & Shortcuts" 
          icon={<Keyboard size={16} />}
          description="Control the visibility of contextual keybinding guides."
        >
          <SettingsRow
            label="Mode Selector Hints"
            description="Toggle Kbd shortcut hints in the Mode Selector screen."
            htmlFor="demo-mode-shortcuts-toggle"
          >
            <Switch
              id="demo-mode-shortcuts-toggle"
              checked={demo.showModeShortcutHints}
              onCheckedChange={(v) => setDemoSetting("showModeShortcutHints", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="Terminal Pane Hints"
            description="Toggle Kbd shortcut hints on terminal pane headers."
            htmlFor="demo-terminal-shortcuts-toggle"
          >
            <Switch
              id="demo-terminal-shortcuts-toggle"
              checked={demo.showTerminalShortcutHints}
              onCheckedChange={(v) => setDemoSetting("showTerminalShortcutHints", v)}
            />
          </SettingsRow>
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Runtime Development" 
          icon={<RefreshCcw size={16} />}
          description="Development tools for live application debugging."
        >
          <SettingsRow
            label="Enable Browser Refresh"
            description="Allow Ctrl+R to reload the application (Dev-only)."
            htmlFor="demo-browser-refresh-toggle"
          >
            <Switch
              id="demo-browser-refresh-toggle"
              checked={demo.enableBrowserRefresh}
              onCheckedChange={(v) => setDemoSetting("enableBrowserRefresh", v)}
            />
          </SettingsRow>
        </SettingsCard>
      </motion.div>
    </motion.div>
  );
}
