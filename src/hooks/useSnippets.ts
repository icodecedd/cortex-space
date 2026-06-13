import { useState, useEffect, useCallback, useRef } from "react";
import { getSetting, setSetting } from "@/lib/store";
import { Snippet } from "@/types";
import { DEFAULT_SNIPPETS } from "@/lib/setup-constants";
import { toast } from "sonner";
import { derivePaneName } from "@/lib/setup-utils";

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const snippetsRef = useRef<Snippet[]>([]);

  // Sync ref with state
  useEffect(() => {
    snippetsRef.current = snippets;
  }, [snippets]);

  useEffect(() => {
    async function loadSnippets() {
      const saved = await getSetting<Snippet[]>("cortex_snippets", DEFAULT_SNIPPETS);
      if (JSON.stringify(saved) !== JSON.stringify(snippetsRef.current)) {
        setSnippets(saved);
        snippetsRef.current = saved;
      }
    }
    loadSnippets();

    const handleSync = () => loadSnippets();
    window.addEventListener('cortex:snippets-updated', handleSync);
    window.addEventListener('cortex-settings-changed', handleSync);
    return () => {
      window.removeEventListener('cortex:snippets-updated', handleSync);
      window.removeEventListener('cortex-settings-changed', handleSync);
    };
  }, []);



  const lastAddRef = useRef(0);

  const addSnippet = useCallback((label: string, command: string) => {
    const now = Date.now();
    if (now - lastAddRef.current < 500) return;
    lastAddRef.current = now;

    const trimmedCommand = command?.trim();
    
    if (!trimmedCommand) {
      toast.error("Failed to save snippet", {
        description: "Enter a valid command to save as a snippet."
      });
      return;
    }

    const currentSnippets = snippetsRef.current;
    const isDuplicate = currentSnippets.some(s => s.command.trim() === trimmedCommand);
    
    if (isDuplicate) {
      toast.error("Snippet cannot be added", {
        id: `dup-${trimmedCommand}`,
        description: "This command already exists in your library."
      });
      return;
    }

    let finalLabel = label?.trim() || derivePaneName(trimmedCommand, trimmedCommand.split(' ')[0] || "Untitled snippet");
    
    // Normalize standard names like 'freebuff' to 'Freebuff'
    if (finalLabel.toLowerCase() === 'freebuff') {
      finalLabel = 'Freebuff';
    }

    const newSnippet: Snippet = {
      id: crypto.randomUUID(),
      label: finalLabel,
      command: trimmedCommand,
    };

    const newSnippets = [newSnippet, ...currentSnippets];
    setSnippets(newSnippets);
    setSetting("cortex_snippets", newSnippets).then(() => {
      window.dispatchEvent(new Event('cortex:snippets-updated'));
    });
    
    toast.success(`${finalLabel} saved successfully`, {
      id: `save-${trimmedCommand}`,
      description: "The snippet has been added to your library."
    });
  }, []);

  const lastOpRef = useRef(0);

  const deleteSnippet = useCallback((id: string) => {
    const now = Date.now();
    if (now - lastOpRef.current < 500) return;
    lastOpRef.current = now;

    setSnippets(prev => {
      const snippet = prev.find(s => s.id === id);
      const newSnippets = prev.filter(s => s.id !== id);
      setSetting("cortex_snippets", newSnippets).then(() => {
        window.dispatchEvent(new Event('cortex:snippets-updated'));
      });
      toast.success(`${snippet?.label || 'Snippet'} permanently deleted`, {
        id: `del-${id}`,
        description: "The snippet has been permanently removed."
      });
      return newSnippets;
    });
  }, []);

  const deleteSnippets = useCallback((ids: string[]) => {
    setSnippets(prev => {
      const newSnippets = prev.filter(s => !ids.includes(s.id));
      setSetting("cortex_snippets", newSnippets).then(() => {
        window.dispatchEvent(new Event('cortex:snippets-updated'));
      });
      toast.success(`${ids.length} snippets permanently deleted`, {
        id: `del-bulk-${ids.join('-').substring(0, 50)}`,
        description: `Successfully removed ${ids.length} items from your library.`
      });
      return newSnippets;
    });
  }, []);

  const archiveSnippet = useCallback((id: string) => {
    setSnippets(prev => {
      const snippet = prev.find(s => s.id === id);
      const newSnippets = prev.map(s => s.id === id ? { ...s, isArchived: true } : s);
      setSetting("cortex_snippets", newSnippets).then(() => {
        window.dispatchEvent(new Event('cortex:snippets-updated'));
      });
      toast.info(`${snippet?.label || 'Snippet'} archived`, {
        id: `arch-${id}`,
        description: "The snippet has been archived and can be restored later."
      });
      return newSnippets;
    });
  }, []);

  const archiveSnippets = useCallback((ids: string[]) => {
    setSnippets(prev => {
      const newSnippets = prev.map(s => ids.includes(s.id) ? { ...s, isArchived: true } : s);
      setSetting("cortex_snippets", newSnippets).then(() => {
        window.dispatchEvent(new Event('cortex:snippets-updated'));
      });
      toast.info(`${ids.length} snippets archived`, {
        id: `arch-bulk-${ids.join('-').substring(0, 50)}`,
        description: "The items have been archived and can be restored later."
      });
      return newSnippets;
    });
  }, []);

  const unarchiveSnippet = useCallback((id: string) => {
    setSnippets(prev => {
      const snippet = prev.find(s => s.id === id);
      const newSnippets = prev.map(s => s.id === id ? { ...s, isArchived: false } : s);
      setSetting("cortex_snippets", newSnippets).then(() => {
        window.dispatchEvent(new Event('cortex:snippets-updated'));
      });
      toast.success(`${snippet?.label || 'Snippet'} restored`, {
        id: `unarch-${id}`,
        description: "The snippet has been restored to your library."
      });
      return newSnippets;
    });
  }, []);

  const unarchiveSnippets = useCallback((ids: string[]) => {
    setSnippets(prev => {
      const newSnippets = prev.map(s => ids.includes(s.id) ? { ...s, isArchived: false } : s);
      setSetting("cortex_snippets", newSnippets).then(() => {
        window.dispatchEvent(new Event('cortex:snippets-updated'));
      });
      toast.success(`${ids.length} snippets restored`, {
        id: `unarch-bulk-${ids.join('-').substring(0, 50)}`,
        description: `Successfully restored ${ids.length} items to your library.`
      });
      return newSnippets;
    });
  }, []);

  return {
    snippets,
    addSnippet,
    deleteSnippet,
    deleteSnippets,
    archiveSnippet,
    archiveSnippets,
    unarchiveSnippet,
    unarchiveSnippets
  };
}
