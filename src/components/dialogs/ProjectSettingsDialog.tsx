import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Workspace } from "@/lib";
import { COLOR_MAP, TabColor } from "@/components/ui/interactive-tab";
import { useProjectIcon } from "@/hooks/useProjectIcon";
import {
  Folder,
  Trash2,
  Settings,
  Check,
} from "@/components/ui/icons";
import { open as openTauriDialog } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProjectSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace | undefined;
  onUpdateWorkspace: (
    id: string,
    updates: Partial<Omit<Workspace, "id" | "subTabs" | "activeSubTabId">>
  ) => void;
  onCloseWorkspace: (id: string) => void;
}

export function ProjectSettingsDialog({
  isOpen,
  onOpenChange,
  workspace,
  onUpdateWorkspace,
  onCloseWorkspace,
}: ProjectSettingsDialogProps) {
  const [name, setName] = useState("");
  const [rootPath, setRootPath] = useState("");
  const [color, setColor] = useState<TabColor | undefined>(undefined);
  const [isPinned, setIsPinned] = useState(false);
  const [customIconPath, setCustomIconPath] = useState<string | undefined>(undefined);

  // Sync state when dialog opens or workspace changes
  useEffect(() => {
    if (isOpen && workspace) {
      setName(workspace.customName || workspace.name || "");
      setRootPath(workspace.config?.rootPath || "");
      setColor(workspace.color);
      setIsPinned(!!workspace.isPinned);
      setCustomIconPath(workspace.customIconPath);
    }
  }, [isOpen, workspace]);

  const activePathForIcon = customIconPath || rootPath;
  const iconUrl = useProjectIcon(activePathForIcon);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [iconUrl]);

  if (!workspace) return null;

  const handleBrowsePath = async () => {
    try {
      const selected = await openTauriDialog({
        directory: true,
        multiple: false,
        title: "Select Workspace Folder",
      });
      if (selected && typeof selected === "string") {
        setRootPath(selected);
      }
    } catch (err) {
      console.error("Browse directory failed:", err);
      toast.error("Failed to browse directory");
    }
  };

  const handleBrowseIcon = async () => {
    try {
      const selected = await openTauriDialog({
        directory: false,
        multiple: false,
        filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "svg", "ico", "webp"] }],
        title: "Select Project Icon",
      });
      if (selected && typeof selected === "string") {
        setCustomIconPath(selected);
      }
    } catch (err) {
      console.error("Browse icon failed:", err);
      toast.error("Failed to select icon image");
    }
  };

  const handleResetIcon = () => {
    setCustomIconPath(undefined);
    toast.info("Custom icon cleared");
  };

  const handleSave = () => {
    onUpdateWorkspace(workspace.id, {
      customName: name.trim() || undefined,
      color,
      isPinned,
      customIconPath,
      config: workspace.config ? { ...workspace.config, rootPath } : { rootPath },
    });
    toast.success("Workspace settings updated");
    onOpenChange(false);
  };

  const handleRemove = () => {
    onCloseWorkspace(workspace.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[var(--surface-color)]/95 backdrop-blur-xl border-[var(--border-color)] text-[var(--text-primary)] p-5 rounded-xl shadow-2xl z-[150]">
        <DialogHeader className="p-0 flex flex-row items-center gap-2 border-b border-[var(--border-color)]/25 pb-3">
          <Settings size={18} className="text-[var(--accent-primary)] animate-spin-slow" />
          <DialogTitle className="text-sm font-black tracking-wider uppercase">
            Project Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {/* General Section */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Project Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Custom display name..."
                className="h-9 bg-white/[0.02] border-[var(--border-color)]/25 focus:border-[var(--accent-primary)]/40 rounded-lg px-3 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Workspace Path
              </label>
              <div className="flex gap-2">
                <Input
                  value={rootPath}
                  readOnly
                  placeholder="No path configured..."
                  className="h-9 flex-1 bg-white/[0.01] border-[var(--border-color)]/20 rounded-lg px-3 opacity-80 cursor-default select-all font-mono text-[10px]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBrowsePath}
                  className="h-9 px-3 border border-[var(--border-color)]/30 hover:bg-[var(--text-primary)]/5 font-bold rounded-lg shrink-0 cursor-pointer"
                >
                  Browse...
                </Button>
              </div>
            </div>
          </div>

          <hr className="border-[var(--border-color)]/15" />

          {/* Visual Style Section */}
          <div className="grid grid-cols-2 gap-4">
            {/* Color Label */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                Color Label
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {/* Default label */}
                <button
                  type="button"
                  onClick={() => setColor(undefined)}
                  className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center transition-all cursor-pointer",
                    color === undefined
                      ? "border-[var(--text-primary)] scale-110"
                      : "border-transparent bg-white/5 hover:bg-white/10"
                  )}
                  title="Default"
                >
                  {color === undefined && <Check size={11} />}
                </button>
                {/* Available colors */}
                {(Object.keys(COLOR_MAP) as TabColor[]).map((c) => {
                  const item = COLOR_MAP[c];
                  const isSelected = color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        "w-6 h-6 rounded-full border flex items-center justify-center transition-all cursor-pointer",
                        isSelected ? "border-[var(--text-primary)] scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: item.hex }}
                      title={item.label}
                    >
                      {isSelected && <Check size={11} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Icon */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                Project Icon
              </label>
              <div className="flex items-center gap-3">
                {/* Icon Preview */}
                <div className="w-10 h-10 border border-[var(--border-color)]/25 rounded-lg flex items-center justify-center bg-[var(--text-primary)]/[0.01] shrink-0 overflow-hidden">
                  {iconUrl && !imgError ? (
                    <img
                      src={iconUrl}
                      alt="Icon Preview"
                      className="w-full h-full object-contain"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <Folder size={18} className="opacity-40" />
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleBrowseIcon}
                    className="h-6 justify-start text-[10px] font-bold rounded px-2 border border-[var(--border-color)]/30 hover:bg-[var(--text-primary)]/5 cursor-pointer w-full text-center block"
                  >
                    Change...
                  </Button>
                  {customIconPath && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={handleResetIcon}
                      className="h-6 justify-start text-[10px] font-bold text-red-400 hover:bg-red-500/5 hover:text-red-400 rounded px-2 cursor-pointer w-full text-center block"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-[var(--border-color)]/15" />

          {/* Preferences Section */}
          <div className="flex items-center justify-between py-1 bg-white/[0.01] rounded-lg border border-[var(--border-color)]/10 px-3">
            <div className="space-y-0.5">
              <div className="font-bold text-[11px] text-[var(--text-primary)]">Pin Workspace</div>
              <div className="text-[10px] text-[var(--text-secondary)]">Keep this workspace pinned at the top of the sidebar.</div>
            </div>
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={cn(
                "w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 border border-transparent",
                isPinned ? "bg-[var(--accent-primary)]" : "bg-white/10"
              )}
            >
              <div
                className={cn(
                  "w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform",
                  isPinned ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[var(--border-color)]/25 pt-4 mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleRemove}
            className="h-8 text-[10px] font-bold text-red-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg px-2.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Remove Workspace</span>
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 text-[10px] font-bold rounded-lg px-3 hover:bg-[var(--text-primary)]/5 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="h-8 text-[10px] font-bold rounded-lg px-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white cursor-pointer"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
