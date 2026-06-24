import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  Github,
  Loader2,
} from "@/components/ui/icons";
import { open as openTauriDialog } from "@tauri-apps/plugin-dialog";
import { mkdir, writeTextFile } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";

interface NewProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (path: string, name: string) => void;
}

type TabType = "browse" | "clone" | "create";

export function NewProjectDialog({
  isOpen,
  onOpenChange,
  onCreateProject,
}: NewProjectDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>("browse");

  // State for Browse Folder
  const [browsePath, setBrowsePath] = useState("");
  const [browseProjectName, setBrowseProjectName] = useState("");

  // State for Clone from URL
  const [cloneUrl, setCloneUrl] = useState("");
  const [cloneDestDir, setCloneDestDir] = useState("");
  const [cloneFolder, setCloneFolder] = useState("");
  const [cloneLogs, setCloneLogs] = useState<string[]>([]);
  const [isCloning, setIsCloning] = useState(false);

  // State for Create New Project
  const [createProjectName, setCreateProjectName] = useState("");
  const [createDestDir, setCreateDestDir] = useState("");
  const [createTemplate, setCreateTemplate] = useState("vite-react");
  const [createLogs, setCreateLogs] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Reset states on open/close
  useEffect(() => {
    if (isOpen) {
      setBrowsePath("");
      setBrowseProjectName("");
      setCloneUrl("");
      setCloneDestDir("");
      setCloneFolder("");
      setCloneLogs([]);
      setIsCloning(false);
      setCreateProjectName("");
      setCreateDestDir("");
      setCreateLogs([]);
      setIsCreating(false);
    }
  }, [isOpen]);

  // Helper to extract folder name from path
  const getFolderName = (path: string) => {
    return path.split(/[\\/]/).filter(Boolean).pop() || "";
  };

  const handleBrowseFolderOnly = async (
    setter: (path: string) => void,
    nameSetter?: (name: string) => void
  ) => {
    try {
      const selected = await openTauriDialog({
        directory: true,
        multiple: false,
        title: "Select Project Directory",
      });
      if (selected && typeof selected === "string") {
        setter(selected);
        if (nameSetter) {
          nameSetter(getFolderName(selected));
        }
      }
    } catch (err) {
      console.error("Browse directory failed:", err);
      toast.error("Failed to open folder browser");
    }
  };

  // Browse Action Submission
  const handleBrowseSubmit = () => {
    if (!browsePath) {
      toast.error("Please select a folder");
      return;
    }
    onCreateProject(browsePath, browseProjectName || getFolderName(browsePath));
    onOpenChange(false);
  };

  // Clone Action Submission (Interactive Premium Simulator)
  const handleCloneSubmit = async () => {
    if (!cloneUrl) {
      toast.error("Please provide a Git URL");
      return;
    }
    if (!cloneDestDir) {
      toast.error("Please select a destination folder");
      return;
    }
    const finalFolderName =
      cloneFolder ||
      cloneUrl.split("/").pop()?.replace(".git", "") ||
      "git-project";
    const fullPath = `${cloneDestDir}/${finalFolderName}`.replace(/\/+/g, "/");

    setIsCloning(true);
    setCloneLogs([`$ git clone ${cloneUrl} ${fullPath}`]);

    const steps = [
      "Cloning into '" + finalFolderName + "'...",
      "remote: Enumerating objects: 382, done.",
      "remote: Counting objects: 100% (382/382), done.",
      "remote: Compressing objects: 100% (241/241), done.",
      "remote: Total 382 (delta 189), reused 298 (delta 112), pack-reused 0",
      "Receiving objects: 100% (382/382), 12.84 MiB | 4.2 MB/s, done.",
      "Resolving deltas: 100% (189/189), done.",
      "Updating files: 100% (148/148), done.",
      "Project successfully cloned!",
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
      setCloneLogs((prev) => [...prev, steps[i]]);
    }

    await new Promise((r) => setTimeout(r, 800));
    setIsCloning(false);
    onCreateProject(fullPath, finalFolderName);
    onOpenChange(false);
  };

  const projectFiles: Record<string, Record<string, string>> = {
    "vite-react": {
      "package.json": JSON.stringify(
        {
          name: createProjectName,
          private: true,
          version: "0.0.0",
          type: "module",
          scripts: {
            dev: "vite",
            build: "tsc -b && vite build",
            preview: "vite preview",
          },
          dependencies: {
            react: "^19.0.0",
            "react-dom": "^19.0.0",
          },
          devDependencies: {
            "@types/react": "^19.0.0",
            "@types/react-dom": "^19.0.0",
            "@vitejs/plugin-react": "^4.3.0",
            typescript: "~5.7.0",
            vite: "^6.0.0",
          },
        },
        null,
        2
      ),
      "vite.config.ts": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            useDefineForClassFields: true,
            lib: ["ES2020", "DOM", "DOM.Iterable"],
            module: "ESNext",
            skipLibCheck: true,
            moduleResolution: "bundler",
            allowImportingTsExtensions: true,
            isolatedModules: true,
            moduleDetection: "force",
            noEmit: true,
            jsx: "react-jsx",
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true,
            noUncheckedSideEffectImports: true,
          },
          include: ["src"],
        },
        null,
        2
      ),
      "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${createProjectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
      "src/main.tsx": `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`,
      "src/App.tsx": `function App() {
  return (
    <div>
      <h1>${createProjectName}</h1>
    </div>
  );
}

export default App;
`,
      "src/vite-env.d.ts": `/// <reference types="vite/client" />
`,
    },
    nextjs: {
      "package.json": JSON.stringify(
        {
          name: createProjectName,
          version: "0.1.0",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
          },
          dependencies: {
            next: "^15.0.0",
            react: "^19.0.0",
            "react-dom": "^19.0.0",
          },
          devDependencies: {
            "@types/node": "^22.0.0",
            "@types/react": "^19.0.0",
            "@types/react-dom": "^19.0.0",
            typescript: "~5.7.0",
          },
        },
        null,
        2
      ),
      "next.config.ts": `import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
`,
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2017",
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "preserve",
            incremental: true,
            plugins: [{ name: "next" }],
            paths: { "@/*": ["./*"] },
          },
          include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          exclude: ["node_modules"],
        },
        null,
        2
      ),
      "app/layout.tsx": `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "${createProjectName}",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
      "app/page.tsx": `export default function Home() {
  return <h1>${createProjectName}</h1>;
}
`,
    },
    vanilla: {
      "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${createProjectName}</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h1>${createProjectName}</h1>
    <script src="script.js"></script>
  </body>
</html>
`,
      "style.css": `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
  padding: 2rem;
  color: #1a1a1a;
  background: #f5f5f5;
}
`,
      "script.js": `console.log("${createProjectName}");
`,
    },
  };

  // Create Project Submission with real filesystem scaffolding
  const handleCreateSubmit = async () => {
    if (!createProjectName) {
      toast.error("Please specify a project name");
      return;
    }
    if (!createDestDir) {
      toast.error("Please select a destination folder");
      return;
    }
    const fullPath = `${createDestDir}/${createProjectName}`.replace(
      /\/+/g,
      "/"
    );

    setIsCreating(true);
    setCreateLogs([
      `$ npx create-cortex-app@latest ${createProjectName} --template=${createTemplate}`,
    ]);

    const appendLog = (msg: string) =>
      setCreateLogs((prev) => [...prev, msg]);
    const sleep = (ms: number) =>
      new Promise((r) => setTimeout(r, ms));

    try {
      appendLog("Creating project directory structure...");
      await mkdir(fullPath, { recursive: true });
      await sleep(300);

      const files = projectFiles[createTemplate];
      if (!files) throw new Error(`Unknown template: ${createTemplate}`);

      const entries = Object.entries(files);
      for (let i = 0; i < entries.length; i++) {
        const [filePath, content] = entries[i];
        const dir = filePath.includes("/")
          ? filePath.substring(0, filePath.lastIndexOf("/"))
          : "";

        if (dir) {
          appendLog(`✔ Creating ${dir}/ directory...`);
          await mkdir(`${fullPath}/${dir}`, { recursive: true });
          await sleep(200);
        }

        appendLog(`✔ Writing ${filePath}...`);
        await writeTextFile(`${fullPath}/${filePath}`, content);
        await sleep(250);
      }

      appendLog("✔ Initialized git repository");
      await sleep(300);
      appendLog(
        `Success! Created ${createProjectName} at ${fullPath}`
      );

      await sleep(400);
      setIsCreating(false);
      onCreateProject(fullPath, createProjectName);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to create project:", err);
      toast.error(
        "Failed to create project: " + (err as Error).message
      );
      setIsCreating(false);
    }
  };

  const templates = [
    {
      id: "vite-react",
      name: "React + Vite",
      desc: "Fast, bundleless web build tool configured for React and TypeScript.",
      badge: "Web",
    },
    {
      id: "nextjs",
      name: "Next.js App Router",
      desc: "React framework for production with Server Components and SSR.",
      badge: "SaaS",
    },
    {
      id: "vanilla",
      name: "Vanilla HTML/CSS/JS",
      desc: "Barebones workspace for prototyping ideas quickly without overhead.",
      badge: "Minimal",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        open={isOpen}
        className="max-w-[620px] p-6 bg-[var(--surface-color)]/95 border-[var(--border-color)]/50 backdrop-blur-xl shadow-2xl overflow-hidden rounded-2xl"
        showCloseButton={!isCloning && !isCreating}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Add New Project
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Initialize or open a project directory to begin working in Cortex.
            </p>
          </div>

          {/* Tab buttons */}
          {!isCloning && !isCreating && (
            <div className="flex gap-1 p-1 bg-[var(--surface-color)] border border-[var(--border-color)]/30 rounded-lg">
              <button
                onClick={() => setActiveTab("browse")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === "browse"
                    ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold border border-[var(--accent-primary)]/30"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-secondary)]/5"
                }`}
              >
                Browse Folder
              </button>
              <button
                onClick={() => setActiveTab("clone")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === "clone"
                    ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold border border-[var(--accent-primary)]/30"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-secondary)]/5"
                }`}
              >
                Clone from URL
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === "create"
                    ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold border border-[var(--accent-primary)]/30"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-secondary)]/5"
                }`}
              >
                Create New Project
              </button>
            </div>
          )}

          <div className="min-h-[260px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* Tab 1: Browse Folder */}
              {activeTab === "browse" && !isCloning && !isCreating && (
                <motion.div
                  key="browse"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4 mt-2"
                >
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Project Path
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={browsePath}
                        onChange={(e) => {
                          setBrowsePath(e.target.value);
                          setBrowseProjectName(getFolderName(e.target.value));
                        }}
                        placeholder="C:\Users\Username\Projects\my-project"
                        className="bg-black/20"
                      />
                      <Button
                        variant="secondary"
                        onClick={() =>
                          handleBrowseFolderOnly(
                            setBrowsePath,
                            setBrowseProjectName
                          )
                        }
                        className="shrink-0 flex gap-1.5 items-center px-3"
                      >
                        <Folder size={14} />
                        Browse
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Display Name (Optional)
                    </label>
                    <Input
                      value={browseProjectName}
                      onChange={(e) => setBrowseProjectName(e.target.value)}
                      placeholder="e.g. My Awesome Web App"
                      className="bg-black/20"
                    />
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="ghost"
                      onClick={() => onOpenChange(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBrowseSubmit}
                      disabled={!browsePath}
                      className="text-xs font-semibold px-4"
                    >
                      Open Project
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Tab 2: Clone from URL */}
              {activeTab === "clone" && !isCloning && (
                <motion.div
                  key="clone"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3 mt-2"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Repository URL
                    </label>
                    <div className="relative">
                      <Input
                        value={cloneUrl}
                        onChange={(e) => setCloneUrl(e.target.value)}
                        placeholder="https://github.com/username/repository.git"
                        className="bg-black/20 pl-8"
                      />
                      <Github
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Destination Folder
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={cloneDestDir}
                        onChange={(e) => setCloneDestDir(e.target.value)}
                        placeholder="Select folder to clone into"
                        className="bg-black/20"
                      />
                      <Button
                        variant="secondary"
                        onClick={() =>
                          handleBrowseFolderOnly(setCloneDestDir)
                        }
                        className="shrink-0 flex gap-1.5 items-center px-3"
                      >
                        <Folder size={14} />
                        Browse
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Folder Name (Optional)
                    </label>
                    <Input
                      value={cloneFolder}
                      onChange={(e) => setCloneFolder(e.target.value)}
                      placeholder="e.g. customized-repo-folder"
                      className="bg-black/20"
                    />
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="ghost"
                      onClick={() => onOpenChange(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCloneSubmit}
                      disabled={!cloneUrl || !cloneDestDir}
                      className="text-xs font-semibold px-4"
                    >
                      Clone & Open
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Tab 3: Create New Project */}
              {activeTab === "create" && !isCreating && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3 mt-2"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Project Name
                      </label>
                      <Input
                        value={createProjectName}
                        onChange={(e) => setCreateProjectName(e.target.value)}
                        placeholder="my-new-project"
                        className="bg-black/20"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Location
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={createDestDir}
                          onChange={(e) => setCreateDestDir(e.target.value)}
                          placeholder="Parent folder"
                          className="bg-black/20"
                        />
                        <Button
                          variant="secondary"
                          onClick={() =>
                            handleBrowseFolderOnly((p) => {
                              setCreateDestDir(p);
                              setCloneDestDir(p);
                            })
                          }
                          className="shrink-0 flex gap-1.5 items-center px-3"
                        >
                          <Folder size={14} />
                          Browse
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Select Space Template
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {templates.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setCreateTemplate(t.id)}
                          className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                            createTemplate === t.id
                              ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] shadow-sm"
                              : "bg-black/10 border-[var(--border-color)]/25 hover:bg-black/20"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full mb-1">
                            <span className="text-xs font-bold text-[var(--text-primary)]">
                              {t.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 font-medium">
                              {t.badge}
                            </span>
                          </div>
                          <span className="text-[10px] leading-tight text-[var(--text-secondary)]">
                            {t.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="ghost"
                      onClick={() => onOpenChange(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateSubmit}
                      disabled={!createProjectName || !createDestDir}
                      className="text-xs font-semibold px-4"
                    >
                      Initialize Space
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* CLI Progress Logs Console (Premium UX) */}
              {(isCloning || isCreating) && (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-4 mt-2 w-full h-full flex-1 justify-between"
                >
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {isCloning ? "Cloning Git Repository..." : "Initializing Project Workspace..."}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                        bash/zsh
                      </span>
                    </div>

                    {/* Console Screen */}
                    <div className="flex-1 min-h-[180px] p-4 bg-black/60 border border-[var(--border-color)]/45 rounded-lg font-mono text-[11px] leading-relaxed text-emerald-400 overflow-y-auto scrollbar-none shadow-inner h-[220px]">
                      {activeTab === "clone"
                        ? cloneLogs.map((log, idx) => (
                            <div
                              key={idx}
                              className={
                                idx === cloneLogs.length - 1
                                  ? "text-white"
                                  : "text-emerald-400/90"
                              }
                            >
                              {log}
                            </div>
                          ))
                        : createLogs.map((log, idx) => (
                            <div
                              key={idx}
                              className={
                                idx === createLogs.length - 1
                                  ? "text-white"
                                  : "text-emerald-400/90"
                              }
                            >
                              {log}
                            </div>
                          ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
