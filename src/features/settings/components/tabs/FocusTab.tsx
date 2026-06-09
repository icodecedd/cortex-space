import { SettingsCard, SettingsRow } from "../shared/SettingsUI";
import { Switch } from "@/components/ui/switch";
import { Target, Layout, Activity } from "@/components/ui/icons";
import { FocusSettings } from "@/lib/store";
import { motion, Variants } from "framer-motion";

interface FocusTabProps {
  focusSettings: FocusSettings;
  setFocusSetting: <K extends keyof FocusSettings>(key: K, value: FocusSettings[K]) => Promise<void>;
  onResetFocus: () => Promise<void>;
}

export function FocusTab({
  focusSettings,
  setFocusSetting,
  onResetFocus,
}: FocusTabProps) {
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
      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Distraction Shield" 
          icon={<Target size={16} />}
          description="Control the visibility of interface elements for deep focus."
          onReset={onResetFocus}
        >
          <SettingsRow
            label="Persist Zen Mode"
            description="Keep Zen Mode active across app restarts."
            htmlFor="zen-persist-toggle"
          >
            <Switch
              id="zen-persist-toggle"
              checked={focusSettings.isZenMode}
              onCheckedChange={(v) => setFocusSetting("isZenMode", v)}
            />
          </SettingsRow>
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Persistent Overlays" 
          icon={<Layout size={16} />}
          description="Elements that remain visible during standard operation."
        >
          <SettingsRow
            label="Show Tabs in Zen Mode"
            description="Keep the workspace tab bar visible even in Zen Mode."
            htmlFor="zen-tabs-toggle"
          >
            <Switch
              id="zen-tabs-toggle"
              checked={focusSettings.showTabs}
              onCheckedChange={(v) => setFocusSetting("showTabs", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="Show Status Bar in Zen Mode"
            description="Keep the bottom status/theme bar visible even in Zen Mode."
            htmlFor="zen-status-toggle"
          >
            <Switch
              id="zen-status-toggle"
              checked={focusSettings.showStatusBar}
              onCheckedChange={(v) => setFocusSetting("showStatusBar", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="Show Pane Headers"
            description="Display the floating header bar on terminal panes."
            htmlFor="pane-headers-toggle"
          >
            <Switch
              id="pane-headers-toggle"
              checked={focusSettings.showPaneHeaders as boolean}
              onCheckedChange={(v) => setFocusSetting("showPaneHeaders", v)}
            />
          </SettingsRow>
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Dynamic Interaction" 
          icon={<Activity size={16} />}
          description="Behavioral triggers for the workspace environment."
        >
          <SettingsRow
            label="Auto-Hide Header"
            description="Header reveals only on top-edge proximity."
          >
            <Switch disabled />
          </SettingsRow>
          <SettingsRow
            label="Intelligent Focus"
            description="Dim inactive panes during multi-tasking."
          >
            <Switch disabled />
          </SettingsRow>
        </SettingsCard>
      </motion.div>
    </motion.div>
  );
}
