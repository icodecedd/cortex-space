import { SettingsCard } from "../shared/SettingsUI";
import { Button } from "@/components/ui/button";
import { Info, Book, RefreshCcw, Loader2, CheckCircle2, AlertCircle, Download, Github, ExternalLink } from "@/components/ui/icons";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";

type UpdateStatus = 'idle' | 'checking' | 'up-to-date' | 'available' | 'downloading' | 'installing' | 'error';

export function AboutTab() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateBody, setUpdateBody] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [updateObject, setUpdateObject] = useState<any>(null);

  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

  const handleViewGithub = async () => {
    const repoUrl = "https://github.com/icodecedd/cortex-space";
    try {
      if (!isTauri) {
        window.open(repoUrl, "_blank");
        return;
      }
      await openUrl(repoUrl);
    } catch (e: any) {
      console.error("Failed to open URL:", e);
      toast.error("Failed to open link", {
        description: e?.message || "An unexpected error occurred while trying to open GitHub."
      });
    }
  };

  const handleReportIssue = async () => {
    const issueUrl = "https://github.com/icodecedd/cortex-space/issues";
    try {
      if (!isTauri) {
        window.open(issueUrl, "_blank");
        return;
      }
      await openUrl(issueUrl);
    } catch (e: any) {
      console.error("Failed to open URL:", e);
      toast.error("Failed to open link", {
        description: e?.message || "An unexpected error occurred while trying to open the issue tracker."
      });
    }
  };

  const handleCheckUpdates = async () => {
    setStatus("checking");
    setErrorMsg(null);
    setProgress(0);

    try {
      if (!isTauri) {
        // Mock update flow in browser dev environment to demonstrate the feature
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setStatus("available");
        setUpdateVersion("v0.1.1-alpha");
        setUpdateBody("• Added multi-terminal workspace tabs\n• Improved agent search auto-completion\n• Optimized layout resize rendering speed");
        return;
      }

      const update = await check();
      if (update) {
        setStatus("available");
        setUpdateVersion(update.version);
        setUpdateBody(update.body || null);
        setUpdateObject(update);
      } else {
        setStatus("up-to-date");
        toast.success("Cortex is up to date", {
          description: "You are already using the latest version of Cortex Space."
        });
      }
    } catch (e: any) {
      console.error("Failed to check for updates:", e);
      setStatus("error");
      
      const rawError = e?.message || String(e);
      let friendlyError = rawError;
      if (
        rawError.includes("404") || 
        rawError.toLowerCase().includes("status code 404") || 
        rawError.toLowerCase().includes("not found") ||
        rawError.toLowerCase().includes("release json")
      ) {
        friendlyError = "Release metadata (latest.json) not found on GitHub. Please ensure you have created a release and uploaded the latest.json file as an asset.";
      }
      
      setErrorMsg(friendlyError);
      toast.error("Failed to check for updates", {
        description: friendlyError
      });
    }
  };

  const handleInstallUpdate = async () => {
    if (!isTauri) {
      // Mock download & install in browser
      setStatus("downloading");
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      setStatus("installing");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Update installed", {
        description: "Relaunching to apply changes..."
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      window.location.reload();
      return;
    }

    if (!updateObject) return;

    try {
      setStatus("downloading");
      let downloaded = 0;
      let contentLength = 0;

      await updateObject.downloadAndInstall((progressEvent: any) => {
        if (progressEvent) {
          if (progressEvent.event === 'Started') {
            contentLength = progressEvent.contentLength || 0;
          } else if (progressEvent.event === 'Progress') {
            downloaded = progressEvent.progress || 0;
            const total = progressEvent.contentLength || contentLength || 0;
            if (total > 0) {
              const pct = Math.round((downloaded / total) * 100);
              setProgress(pct);
            }
          }
        }
      });

      setStatus("installing");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Installation complete", {
        description: "Relaunching application..."
      });

      await relaunch();
    } catch (e: any) {
      console.error("Update installation failed:", e);
      setStatus("error");
      setErrorMsg(e?.message || String(e));
      toast.error("Installation failed", {
        description: e?.message || "Failed to download or install update."
      });
    }
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

  const panelVariants: Variants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto', 
      marginTop: 16,
      transition: { 
        height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.2, delay: 0.1 }
      } 
    },
    exit: { 
      opacity: 0, 
      height: 0, 
      marginTop: 0,
      transition: { 
        opacity: { duration: 0.15 },
        height: { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
      } 
    }
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
          title="System Identity" 
          icon={<Info size={16} />}
          description="Version information and core environment details."
        >
          <div className="flex flex-col items-center py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--border-color)]/40 flex items-center justify-center shadow-inner border border-[var(--border-color)] p-2.5 group hover:border-[var(--accent-primary)]/40 transition-colors duration-500">
              <img
                src="/cortex-new-logo.png"
                alt="Cortex Logo"
                className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-700"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                Cortex Space
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono opacity-60">
                Release v0.1.0-alpha
              </p>
            </div>
            <p className="text-[12.5px] text-[var(--text-secondary)] max-w-[280px] text-center leading-relaxed font-medium">
              A fast and customizable workspace manager. Designed
              for high productivity and rich aesthetics.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-2">
              <Button 
                variant="outline" 
                className="h-8 text-[10px] px-3 font-bold bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] transition-all"
                onClick={() => toast.info("Documentation coming soon", {
                  description: "We are currently compiling the user guides and developer documents."
                })}
              >
                <Book size={12} className="mr-2" /> Documentation
              </Button>
              <Button 
                variant="outline" 
                className="h-8 text-[10px] px-3 font-bold bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 text-white border-zinc-700/50 hover:border-zinc-500 hover:brightness-110 shadow-md transition-all"
                onClick={handleViewGithub}
              >
                <Github size={12} className="mr-2" /> View GitHub
              </Button>
              <Button 
                variant="outline" 
                className="h-8 text-[10px] px-3 font-bold bg-[var(--text-primary)]/[0.03] border-[var(--border-color)]/20 hover:bg-[var(--text-primary)]/[0.05] transition-all"
                onClick={handleReportIssue}
              >
                <ExternalLink size={12} className="mr-2" /> Report Issue
              </Button>
              <Button 
                variant="outline" 
                className="h-8 text-[10px] px-3 font-bold bg-[var(--text-primary)]/[0.03] border-[var(--border-color)]/20 hover:bg-[var(--text-primary)]/[0.05] transition-all"
                onClick={handleCheckUpdates}
                disabled={status === "checking" || status === "downloading" || status === "installing"}
              >
                {status === "checking" ? (
                  <Loader2 size={12} className="mr-2 animate-spin" />
                ) : (
                  <RefreshCcw size={12} className="mr-2" />
                )}
                Check Updates
              </Button>
            </div>

            <AnimatePresence>
              {status !== "idle" && (
                <motion.div
                  variants={panelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full max-w-md border border-[var(--border-color)]/20 rounded-xl bg-[var(--text-primary)]/[0.01] overflow-hidden text-left"
                >
                  <div className="p-4 space-y-3">
                    {status === "checking" && (
                      <div className="flex items-center gap-3 py-2">
                        <Loader2 size={16} className="text-[var(--accent-primary)] animate-spin" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-[var(--text-primary)]">Checking for updates...</span>
                          <span className="text-[9.5px] text-[var(--text-secondary)] opacity-60">Connecting to distribution server</span>
                        </div>
                      </div>
                    )}

                    {status === "up-to-date" && (
                      <div className="flex items-center gap-3 py-2">
                        <CheckCircle2 size={16} className="text-ansi-green" />
                        <div className="flex-1 flex flex-col">
                          <span className="text-[11px] font-bold text-[var(--text-primary)]">Cortex is up to date</span>
                          <span className="text-[9.5px] text-[var(--text-secondary)] opacity-60">Running release v0.1.0-alpha</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="xs" 
                          className="h-6 px-2 text-[9.5px] font-bold border border-[var(--border-color)]/10" 
                          onClick={() => setStatus("idle")}
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}

                    {status === "available" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                            <span className="text-[11px] font-bold text-[var(--text-primary)]">Update Available</span>
                          </div>
                          <span className="text-[9.5px] font-mono font-bold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-1.5 py-0.5 rounded">
                            {updateVersion}
                          </span>
                        </div>

                        {updateBody && (
                          <div className="bg-[var(--text-primary)]/[0.02] border border-[var(--border-color)]/10 rounded-lg p-2.5 max-h-32 overflow-y-auto scrollbar-thin">
                            <p className="text-[9px] font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-1">Release Highlights</p>
                            <pre className="text-[10px] font-mono text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed opacity-80">{updateBody}</pre>
                          </div>
                        )}

                        <div className="flex gap-2 justify-end pt-1">
                          <Button 
                            variant="ghost" 
                            size="xs" 
                            className="h-7 text-[10px] font-bold px-3" 
                            onClick={() => setStatus("idle")}
                          >
                            Later
                          </Button>
                          <Button 
                            size="xs" 
                            className="h-7 px-4 bg-[var(--accent-primary)] text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/90 font-bold tracking-tight text-[10px] gap-1.5"
                            onClick={handleInstallUpdate}
                          >
                            <Download size={10} /> Install Update
                          </Button>
                        </div>
                      </div>
                    )}

                    {(status === "downloading" || status === "installing") && (
                      <div className="space-y-3 py-1">
                        <div className="flex justify-between items-center text-[10.5px] font-bold">
                          <span className="text-[var(--text-primary)]">
                            {status === "downloading" ? "Downloading Update..." : "Installing Update..."}
                          </span>
                          <span className="font-mono text-[var(--accent-primary)]">{progress}%</span>
                        </div>

                        <div className="h-1.5 w-full bg-[var(--border-color)]/20 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-[var(--accent-primary)]" 
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>

                        <p className="text-[9.5px] text-[var(--text-secondary)] opacity-60">
                          {status === "downloading" 
                            ? "Fetching package from repository..." 
                            : "Extracting assets and preparing relaunch"}
                        </p>
                      </div>
                    )}

                    {status === "error" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <AlertCircle size={16} className="text-ansi-red" />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-[var(--text-primary)]">Update Failed</span>
                            <span className="text-[9.5px] text-[var(--text-secondary)] opacity-60">Could not complete updater cycle</span>
                          </div>
                        </div>

                        {errorMsg && (
                          <div className="bg-red-500/[0.02] border border-red-500/10 rounded-lg p-2.5">
                            <pre className="text-[9.5px] font-mono text-red-400 whitespace-pre-wrap break-all leading-normal">{errorMsg}</pre>
                          </div>
                        )}

                        <div className="flex gap-2 justify-end pt-1">
                          <Button 
                            variant="ghost" 
                            size="xs" 
                            className="h-7 text-[10px] font-bold px-3" 
                            onClick={() => setStatus("idle")}
                          >
                            Close
                          </Button>
                          <Button 
                            size="xs" 
                            className="h-7 px-4 bg-[var(--text-primary)]/[0.04] border border-[var(--border-color)]/20 hover:bg-[var(--text-primary)]/[0.06] font-bold tracking-tight text-[10px]"
                            onClick={handleCheckUpdates}
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SettingsCard>
      </motion.div>
    </motion.div>
  );
}
