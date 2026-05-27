import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { INITIAL_STEP, MAX_STEP } from "@/lib/setup-constants";
import { useWorkspaceDirectory } from "@/hooks/useWorkspaceDirectory";
import { usePresets } from "@/hooks/usePresets";
import { useSetupPanes } from "@/hooks/useSetupPanes";
import { gridToLayoutNode } from "@/lib/setup-utils";
import { SetupHeader } from "./setup/SetupHeader";
import { SetupControls } from "./setup/SetupControls";
import { StepWorkspace } from "./setup/steps/StepWorkspace";
import { StepConfigure } from "./setup/steps/StepConfigure";
import { StepPreview } from "./setup/steps/StepPreview";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SetupViewProps {
  mode: 'normal' | 'agents';
  onLaunch: (config: any) => void;
  onBack: () => void;
}

export function SetupView({ mode, onLaunch, onBack }: SetupViewProps) {
  const [step, setStep] = useState(INITIAL_STEP);

  const {
    rootPath,
    setRootPath,
    isValidDir,
    handleBrowse,
    handleBreadcrumbClick
  } = useWorkspaceDirectory();

  const {
    presets,
    addPreset,
    removePreset
  } = usePresets(rootPath, isValidDir);

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
    restoreDefaults
  } = useSetupPanes(mode);

  const isStepValid = useMemo(() => {
    if (step === 1) return rootPath.trim() !== "";
    if (step === 2) return true; // Allow proceeding even if command inputs are empty
    return true;
  }, [step, rootPath, activePanes]);

  const handleNext = () => {
    if (step === 1 && isValidDir === false) {
      toast.error("Invalid Directory", {
        description: "The path provided does not exist or is inaccessible.",
      });
      return;
    }
    setStep(s => Math.min(s + 1, MAX_STEP));
  };
  
  const prevStep = () => setStep(s => Math.max(s - 1, INITIAL_STEP));

  const handleLaunch = () => {
    const layoutNode = gridToLayoutNode(currentLayout, activePanes);
    onLaunch({ 
      rootPath, 
      layout: layoutNode, 
      panes: activePanes 
    });
  };

  // Keyboard navigation shortcuts for the setup process (Emil Kowalski speed & accessibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Next / Advance (Ctrl/Cmd + Enter)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        
        // Ctrl+Shift+Enter triggers SKIP PREVIEW & LAUNCH in step 2
        if (step === 2 && e.shiftKey) {
          if (isStepValid) {
            handleLaunch();
          }
          return;
        }

        if (step < 3) {
          if (isStepValid || step === 1) {
            handleNext();
          }
        } else {
          if (isStepValid) {
            handleLaunch();
          }
        }
      }

      // 2. Previous / Cancel (Esc)
      if (e.key === 'Escape') {
        e.preventDefault();
        if (step > 1) {
          prevStep();
        } else {
          onBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, isStepValid, isValidDir, rootPath, currentLayout, activePanes, onBack]);


  return (
    <div className="step-container animate-in flex flex-col h-full overflow-hidden">
      <SetupHeader step={step} mode={mode} onBack={onBack} />

      <ScrollArea className="flex-1 -mx-4 px-4 min-h-0">
        <div className="animate-in pb-12 pt-2" key={step}>
          {step === 1 && (
            <StepWorkspace
              rootPath={rootPath}
              setRootPath={setRootPath}
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
            />
          )}

          {step === 2 && (
            <StepConfigure
              mode={mode}
              activePanes={activePanes}
              updatePaneCommand={updatePaneCommand}
            />
          )}

          {step === 3 && (
            <StepPreview
              rootPath={rootPath}
              layout={currentLayout}
              activePanes={activePanes}
            />
          )}
        </div>
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
