import { useState, useMemo } from "react";
import { toast } from "sonner";
import { INITIAL_STEP, MAX_STEP } from "@/lib/setup-constants";
import { useWorkspaceDirectory } from "@/hooks/useWorkspaceDirectory";
import { usePresets } from "@/hooks/usePresets";
import { useSetupPanes } from "@/hooks/useSetupPanes";
import { SetupHeader } from "./setup/SetupHeader";
import { SetupControls } from "./setup/SetupControls";
import { StepWorkspace } from "./setup/steps/StepWorkspace";
import { StepConfigure } from "./setup/steps/StepConfigure";
import { StepPreview } from "./setup/steps/StepPreview";

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
    layout,
    activePanes,
    handleLayoutChange,
    updatePaneCommand
  } = useSetupPanes(mode);

  const isStepValid = useMemo(() => {
    if (step === 1) return rootPath.trim() !== "";
    if (step === 2) return activePanes.every(p => p.command.trim() !== "");
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
    onLaunch({ rootPath, layout, panes: activePanes });
  };

  return (
    <div className="step-container animate-in">
      <SetupHeader step={step} mode={mode} onBack={onBack} />

      <div className="animate-in" key={step} style={{ minHeight: '400px' }}>
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
            layout={layout}
            handleLayoutChange={handleLayoutChange}
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
            layout={layout}
            activePanes={activePanes}
          />
        )}
      </div>

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
