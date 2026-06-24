import * as React from "react";
import {
  FolderOpen,
  Layout,
  Code,
  CheckCircle2,
  Plus,
  Trash2,
  Bot,
  Palette,
  Zap,
  Activity,
  Cpu,
  Target,
  ShieldCheck,
  Book,
  Globe,
  Settings2,
  CornerDownLeft,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Workspace, SpaceTemplate } from "@/lib";
import { readTextFile, exists } from "@tauri-apps/plugin-fs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { m } from "framer-motion";

interface AppRightSidebarProps {
  tab: "explorer" | "layouts" | "skills" | "tasks";
  onTabChange: (tab: "explorer" | "layouts" | "skills" | "tasks") => void;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  templates: SpaceTemplate[];
  onLaunchTemplate: (template: SpaceTemplate) => Promise<void>;
  isVisible: boolean;
}

interface SkillItem {
  id: string;
  name: string;
  description: string;
  iconName: string;
  source?: string;
  sourceType?: string;
  skillPath?: string;
}

const FALLBACK_SKILLS: SkillItem[] = [
  {
    id: "design-taste-frontend",
    name: "Design Taste Frontend",
    description: "Anti-slop frontend skill for landing pages, portfolios, and redesigns.",
    iconName: "Palette",
  },
  {
    id: "emil-design-eng",
    name: "Emil Design Eng",
    description: "Philosophy on UI polish, component design, animation decisions, and details.",
    iconName: "Zap",
  },
  {
    id: "frontend-design",
    name: "Frontend Design",
    description: "Create distinctive, production-grade frontend interfaces with high quality.",
    iconName: "Layout",
  },
  {
    id: "make-interfaces-feel-better",
    name: "Make Interfaces Feel Better",
    description: "Design engineering principles for making interfaces feel polished and responsive.",
    iconName: "Activity",
  },
  {
    id: "improve",
    name: "Codebase Architect",
    description: "Survey codebase as a senior advisor and produce prioritized execution plans.",
    iconName: "Cpu",
  },
  {
    id: "redesign-existing-projects",
    name: "Redesign Projects",
    description: "Upgrades existing websites and apps to premium quality and modern aesthetics.",
    iconName: "Target",
  },
  {
    id: "ui-ux-pro-max",
    name: "UI/UX Pro Max",
    description: "UI/UX design intelligence for web/mobile with 50+ styles and 160+ palettes.",
    iconName: "Award",
  },
  {
    id: "web-animation-design",
    name: "Web Animation Design",
    description: "Design and implement web animations that feel natural and purposeful.",
    iconName: "Bot",
  },
  {
    id: "plan-mode",
    name: "Plan Mode",
    description: "Holistic, system-aware planning before implementing non-trivial tasks.",
    iconName: "Library",
  }
];

