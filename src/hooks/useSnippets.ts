import { useState, useEffect, useCallback, useRef } from "react";
import { getSetting, setSetting } from "@/lib/store";
import { Snippet } from "@/types";
import { DEFAULT_SNIPPETS } from "@/lib/setup-constants";
import { toast } from "sonner";

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const snippetsRef = useRef<Snippet[]>([]);

  // Sync ref with state
  useEffect(() => {
    snippetsRef.current = snippets;
  }, [snippets]);

  useEffect(() => {
    async function loadSnippets() {
      const saved = await getSetting<Snippet[]>("cortex_snippets", DEFAULT_SNIPPETS);
      setSnippets(saved);
      snippetsRef.current = saved;
      setIsInitialized(true);
    }
    loadSnippets();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setSetting("cortex_snippets", snippets);
    }
  }, [snippets, isInitialized]);

  const lastAddRef = useRef(0);

  const addSnippet = useCallback((label: string, command: string) => {
    const now = Date.now();
    if (now - lastAddRef.current < 500) return;
    lastAddRef.current = now;

    const trimmedCommand = command?.trim();
    
    if (!trimmedCommand) {
      toast.error("Cannot save empty command");
      return;
    }

    const currentSnippets = snippetsRef.current;
    const isDuplicate = currentSnippets.some(s => s.command.trim() === trimmedCommand);
    
    if (isDuplicate) {
      toast.error("Duplicate Snippet", {
        id: `dup-${trimmedCommand}`,
        description: "This command is already in your library."
      });
      return;
    }

    const finalLabel = label?.trim() || trimmedCommand.split(' ')[0] || "Untitled Snippet";
    const newSnippet: Snippet = {
      id: crypto.randomUUID(),
      label: finalLabel,
      command: trimmedCommand,
    };

    setSnippets(prev => [newSnippet, ...prev]);
    toast.success("Snippet Saved", {
      id: `save-${trimmedCommand}`,
      description: `"${finalLabel}" is now available in your library.`
    });
  }, []);

  const lastOpRef = useRef(0);

  const deleteSnippet = useCallback((id: string) => {
    const now = Date.now();
    if (now - lastOpRef.current < 500) return;
    lastOpRef.current = now;

    const currentSnippets = snippetsRef.current;
    const snippet = currentSnippets.find(s => s.id === id);
    
    setSnippets(prev => prev.filter(s => s.id !== id));
    
    toast.info("Snippet Removed", {
      id: `del-${id}`,
      description: snippet ? `"${snippet.label}" has been deleted from your library.` : "The selected snippet has been deleted."
    });
  }, []);

  const deleteSnippets = useCallback((ids: string[]) => {
    const now = Date.now();
    if (now - lastOpRef.current < 500) return;
    lastOpRef.current = now;

    const count = ids.length;
    setSnippets(prev => prev.filter(s => !ids.includes(s.id)));
    
    toast.info("Bulk Deletion Complete", {
      id: `del-bulk-${ids.join('-').substring(0, 50)}`,
      description: `Successfully removed ${count} snippets from your library.`
    });
  }, []);

  return {
    snippets,
    addSnippet,
    deleteSnippet,
    deleteSnippets
  };
}
