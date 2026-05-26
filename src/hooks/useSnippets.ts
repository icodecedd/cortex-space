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
    const newSnippet: Snippet = {
      id: crypto.randomUUID(),
      label,
      command,
    };
    setSnippets(prev => [newSnippet, ...prev]);
    toast.success("Snippet Saved", { description: label });
  }, []);

  const deleteSnippet = useCallback((id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id));
    toast.info("Snippet Deleted");
  }, []);

  return {
    snippets,
    addSnippet,
    deleteSnippet
  };
}
