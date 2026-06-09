import { useState, useEffect } from "react";
import { toast } from "sonner";

export function useWindowControls() {
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);

  useEffect(() => {
    let active = true;

    const checkMaximized = async () => {
      if (window.__TAURI_INTERNALS__) {
        try {
          const { getCurrentWindow } = await import("@tauri-apps/api/window");
          const isMax = await getCurrentWindow().isMaximized();
          if (active) setIsWindowMaximized(isMax);
        } catch (err) {
          console.error("Failed to check if window is maximized:", err);
        }
      }
    };

    checkMaximized();
    window.addEventListener("resize", checkMaximized);

    return () => {
      active = false;
      window.removeEventListener("resize", checkMaximized);
    };
  }, []);

  const handleMinimize = async () => {
    if (window.__TAURI_INTERNALS__) {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().minimize();
      } catch (err) {
        console.error("Failed to minimize window:", err);
      }
    } else {
      toast.info("Window minimized successfully", { description: "The minimize action is simulated in your browser." });
    }
  };

  const handleMaximize = async () => {
    if (window.__TAURI_INTERNALS__) {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().toggleMaximize();
      } catch (err) {
        console.error("Failed to maximize window:", err);
      }
    } else {
      setIsWindowMaximized(prev => !prev);
      toast.info("Window maximized successfully", { description: "The maximize action is simulated in your browser." });
    }
  };

  const handleClose = async () => {
    if (window.__TAURI_INTERNALS__) {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().close();
      } catch (err) {
        console.error("Failed to close window:", err);
      }
    } else {
      toast.info("Window closed successfully", { description: "The close action is simulated in your browser." });
    }
  };

  return {
    isWindowMaximized,
    handleMinimize,
    handleMaximize,
    handleClose
  };
}