const getSkillIcon = (iconName: string) => {
  switch (iconName) {
    case "Palette": return Palette;
    case "Zap": return Zap;
    case "Activity": return Activity;
    case "Cpu": return Cpu;
    case "Target": return Target;
    case "Award": return ShieldCheck;
    case "Bot": return Bot;
    case "Library": return Book;
    case "Globe": return Globe;
    case "Settings2": return Settings2;
    default: return Book;
  }
};

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export function AppRightSidebar({
  tab,
  onTabChange,
  workspaces,
  activeWorkspaceId,
  templates,
  onLaunchTemplate,
  isVisible,
}: AppRightSidebarProps) {
  const activeWorkspace = React.useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId),
    [workspaces, activeWorkspaceId]
  );

  // Sidebar Resizing State
  const [sidebarWidth, setSidebarWidth] = React.useState(() => {
    const saved = localStorage.getItem("cortex_right_sidebar_width");
    return saved ? parseInt(saved, 10) : 280;
  });
  const [isResizing, setIsResizing] = React.useState(false);

  const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(240, Math.min(480, window.innerWidth - e.clientX));
      setSidebarWidth(newWidth);
      localStorage.setItem("cortex_right_sidebar_width", newWidth.toString());
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // ── Skills Loader ───────────────────────────────────────────────────────
  const [skills, setSkills] = React.useState<SkillItem[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    async function loadSkills() {
      const rootPath = activeWorkspace?.config?.rootPath;
      if (!rootPath) {
        if (isMounted) setSkills(FALLBACK_SKILLS);
        return;
      }

      try {
        const lockPath = `${rootPath}/skills-lock.json`;
        const hasLock = await exists(lockPath);
        if (!hasLock) {
          if (isMounted) setSkills(FALLBACK_SKILLS);
          return;
        }
        const content = await readTextFile(lockPath);
        const parsed = JSON.parse(content);
        const parsedSkills = Object.entries(parsed.skills || {}).map(([key, val]: [string, any]) => {
          let iconName = "Library";
          if (key.includes("design") || key.includes("taste")) iconName = "Palette";
          else if (key.includes("anim")) iconName = "Bot";
          else if (key.includes("feel") || key.includes("interface")) iconName = "Activity";
          else if (key.includes("improve") || key.includes("architect")) iconName = "Cpu";
          else if (key.includes("plan")) iconName = "Library";
          else if (key.includes("brainstorm")) iconName = "Zap";

          return {
            id: key,
            name: key.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
            description: `Custom customization skill. Source: ${val.source}.`,
            iconName,
            source: val.source,
            sourceType: val.sourceType,
            skillPath: val.skillPath,
          };
        });

        if (isMounted) {
          setSkills(parsedSkills.length > 0 ? parsedSkills : FALLBACK_SKILLS);
        }
      } catch (e) {
        console.warn("Failed to load skills from workspace:", e);
        if (isMounted) setSkills(FALLBACK_SKILLS);
      }
    }

    loadSkills();
    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId, activeWorkspace?.config?.rootPath]);

  // ── Tasks State ──────────────────────────────────────────────────────────
  const [taskList, setTaskList] = React.useState<TaskItem[]>(() => {
    const saved = localStorage.getItem("cortex_tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [newTaskText, setNewTaskText] = React.useState("");

  React.useEffect(() => {
    localStorage.setItem("cortex_tasks", JSON.stringify(taskList));
  }, [taskList]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: TaskItem = {
      id: crypto.randomUUID(),
      text: newTaskText.trim(),
      completed: false,
    };
    setTaskList([...taskList, newTask]);
    setNewTaskText("");
  };

  const toggleTask = (id: string) => {
    setTaskList(
      taskList.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTaskList(taskList.filter((t) => t.id !== id));
  };

  // ── Render Helpers ───────────────────────────────────────────────────────
  const renderExplorer = () => {
    if (!activeWorkspace || !activeWorkspace.config?.rootPath) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center select-none text-[var(--text-secondary)] opacity-60">
          <FolderOpen size={32} className="stroke-1 mb-2 animate-bounce" />
          <span className="text-xs font-bold uppercase tracking-wider">No active workspace</span>
          <span className="text-[10px] leading-relaxed mt-1">Open a working folder to view its contents.</span>
        </div>
      );
    }

    const folderName = activeWorkspace.config.rootPath.split(/[\\/]/).pop() || "workspace";

    return (
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 font-sans text-xs">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[var(--text-primary)] uppercase border-b border-[var(--border-color)]/20 pb-1.5 mb-2">
          <FolderOpen size={12} className="text-[var(--accent-primary)]" />
          <span>{folderName}</span>
        </div>
        
        {/* Simple Simulated Tree */}
        <div className="space-y-1 text-[var(--text-secondary)]">
          <div className="flex items-center gap-2 py-0.5 hover:text-[var(--text-primary)] cursor-pointer">
            <span className="text-emerald-500 font-bold">📁</span>
            <span>.agents</span>
          </div>
          <div className="pl-4 space-y-1">
            <div className="flex items-center gap-2 py-0.5 hover:text-[var(--text-primary)] cursor-pointer">
              <span className="text-amber-500">📁</span>
              <span>skills</span>
            </div>
            <div className="flex items-center gap-2 py-0.5 hover:text-[var(--text-primary)] cursor-pointer">
              <span className="text-sky-500">📄</span>
              <span>AGENTS.md</span>
            </div>
          </div>
          <div className="flex items-center gap-2 py-0.5 hover:text-[var(--text-primary)] cursor-pointer">
            <span className="text-emerald-500 font-bold">📁</span>
            <span>src</span>
          </div>
          <div className="pl-4 space-y-1">
            <div className="flex items-center gap-2 py-0.5 hover:text-[var(--text-primary)] cursor-pointer">
              <span className="text-amber-500">📁</span>
              <span>components</span>
            </div>
            <div className="flex items-center gap-2 py-0.5 hover:text-[var(--text-primary)] cursor-pointer">
              <span className="text-sky-500">📄</span>
              <span>App.tsx</span>
            </div>
          </div>
          <div className="flex items-center gap-2 py-0.5 hover:text-[var(--text-primary)] cursor-pointer">
            <span className="text-orange-400">📄</span>
            <span>package.json</span>
          </div>
          <div className="flex items-center gap-2 py-0.5 hover:text-[var(--text-primary)] cursor-pointer">
            <span className="text-sky-500">📄</span>
            <span>skills-lock.json</span>
          </div>
          <div className="flex items-center gap-2 py-0.5 hover:text-[var(--text-primary)] cursor-pointer">
            <span className="text-sky-500">📄</span>
            <span>README.md</span>
          </div>
        </div>
      </div>
    );
  };

  const renderLayouts = () => {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        <div className="text-[10px] font-bold tracking-wider text-[var(--text-secondary)] uppercase border-b border-[var(--border-color)]/20 pb-1.5">
          Workspace Templates
        </div>

        {templates.length === 0 ? (
          <div className="text-[10px] text-center p-4 text-[var(--text-secondary)] opacity-60">
            No templates captured. Click templates icon in header to create or load templates.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => {
                  onLaunchTemplate(tpl);
                  toast.success(`Launching space template: ${tpl.name}`);
                }}
                className="group/layout relative p-3 border border-[var(--border-color)]/30 bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.05] rounded-xl cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{tpl.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-[var(--text-primary)]/5 text-[var(--text-secondary)] font-bold tracking-wider uppercase">
                    {tpl.mode === "agents" ? "Agent" : "Terminal"}
                  </span>
                </div>
                {tpl.description && (
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed mt-1 opacity-70">
                    {tpl.description}
                  </p>
                )}
                <div className="text-[8px] text-[var(--text-secondary)] font-mono mt-2 opacity-50">
                  {tpl.rootPath}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSkills = () => {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col min-h-0">
        <div className="text-[10px] font-bold tracking-wider text-[var(--text-secondary)] uppercase border-b border-[var(--border-color)]/20 pb-1.5 mb-2 flex-shrink-0">
          Agent Capabilities Library
        </div>
        
        <div className="bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-[10px] p-2.5 rounded-lg mb-3 leading-normal font-medium flex-shrink-0">
          💡 <strong>Drag and drop</strong> any capability below into a terminal pane to automatically execute the slash command.
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto scrollbar-none pb-4">
          {skills.map((skill) => {
            const SkillIcon = getSkillIcon(skill.iconName);
            return (
              <div
                key={skill.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/cortex-skill", JSON.stringify(skill));
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="flex items-center justify-between gap-3 p-2.5 border border-[var(--border-color)]/30 hover:border-[var(--accent-primary)]/40 bg-[var(--text-primary)]/[0.01] hover:bg-[var(--text-primary)]/[0.04] rounded-xl cursor-grab active:cursor-grabbing transition-all group/skill"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-1.5 rounded-lg bg-[var(--text-primary)]/[0.04] text-[var(--text-secondary)] group-hover/skill:text-[var(--accent-primary)] group-hover/skill:bg-[var(--accent-primary)]/10 transition-all flex-shrink-0">
                    <SkillIcon size={16} />
                  </div>
                  
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                      {skill.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-medium opacity-80">
                      {skill.description}
                    </span>
                  </div>
                </div>

                {/* Inject Button */}
                <button
                  type="button"
                  draggable={false}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!activeWorkspaceId) {
                      toast.error("No active workspace to inject skill into.");
                      return;
                    }
                    window.dispatchEvent(
                      new CustomEvent("cortex:write-to-terminal", {
                        detail: {
                          workspaceId: activeWorkspaceId,
                          command: `/${skill.id}`,
                          execute: true,
                        },
                      })
                    );
                    toast.success(`Injected skill command: /${skill.id}`);
                  }}
                  className="p-1.5 opacity-0 group-hover/skill:opacity-100 hover:bg-[var(--text-primary)]/[0.06] active:scale-[0.96] rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-all cursor-pointer flex-shrink-0"
                  title="Inject command into focused terminal"
                >
                  <CornerDownLeft size={14} className="stroke-[1.5]" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTasks = () => {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col min-h-0">
        <div className="text-[10px] font-bold tracking-wider text-[var(--text-secondary)] uppercase border-b border-[var(--border-color)]/20 pb-1.5 mb-2.5 flex-shrink-0">
          Checklist / Tasks
        </div>

        {/* Input Form */}
        <form onSubmit={handleAddTask} className="flex gap-2 mb-4 flex-shrink-0">
          <Input
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a workspace task..."
            className="h-8 text-xs bg-[var(--text-primary)]/[0.02] border-[var(--border-color)]/20 focus:border-[var(--accent-primary)]/40 focus:ring-0 rounded-lg px-2.5 flex-1"
          />
          <Button
            type="submit"
            variant="default"
            size="xs"
            className="h-8 px-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white rounded-lg flex items-center justify-center"
          >
            <Plus size={14} />
          </Button>
        </form>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pb-4 scrollbar-none">
          {taskList.length === 0 ? (
            <div className="text-[10px] text-center p-4 text-[var(--text-secondary)] opacity-60">
              No tasks left! Add a new task to get started.
            </div>
          ) : (
            taskList.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 p-2 border border-[var(--border-color)]/10 bg-[var(--text-primary)]/[0.01] hover:bg-[var(--text-primary)]/[0.03] rounded-lg group/task"
              >
                <div
                  className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                  onClick={() => toggleTask(task.id)}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    readOnly
                    className="w-3.5 h-3.5 rounded border-[var(--border-color)]/40 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] accent-[var(--accent-primary)]"
                  />
                  <span
                    className={cn(
                      "text-xs font-sans truncate leading-none",
                      task.completed
                        ? "line-through text-[var(--text-secondary)] opacity-50"
                        : "text-[var(--text-primary)]"
                    )}
                  >
                    {task.text}
                  </span>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 opacity-0 group-hover/task:opacity-100 hover:bg-[var(--text-primary)]/5 rounded text-[var(--text-secondary)] hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <m.div
      animate={{ width: isVisible ? sidebarWidth : 0 }}
      transition={isResizing ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 30 }}
      className={cn(
        "h-full bg-[var(--surface-color)]/70 backdrop-blur-xl flex flex-col flex-shrink-0 z-40 select-none overflow-hidden relative",
        isVisible ? "border-l border-[var(--border-color)]/50" : "border-l-0"
      )}
    >
      {/* Resize Handle */}
      {isVisible && (
        <div
          onMouseDown={startResizing}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-all",
            isResizing ? "bg-[var(--accent-primary)]/50" : "hover:bg-[var(--accent-primary)]/20"
          )}
        />
      )}

      {/* Tab Switcher Headers */}
      <div className="h-10 border-b border-[var(--border-color)]/40 flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-0.5 h-full">
          {/* Tab 1: Explorer */}
          <button
            onClick={() => onTabChange("explorer")}
            className={cn(
              "h-10 px-2.5 flex items-center justify-center transition-all relative border-b-2",
              tab === "explorer"
                ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <FolderOpen size={14} />
          </button>

          {/* Tab 2: Layouts */}
          <button
            onClick={() => onTabChange("layouts")}
            className={cn(
              "h-10 px-2.5 flex items-center justify-center transition-all relative border-b-2",
              tab === "layouts"
                ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <Layout size={14} />
          </button>

          {/* Tab 3: Skills (Active by default) */}
          <button
            onClick={() => onTabChange("skills")}
            className={cn(
              "h-10 px-2.5 flex items-center justify-center transition-all relative border-b-2",
              tab === "skills"
                ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <Code size={14} />
          </button>

          {/* Tab 4: Tasks */}
          <button
            onClick={() => onTabChange("tasks")}
            className={cn(
              "h-10 px-2.5 flex items-center justify-center transition-all relative border-b-2",
              tab === "tasks"
                ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <CheckCircle2 size={14} />
          </button>
        </div>
      </div>

      {/* Tab Panels Content */}
      <div className="flex-1 flex flex-col min-h-0 py-2.5">
        {tab === "explorer" && renderExplorer()}
        {tab === "layouts" && renderLayouts()}
        {tab === "skills" && renderSkills()}
        {tab === "tasks" && renderTasks()}
      </div>
    </m.div>
  );
}
