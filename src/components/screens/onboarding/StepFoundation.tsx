import { useState, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Download,
  CheckCircle2,
  FolderOpen,
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
} from "@/components/ui/icons";
import { Spotlight } from "@/components/ui/spotlight";
import type {
  SysCheck,
  PathValidationState,
  InstallableTool,
} from "@/lib/onboarding";
import { isInstallableTool } from "@/lib/onboarding";
import { ScrambleText } from "./ScrambleText";
import { BootLog } from "./BootLog";

// Step 1: Foundation (Welcome + Boot Sequence + Workspace Root + Shell & Diagnostics)
export function StepFoundation({
  path,
  setPath,
  bootFinished,
  bootChecks,
  bootFailed,
  pathValidation,
  skip,
  shell,
  setShell,
  checks,
  systemShell,
  installingTools,
  onInstallTool,
}: {
  path: string;
  setPath: (v: string) => void;
  bootFinished: boolean;
  bootChecks: SysCheck[];
  bootFailed: boolean;
  pathValidation: PathValidationState;
  skip: boolean;
  shell: string;
  setShell: (v: string) => void;
  checks: SysCheck[];
  systemShell: string;
  installingTools: Partial<Record<InstallableTool, boolean>>;
  onInstallTool: (tool: InstallableTool) => void;
}) {
  const [browseError, setBrowseError] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleBrowse = useCallback(async () => {
    setBrowseError("");
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select workspace root directory",
      });
      if (selected) setPath(selected as string);
    } catch {
      setBrowseError("Directory picker unavailable");
    }
  }, [setPath]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl text-left">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold tracking-widest text-[var(--accent-primary)] uppercase">
          Foundation Sequence
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase select-none">
          {skip ? (
            "THE COMMAND CENTER"
          ) : (
            <ScrambleText
              text="THE COMMAND CENTER"
              startDelay={100}
              duration={600}
            />
          )}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Welcome to your unified workspace. Let's perform initial diagnostics
          and verify your environment path.
        </p>
      </div>

      <div className="w-full h-[1px] bg-[var(--border-color)] opacity-20" />

      <div className="flex flex-col gap-6 w-full">
        {/* Boot Status Console */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider opacity-85">
            System Boot Status
          </span>
          <BootLog checks={bootChecks} finished={bootFinished} />
        </div>

        {bootFailed && (
          <div className="flex items-start gap-2 rounded-lg border border-[var(--ansi-red,#EF4444)]/30 bg-[var(--ansi-red,#EF4444)]/10 p-3 text-left">
            <AlertCircle
              size={14}
              className="mt-0.5 text-[var(--ansi-red,#EF4444)] shrink-0"
            />
            <span className="text-xs font-semibold text-[var(--ansi-red,#EF4444)]">
              Cortex could not complete startup checks. Resolve the failed item
              above before continuing.
            </span>
          </div>
        )}

        {/* Workspace Root configuration */}
        <AnimatePresence>
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Spotlight
                className="group relative flex flex-col md:flex-row md:items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-500 shadow-lg w-full focus-within:border-[var(--accent-primary)]/40 focus-within:bg-white/[0.04]"
                spotlightColor="rgba(var(--accent-primary-rgb), 0.05)"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-primary)] transition-all duration-500 shrink-0">
                  <FolderOpen size={20} />
                </div>

                <div className="flex-1 flex flex-col">
                  <label
                    htmlFor="workspace-root-input"
                    className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 ml-0.5 opacity-40"
                  >
                    Workspace Root Path
                  </label>
                  <Input
                    id="workspace-root-input"
                    type="text"
                    value={path}
                    onChange={(e) => {
                      setPath(e.target.value);
                      setBrowseError("");
                    }}
                    placeholder="Select a workspace folder"
                    autoComplete="off"
                    className="h-8 border-none bg-transparent px-0.5 font-mono text-xs text-[var(--text-primary)] shadow-none focus-visible:ring-0 placeholder:text-[var(--text-secondary)]/10 font-bold"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {path && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        setPath("");
                        setBrowseError("");
                      }}
                      className="h-8 w-8 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                    >
                      <X size={16} />
                    </Button>
                  )}
                  <div className="hidden md:block w-px h-6 bg-white/10 mx-1" />
                  <Button
                    onClick={handleBrowse}
                    className="btn-tactile primary h-9 px-4 font-bold text-xs tracking-wider rounded-lg flex items-center gap-1.5"
                  >
                    <FolderOpen size={13} />
                    BROWSE
                  </Button>
                </div>
              </Spotlight>

              {browseError && (
                <span className="text-xs font-semibold text-red-500 tracking-wide mt-1">
                  {browseError}
                </span>
              )}
              {pathValidation.status !== "idle" && (
                <span
                  className={`text-xs font-semibold tracking-wide mt-1 flex items-center gap-1.5 ${
                    pathValidation.status === "invalid"
                      ? "text-[var(--ansi-red,#EF4444)]"
                      : pathValidation.status === "valid"
                        ? "text-[var(--ansi-green,#10B981)]"
                        : "text-[var(--accent-primary)]"
                  }`}
                >
                  {pathValidation.status === "checking" && (
                    <Loader2 size={12} className="animate-spin" />
                  )}
                  {pathValidation.status === "valid" && (
                    <CheckCircle2 size={12} />
                  )}
                  {pathValidation.status === "invalid" && (
                    <AlertCircle size={12} />
                  )}
                  {pathValidation.message}
                </span>
              )}
              {pathValidation.normalizedPath && (
                <span className="text-[10px] font-mono text-[var(--text-secondary)] opacity-60 break-all">
                  Resolved path: {pathValidation.normalizedPath}
                </span>
              )}
            </div>

            <p className="text-[11px] text-[var(--text-secondary)] opacity-60 leading-normal">
              Workspace path directs your default working directory for code
              sessions and agent triggers. Relative values resolve inside your
              home directory; leave blank to use home.
            </p>
          </m.div>
        </AnimatePresence>

        {/* Expandable Advanced Section */}
        <div className="border border-[var(--border-color)]/30 rounded-lg bg-[var(--surface-color)]/20 overflow-hidden mt-2">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="w-full flex items-center justify-between p-3.5 font-bold text-xs uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--surface-color)]/40 transition-colors select-none"
          >
            <div className="flex items-center gap-2">
              <Settings
                size={14}
                className={
                  isAdvancedOpen
                    ? "text-[var(--accent-primary)] animate-pulse"
                    : "text-[var(--text-secondary)]"
                }
              />
              <span>Advanced System Configurations</span>
            </div>
            {isAdvancedOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>

          <AnimatePresence initial={false}>
            {isAdvancedOpen && (
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden border-t border-[var(--border-color)]/20"
              >
                <div className="p-4 flex flex-col gap-6 bg-[var(--bg-color)]/20">
                  {/* Shell Selector */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="custom-shell-input"
                      className="text-xs font-bold text-[var(--text-primary)]"
                    >
                      System Shell Executable
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="custom-shell-input"
                        value={shell}
                        onChange={(e) => setShell(e.target.value)}
                        placeholder={`System Default (Detected: ${systemShell})`}
                        autoComplete="off"
                        className="h-9 font-mono text-xs bg-[var(--surface-color)] border-[var(--border-color)]"
                      />
                      <div className="flex gap-1.5 shrink-0">
                        {["powershell.exe", "cmd.exe", "wsl.exe"].map((sh) => (
                          <button
                            key={sh}
                            type="button"
                            onClick={() => setShell(sh)}
                            className={`px-2 rounded text-[10px] font-mono font-bold border transition-colors ${
                              shell === sh
                                ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)]"
                                : "bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40"
                            }`}
                          >
                            {sh.split(".")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] opacity-55">
                      Type an executable name (like{" "}
                      <code className="font-mono">zsh</code>) or select a
                      pre-populated preset. Leave blank to inherit system shell.
                    </p>
                  </div>

                  {/* Scan section */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      System Diagnostics
                    </span>
                    <div className="flex flex-col border border-[var(--border-color)] rounded-xl bg-[var(--bg-color)]/20 divide-y divide-[var(--border-color)]/40 overflow-hidden font-mono text-[11px]">
                      {checks.map((check) => (
                        <div
                          key={check.id}
                          className="flex justify-between items-center p-2.5"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-[var(--text-primary)]">
                              {check.label}
                            </span>
                            <span className="text-[9px] text-[var(--text-secondary)] opacity-65">
                              {check.detail || check.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isInstallableTool(check.id) &&
                              check.status === "fail" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onInstallTool(check.id as InstallableTool)
                                  }
                                  disabled={installingTools[check.id]}
                                  className="h-6 px-2 rounded border border-[var(--ansi-red,#EF4444)]/40 bg-[var(--surface-color)] text-[9px] font-bold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 disabled:opacity-60 inline-flex items-center gap-1"
                                >
                                  {installingTools[check.id] ? (
                                    <Loader2
                                      size={10}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Download size={10} />
                                  )}
                                  Install
                                </button>
                              )}
                            {check.status === "checking" && (
                              <m.div
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                                className="w-2.5 h-2.5 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent"
                              />
                            )}
                            {check.status === "ok" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--ansi-green, #10B981)]" />
                            )}
                            {check.status === "warn" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--ansi-yellow, #F59E0B)]" />
                            )}
                            {check.status === "fail" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--ansi-red, #EF4444)]" />
                            )}
                            <span
                              className="font-bold uppercase tracking-wider text-[9px]"
                              style={{
                                color:
                                  check.status === "ok"
                                    ? "var(--ansi-green)"
                                    : check.status === "checking"
                                      ? "var(--accent-primary)"
                                      : "var(--text-secondary)",
                              }}
                            >
                              {check.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
