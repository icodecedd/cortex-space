import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { INITIAL_STEP, MAX_STEP } from "@/lib/setup-constants";
import { useWorkspaceDirectory } from "@/hooks/useWorkspaceDirectory";
import { usePresets } from "@/hooks/usePresets";
import { useSetupPanes } from "@/hooks/useSetupPanes";
import { useSnippets } from "@/hooks/useSnippets";
import { useAgents } from "@/hooks/useAgents";
import { SetupHeader } from "./components/SetupHeader";
import { SetupControls } from "./components/SetupControls";
import { StepWorkspace } from "./components/steps/StepWorkspace";
import { StepConfigure } from "./components/steps/StepConfigure";
import { StepPreview } from "./components/steps/StepPreview";
import { gridToLayoutNode } from "@/lib/setup-utils";
import { LayoutNode } from "@/types";
import { PaneConfig } from "@/lib/setup-constants";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SetupViewProps {
  mode: 'normal' | 'agents';
  onLaunch: (config: { rootPath: string; layout: LayoutNode; panes: PaneConfig[] }) => void;
  onBack: () => void;
}

export function SetupView({ mode, onLaunch, onBack }: SetupViewProps) {
  const [step, setStep] = useState(INITIAL_STEP);
  
  const {
    rootPath,
    setRootPath,
    isValidDir,
    handleBrowse,
    handleBreadcrumbClick,
    defaultDir
  } = useWorkspaceDirectory();

  const {
    presets,
    addPreset,
    removePreset
  } = usePresets(rootPath || defaultDir, isValidDir);

  const { snippets } = useSnippets();
  const { agents } = useAgents();

  const {
    layoutType,
    customLayout,
    setCustomLayout,
    savedLayouts,
    addSavedLayout,
    removeSavedLayout,
    currentLayout,
    activePanes,
    handleLayoutChange,
    updatePaneCommand,
    updatePaneName,
    updateAllPaneCommands,
    restoreDefaults,
    isInitialized
  } = useSetupPanes(agents);

  const isStepValid = useMemo(() => {
    if (step === 1) return (rootPath || defaultDir).trim() !== "";
    if (step === 2) return true; // Allow proceeding even if command inputs are empty
    return true;
  }, [step, rootPath, defaultDir, activePanes]);

  const handleNext = () => {
    if (step === 1 && isValidDir === false && rootPath !== "") {
      toast.error("Failed to open directory", {
        description: "The provided path does not exist or is inaccessible.",
      });
      return;
    }
    setStep(s => Math.min(s + 1, MAX_STEP));
  };
  
  const prevStep = () => setStep(s => Math.max(s - 1, INITIAL_STEP));

  const handleLaunch = () => {
    const layoutNode = gridToLayoutNode(currentLayout, activePanes);
    onLaunch({ 
      rootPath: rootPath || defaultDir, 
      layout: layoutNode, 
      panes: activePanes 
    });
  };

  // Keyboard navigation shortcuts for the setup process
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Next / Launch (Enter)
      if (e.key === 'Enter') {
        if (e.ctrlKey || e.metaKey || step === MAX_STEP) {
          if (isStepValid) handleLaunch();
          return;
        }
        if (isStepValid) handleNext();
      }

      // 2. Previous / Cancel (Esc)
      if (e.key === 'Escape') {
        if (step > 1) {
          prevStep();
        } else {
          onBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, isStepValid, isValidDir, rootPath, defaultDir, currentLayout, activePanes, onBack]);


  return (
    <div className="step-container flex flex-col h-full overflow-hidden">
      <SetupHeader step={step} mode={mode} onBack={onBack} />

      <ScrollArea className="flex-1 -mx-4 px-4 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, y: 15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.99 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pb-12 pt-2"
          >
            {step === 1 && (
              <StepWorkspace
                rootPath={rootPath}
                setRootPath={setRootPath}
                defaultDir={defaultDir}
                isValidDir={isValidDir}
                handleBrowse={handleBrowse}
                handleBreadcrumbClick={handleBreadcrumbClick}
                presets={presets}
                addPreset={addPreset}
                removePreset={removePreset}
                layout={layoutType}
                handleLayoutChange={handleLayoutChange}
                customLayout={customLayout}
                setCustomLayout={setCustomLayout}
                savedLayouts={savedLayouts}
                addSavedLayout={addSavedLayout}
                removeSavedLayout={removeSavedLayout}
                onRestoreLayouts={restoreDefaults}
                isInitialized={isInitialized}
              />
            )}

            {step === 2 && (
              <StepConfigure
                mode={mode}
                activePanes={activePanes}
                updatePaneCommand={updatePaneCommand}
                updatePaneName={updatePaneName}
                updateAllPaneCommands={updateAllPaneCommands}
                snippets={snippets}
                agents={agents}
              />
            )}

            {step === 3 && (
              <StepPreview
                rootPath={rootPath}
                defaultDir={defaultDir}
                layout={currentLayout}
                activePanes={activePanes}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </ScrollArea>

      <SetupControls
        step={step}
        isStepValid={isStepValid}
        onPrev={prevStep}
        onNext={handleNext}
        onLaunch={handleLaunch}
        mode={mode}
      />
    </div>
  );
}
