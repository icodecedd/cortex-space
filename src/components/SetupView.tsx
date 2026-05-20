import { useState, useMemo, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { exists } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderOpen,
  Grid3X3,
  ChevronRight,
  ChevronLeft,
  Play,
  Cpu,
  Terminal,
  CheckCircle2,
  X,
  Lock,
  BookmarkPlus
} from "lucide-react";

interface SetupViewProps {
  mode: 'normal' | 'agents';
  onLaunch: (config: any) => void;
  onBack: () => void;
}

type LayoutType = '1x1' | '1x2' | '2x1' | '2x2' | '3x3';

const AGENT_PRESETS = [
  { label: "GEMINI", command: "gemini" },
  { label: "CLAUDE", command: "claude" },
  { label: "CODEX", command: "codex" },
  { label: "OPENCODE", command: "opencode" },
  { label: "CO-PILOT", command: "copilot" },
  {label: "QODO", command: "qodo"},
  {label: "CODY", command: "cody"}
];

const DEFAULT_PRESETS = [
  { label: "PROGRAMMING", path: "C:\\Users\\Chaoscedd\\Programming" },
  { label: "WEB DEV", path: "C:\\Users\\Chaoscedd\\Programming\\web-development" },
];

export function SetupView({ mode, onLaunch, onBack }: SetupViewProps) {
  const [step, setStep] = useState(1);
  const [rootPath, setRootPath] = useState("");
  const [isValidDir, setIsValidDir] = useState<boolean | null>(null);
  const [presets, setPresets] = useState<{label: string, path: string}[]>([]);
  const [layout, setLayout] = useState<LayoutType>("2x2");

  // Validate directory existence
  useEffect(() => {
    const validatePath = async () => {
      if (!rootPath) {
        setIsValidDir(null);
        return;
      }
      try {
        const isDir = await exists(rootPath);
        setIsValidDir(isDir);
      } catch (err) {
        setIsValidDir(false);
      }
    };
    validatePath();
  }, [rootPath]);

  // Load/Save Presets
  useEffect(() => {
    const saved = localStorage.getItem("cortex_presets");
    if (saved) {
      setPresets(JSON.parse(saved));
    } else {
      setPresets(DEFAULT_PRESETS);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cortex_presets", JSON.stringify(presets));
  }, [presets]);

  // Initialize panes based on default layout
  const [panes, setPanes] = useState([
    { id: 1, name: "Pane 1", command: mode === 'agents' ? AGENT_PRESETS[0].command : "npm run dev", isCustom: false },
    { id: 2, name: "Pane 2", command: mode === 'agents' ? AGENT_PRESETS[1].command : "npm run start", isCustom: false },
    { id: 3, name: "Pane 3", command: mode === 'agents' ? AGENT_PRESETS[2].command : "ls -la", isCustom: false },
    { id: 4, name: "Pane 4", command: mode === 'agents' ? AGENT_PRESETS[3].command : "git status", isCustom: false },
    { id: 5, name: "Pane 5", command: mode === 'agents' ? AGENT_PRESETS[0].command : "", isCustom: false },
    { id: 6, name: "Pane 6", command: mode === 'agents' ? AGENT_PRESETS[0].command : "", isCustom: false },
    { id: 7, name: "Pane 7", command: mode === 'agents' ? AGENT_PRESETS[0].command : "", isCustom: false },
    { id: 8, name: "Pane 8", command: mode === 'agents' ? AGENT_PRESETS[0].command : "", isCustom: false },
    { id: 9, name: "Pane 9", command: mode === 'agents' ? AGENT_PRESETS[0].command : "", isCustom: false },
  ]);

  const addPreset = () => {
    if (!rootPath) return;
    
    if (isValidDir === false) {
      toast.error("Invalid Directory", {
        description: "Cannot save a preset for a directory that does not exist.",
      });
      return;
    }

    const name = rootPath.split(/[\\/]/).filter(Boolean).pop() || "NEW PRESET";
    if (presets.some(p => p.path === rootPath)) {
      toast.error("Preset already exists", {
        description: "This directory is already in your presets list.",
      });
      return;
    }
    const newPreset = { label: name.toUpperCase(), path: rootPath };
    setPresets([...presets, newPreset]);
    toast.success("Preset saved", {
      description: `${name.toUpperCase()} has been added to your presets.`,
    });
  };

  const removePreset = (path: string) => {
    const presetToRemove = presets.find(p => p.path === path);
    if (!presetToRemove) return;

    setPresets(presets.filter(p => p.path !== path));

    toast.info("Preset removed", {
      description: `${presetToRemove.label} has been deleted.`,
      action: {
        label: "Undo",
        onClick: () => setPresets(prev => [...prev, presetToRemove])
      },
    });
  };

  const handleBreadcrumbClick = (index: number) => {
    const parts = rootPath.split(/[\\/]/).filter(Boolean);
    const newPath = parts.slice(0, index + 1).join("\\") + (parts.slice(0, index + 1).length === 1 && parts[0].includes(":") ? "\\" : "");
    setRootPath(newPath);
  };

  const handleBrowse = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Working Directory"
      });
      if (selected && typeof selected === 'string') {
        setRootPath(selected);
      }
    } catch (err) {
      console.error("Failed to open directory dialog:", err);
    }
  };

  const LayoutMiniPreview = ({ type }: { type: LayoutType }) => {
    const cols = getGridCols(type);
    const rows = getGridRows(type);
    const count = getPaneCount(type);

    return (
      <div className="layout-mini-preview" style={{ gridTemplateColumns: cols, gridTemplateRows: rows, margin: '0 auto 0.75rem' }}>
        {Array.from({ length: count }).map((_, i) => <div key={i} />)}
      </div>
    );
  };

  const paneCount = useMemo(() => {
    switch (layout) {
      case '1x1': return 1;
      case '1x2':
      case '2x1': return 2;
      case '2x2': return 4;
      case '3x3': return 9;
      default: return 4;
    }
  }, [layout]);

  const activePanes = panes.slice(0, paneCount);

  const isStepValid = useMemo(() => {
    if (step === 1) return rootPath.trim() !== "";
    if (step === 2) return activePanes.every(p => p.command.trim() !== "");
    return true;
  }, [step, rootPath, activePanes]);

  const handleLayoutChange = (newLayout: LayoutType) => {
    setLayout(newLayout);
    // Expand panes if needed
    const count = getPaneCount(newLayout);
    if (panes.length < count) {
      const extra = Array.from({ length: count - panes.length }, (_, i) => ({
        id: panes.length + i + 1,
        name: `Pane ${panes.length + i + 1}`,
        command: mode === 'agents' ? AGENT_PRESETS[0].command : "",
        isCustom: false
      }));
      setPanes([...panes, ...extra]);
    }
  };

  const handleLaunch = () => {
    onLaunch({ rootPath, layout, panes: activePanes });
  };

  const handleNext = () => {
    if (step === 1 && isValidDir === false) {
      toast.error("Invalid Directory", {
        description: "The path provided does not exist or is inaccessible.",
      });
      return;
    }
    setStep(s => Math.min(s + 1, 3));
  };
  
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="step-container animate-in">
      {/* 1. BRANDING & PROGRESS */}
      <div className="animate-in" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', transitionDelay: '0ms' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              background: 'var(--accent-primary)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img
                src="/logo.png"
                alt="Cortex"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.src = "/tauri.svg";
                }}
              />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', letterSpacing: '0.1em' }}>
                CORTEX<span style={{ color: 'var(--accent-primary)' }}> SPACE</span>
              </h2>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.1em' }}>
                WORKSPACE SETUP
              </p>
            </div>
          </div>
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="xs"
                  className="btn-tactile"
                  style={{
                    alignSelf: 'flex-start',
                    fontSize: '0.6rem',
                    padding: '0.2rem 0.5rem',
                    opacity: 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    border: 'none'
                  }}
                />
              }
            >
              <ChevronLeft size={10} />
              CHANGE OPERATION MODE
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[var(--surface-color)] border-[var(--border-color)]">
              <DialogHeader>
                <DialogTitle>Switch Operation Mode?</DialogTitle>
                <DialogDescription>
                  Changing the operation mode will reset your current progress in this setup.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" className="btn-tactile" />}>
                  Cancel
                </DialogClose>
                <Button className="primary btn-tactile" onClick={onBack}>Confirm & Reset</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="stepper-nav" style={{ margin: 0, border: 'none' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className={`step-indicator ${step === i ? 'active' : ''}`}>
              <span style={{
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${step === i ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                fontSize: '0.7rem'
              }}>{i}</span>
              {i === 1 && "WORKSPACE"}
              {i === 2 && (mode === 'agents' ? "AGENTS" : "COMMANDS")}
              {i === 3 && "PREVIEW"}
            </div>
          ))}
        </div>
      </div>

      {/* 2. STEP CONTENT */}
      <div className="animate-in" key={step} style={{ minHeight: '400px' }}>
        {step === 1 && (
          <div>
            <section className="animate-in" style={{ marginBottom: '3rem', transitionDelay: '50ms' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FolderOpen size={16} color="var(--accent-primary)" />
                01. Define Working Directory
              </h3>

              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                alignItems: 'center', 
                background: 'rgba(255,255,255,0.03)', 
                border: `1px solid ${isValidDir === false ? '#ef4444' : 'var(--border-color)'}`, 
                padding: '0 1rem', 
                borderRadius: '4px', 
                marginBottom: '1rem', 
                position: 'relative',
                transition: 'border-color 200ms ease'
              }}>
                <Lock size={14} color="var(--text-secondary)" />
                <input
                  type="text"
                  value={rootPath}
                  onChange={(e) => setRootPath(e.target.value)}
                  placeholder="NO DIRECTORY SELECTED / PASTE PATH"
                  style={{
                    padding: '0.75rem 0.5rem',
                    flex: 1,
                    fontSize: '0.8rem',
                    background: 'transparent',
                    border: 'none',
                    color: rootPath ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontFamily: 'JetBrains Mono',
                    outline: 'none'
                  }}
                />
                {rootPath && (
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setRootPath("")}
                      className="hover:text-white"
                      style={{ opacity: 0.5 }}
                    >
                      <X size={12} />
                    </Button>
                    <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 0.5rem' }} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-tactile"
                      style={{ color: 'var(--accent-primary)', gap: '0.4rem', fontSize: '0.65rem' }}
                      onClick={addPreset}
                    >
                      <BookmarkPlus size={14} />
                      SAVE PRESET
                    </Button>
                   </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="btn-tactile"
                  style={{ color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.05em' }}
                  onClick={handleBrowse}
                >
                  BROWSE
                </Button>
              </div>

              {rootPath && (
                <div
                  className="animate-in"
                  style={{
                    marginTop: '1rem',
                    fontSize: '0.65rem',
                    color: 'var(--text-secondary)',
                    fontFamily: 'JetBrains Mono',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.25rem',
                    transitionDelay: '100ms'
                  }}
                >
                  {rootPath.split(/[\\/]/).filter(Boolean).map((part, i, arr) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button
                        onClick={() => handleBreadcrumbClick(i)}
                        style={{
                          padding: '0.1rem 0.3rem',
                          border: 'none',
                          background: 'transparent',
                          color: i === arr.length - 1 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          fontSize: 'inherit',
                          fontFamily: 'inherit'
                        }}
                      >
                        {part.toUpperCase()}
                      </button>
                      {i < arr.length - 1 && <span>/</span>}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '2rem' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: 700 }}>SAVED PRESETS</div>
                
                {presets.length === 0 ? (
                  <div style={{ 
                    border: '1px dashed var(--border-color)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '2rem', 
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>NO PRESETS CONFIGURED</div>
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={addPreset} 
                      className="btn-tactile" 
                      style={{ fontSize: '0.6rem' }}
                      disabled={!rootPath || isValidDir === false}
                    >
                      {rootPath ? "SAVE CURRENT AS PRESET" : "DEFINE DIRECTORY TO START"}
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {presets.map((preset, index) => (
                      <div 
                        key={preset.path} 
                        className="animate-in group" 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          background: 'var(--surface-color)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '20px',
                          padding: '0.3rem 0.4rem 0.3rem 1rem',
                          transition: 'all 200ms ease',
                          transitionDelay: `${index * 40}ms`
                        }}
                      >
                        <button
                          onClick={() => setRootPath(preset.path)}
                          style={{
                            fontSize: '0.65rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            letterSpacing: '0.05em',
                            fontWeight: 600,
                            padding: 0,
                            marginRight: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          {preset.label}
                        </button>
                        <button
                          onClick={() => removePreset(preset.path)}
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 150ms ease',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="animate-in" style={{ transitionDelay: '150ms' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Grid3X3 size={16} color="var(--accent-primary)" />
                02. Select Pane Layout
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                {(['1x1', '1x2', '2x1', '2x2', '3x3'] as LayoutType[]).map((l, index) => (
                  <div
                    key={l}
                    onClick={() => handleLayoutChange(l)}
                    className="layout-card animate-in"
                    style={{
                      aspectRatio: '1',
                      border: `1px solid ${layout === l ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: layout === l ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                      position: 'relative',
                      willChange: 'transform',
                      transitionDelay: `${index * 40}ms`
                    }}
                  >
                    <LayoutMiniPreview type={l} />
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono',
                      color: layout === l ? 'var(--accent-primary)' : 'var(--text-secondary)'
                    }}>{l}</span>
                    {layout === l && <CheckCircle2 size={12} style={{ position: 'absolute', top: '5px', right: '5px', color: 'var(--accent-primary)' }} />}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in">
            <h3 style={{ fontSize: '0.9rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Cpu size={16} color="var(--accent-primary)" />
              03. {mode === 'agents' ? 'Configure AI Agents' : 'Define Command Protocol'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '1rem' }}>
              {activePanes.map((pane, index) => (
                <div
                  key={pane.id}
                  className="panel animate-in"
                  style={{
                    padding: '1.25rem',
                    transitionDelay: `${index * 60}ms`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono', color: 'var(--accent-primary)' }}>
                      PANE {String(pane.id).padStart(2, '0')}
                    </span>
                    {pane.command.trim() !== "" ? (
                      <CheckCircle2 size={12} className="animate-in" style={{ color: 'var(--accent-primary)' }} />
                    ) : (
                      <Terminal size={12} color="var(--text-secondary)" />
                    )}
                  </div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                    {mode === 'agents' ? 'SELECT AGENT' : 'COMMAND EXECUTION'}
                  </label>

                  {mode === 'agents' ? (
                    <Select
                      value={pane.isCustom ? "CUSTOM" : pane.command}
                      onValueChange={(value) => {
                        const newPanes = [...panes];
                        const actualIndex = panes.findIndex(p => p.id === pane.id);
                        if (value === "CUSTOM") {
                          newPanes[actualIndex].isCustom = true;
                          newPanes[actualIndex].command = "";
                        } else {
                          newPanes[actualIndex].isCustom = false;
                          newPanes[actualIndex].command = value || "";
                        }
                        setPanes(newPanes);
                      }}
                    >
                      <SelectTrigger className="w-full bg-[#000] border-[var(--border-color)] font-mono text-[0.8rem]">
                        <SelectValue placeholder="SELECT AGENT" />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--surface-color)] border-[var(--border-color)]">
                        {AGENT_PRESETS.map(preset => (
                          <SelectItem key={preset.label} value={preset.command} className="font-mono text-[0.8rem] focus:bg-[rgba(255,255,255,0.05)] focus:text-[var(--accent-primary)]">
                            {preset.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="CUSTOM" className="font-mono text-[0.8rem] focus:bg-[rgba(255,255,255,0.05)] focus:text-[var(--accent-primary)]">
                          CUSTOM COMMAND...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <input
                      type="text"
                      value={pane.command}
                      onChange={(e) => {
                        const newPanes = [...panes];
                        const actualIndex = panes.findIndex(p => p.id === pane.id);
                        newPanes[actualIndex].command = e.target.value;
                        setPanes(newPanes);
                      }}
                      style={{ fontSize: '0.8rem' }}
                      placeholder="e.g. npm run dev"
                    />
                  )}

                  {(mode === 'agents' && pane.isCustom) && (
                     <input
                     type="text"
                     value={pane.command}
                     onChange={(e) => {
                       const newPanes = [...panes];
                       const actualIndex = panes.findIndex(p => p.id === pane.id);
                       newPanes[actualIndex].command = e.target.value;
                       setPanes(newPanes);
                     }}
                     style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}
                     placeholder="custom agent command..."
                     autoFocus
                   />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
              <CheckCircle2 size={16} color="var(--accent-primary)" />
              04. Final Protocol Validation
            </h3>

            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="panel animate-in" style={{ padding: '1.5rem', transitionDelay: '100ms' }}>
                <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>SUMMARY</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>DIRECTORY</div>
                    <div style={{ fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>{rootPath || "NOT DEFINED"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>LAYOUT GRID</div>
                    <div style={{ fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>{layout}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>ACTIVE AGENTS</div>
                    <div style={{ fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>{activePanes.length} PROCESSES</div>
                  </div>
                </div>
              </div>

              {/* VISUAL GRID MINI-MAP */}
              <div className="animate-in" style={{ transitionDelay: '200ms' }}>
                <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>VIRTUAL PREVIEW</h4>
                <div style={{
                  aspectRatio: '1',
                  background: 'var(--border-color)',
                  display: 'grid',
                  gap: '2px',
                  padding: '2px',
                  gridTemplateColumns: getGridCols(layout),
                  gridTemplateRows: getGridRows(layout)
                }}>
                  {activePanes.map((pane, i) => (
                    <div
                      key={pane.id}
                      className="animate-in"
                      style={{
                        background: 'var(--bg-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transitionDelay: `${i * 50}ms`,
                        padding: '0.5rem',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{
                        fontSize: '0.5rem',
                        fontFamily: 'JetBrains Mono',
                        color: 'var(--text-secondary)',
                        textAlign: 'center'
                      }}>
                        <div style={{ color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>P {pane.id}</div>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                          {pane.command || "---"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. NAVIGATION CONTROLS */}
      <div className="animate-in" style={{
        marginTop: '3rem',
        paddingTop: '2rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        transitionDelay: '250ms'
      }}>
        <Button
          variant="ghost"
          onClick={prevStep}
          className="btn-tactile"
          style={{ visibility: step === 1 ? 'hidden' : 'visible', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ChevronLeft size={16} />
          PREVIOUS
        </Button>

        {step < 3 ? (
          <Button
            onClick={handleNext}
            disabled={!isStepValid && step !== 1}
            className="btn-tactile primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: (isStepValid || step === 1) ? 1 : 0.5,
              cursor: (isStepValid || step === 1) ? 'pointer' : 'not-allowed'
            }}
          >
            NEXT: {step === 1 ? (mode === 'agents' ? 'AGENTS' : 'COMMANDS') : 'PREVIEW'}
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            className="btn-tactile primary"
            onClick={handleLaunch}
            disabled={!isStepValid}
            style={{
              padding: '0.6rem 2.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              opacity: isStepValid ? 1 : 0.5,
              cursor: isStepValid ? 'pointer' : 'not-allowed'
            }}
          >
            <Play size={16} fill="currentColor" />
            INITIALIZE SPACE
          </Button>
        )}
      </div>
    </div>
  );
}

function getPaneCount(layout: string) {
  switch (layout) {
    case '1x1': return 1;
    case '1x2':
    case '2x1': return 2;
    case '2x2': return 4;
    case '3x3': return 9;
    default: return 4;
  }
}

function getGridCols(layout: string) {
  if (layout === '1x1') return '1fr';
  if (layout === '1x2') return '1fr 1fr';
  if (layout === '2x1') return '1fr';
  if (layout === '2x2') return '1fr 1fr';
  if (layout === '3x3') return '1fr 1fr 1fr';
  return '1fr 1fr';
}

function getGridRows(layout: string) {
  if (layout === '1x1') return '1fr';
  if (layout === '1x2') return '1fr';
  if (layout === '2x1') return '1fr 1fr';
  if (layout === '2x2') return '1fr 1fr';
  if (layout === '3x3') return '1fr 1fr 1fr';
  return '1fr 1fr';
}
