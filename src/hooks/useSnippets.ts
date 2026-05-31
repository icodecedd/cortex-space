import { useState, useEffect, useCallback } from "react";
import { getSetting, setSetting } from "@/lib/store";
import { Snippet } from "@/types";
import { DEFAULT_SNIPPETS } from "@/lib/setup-constants";
import { toast } from "sonner";

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function loadSnippets() {
      const saved = await getSetting<Snippet[]>("cortex_snippets", DEFAULT_SNIPPETS);
      setSnippets(saved);
      setIsInitialized(true);
    }
    loadSnippets();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setSetting("cortex_snippets", snippets);
    }
  }, [snippets, isInitialized]);

  const addSnippet = useCallback((label: string, command: string) => {
    // Validation: Check if command is empty
    if (!command || !command.trim()) {
      toast.error("Cannot save empty command");
      return;
    }

    // Validation: Check for duplicates
    const isDuplicate = snippets.some(s => s.command.trim() === command.trim());
    if (isDuplicate) {
      toast.error("Snippet already exists", { 
        description: "This command is already in your library." 
      });
      return;
    }

    const finalLabel = label || command.split(' ')[0] || "Untitled Snippet";

    const newSnippet: Snippet = {
      id: crypto.randomUUID(),
      label: finalLabel,
      command: command.trim(),
    };
    setSnippets(prev => [newSnippet, ...prev]);
    toast.success("Snippet Saved", { description: finalLabel });
  }, [snippets]);

  const deleteSnippet = useCallback((id: string) => {
    const snippet = snippets.find(s => s.id === id);
    setSnippets(prev => prev.filter(s => s.id !== id));
    toast.info("Snippet Removed", {
      description: snippet ? `"${snippet.label}" has been deleted from your library.` : "The selected snippet has been deleted."
    });
  }, [snippets]);

  const deleteSnippets = useCallback((ids: string[]) => {
    const count = ids.length;
    setSnippets(prev => prev.filter(s => !ids.includes(s.id)));
    toast.info("Bulk Deletion Complete", {
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
