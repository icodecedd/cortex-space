import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

export function useWorkspaceDirectory() {
  const [rootPath, setRootPath] = useState("");
  const [isValidDir, setIsValidDir] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const validatePath = async () => {
      if (!rootPath) {
        if (isMounted) setIsValidDir(null);
        return;
      }
      try {
        const isDir = await invoke<boolean>("validate_directory", { path: rootPath });
        if (isMounted) setIsValidDir(isDir);
      } catch (err) {
        console.error("Path validation error:", err);
        if (isMounted) setIsValidDir(false);
      }
    };
    validatePath();
    return () => { isMounted = false; };
  }, [rootPath]);

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

  const handleBreadcrumbClick = (index: number) => {
    // Split the path while keeping the separators to preserve original format
    const parts = rootPath.split(/([\\/])/);
    
    let partCount = 0;
    let lastPartIdx = -1;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      // A "part" is a non-empty string that isn't just a separator
      if (part !== "" && !/^[\\/]$/.test(part)) {
        if (partCount === index) {
          lastPartIdx = i;
          break;
        }
        partCount++;
      }
    }

    if (lastPartIdx !== -1) {
      let newPath = parts.slice(0, lastPartIdx + 1).join("");
      
      // Special case: Windows drive root (e.g., "C:") needs a trailing backslash
      if (/^[a-zA-Z]:$/.test(newPath) && parts[lastPartIdx + 1] && /^[\\/]$/.test(parts[lastPartIdx + 1])) {
        newPath += parts[lastPartIdx + 1];
      } else if (/^[a-zA-Z]:$/.test(newPath)) {
        // Fallback if no separator was present but it is a drive root
        newPath += "\\";
      }
      
      setRootPath(newPath);
    }
  };

  return {
    rootPath,
    setRootPath,
    isValidDir,
    handleBrowse,
    handleBreadcrumbClick
  };
}
