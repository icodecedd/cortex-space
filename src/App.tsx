import { useState } from "react";
import { Header } from "./components/Header";
import { SetupView } from "./components/SetupView";
import { SpaceView } from "./components/SpaceView";

function App() {
  const [view, setView] = useState<"setup" | "active">("setup");
  const [config, setConfig] = useState<any>(null);

  const handleLaunch = (newConfig: any) => {
    setConfig(newConfig);
    setView("active");
  };

  const handleStop = () => {
    setView("setup");
  };

  return (
    <div id="root">
      <Header />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {view === "setup" ? (
          <SetupView onLaunch={handleLaunch} />
        ) : (
          <SpaceView config={config} onStop={handleStop} />
        )}
      </main>
      
      <footer style={{ 
        padding: '1rem', 
        textAlign: 'center', 
        fontSize: '0.7rem', 
        color: 'var(--text-secondary)',
        opacity: 0.5
      }}>
        Cortex Space v0.1.0 • Built with Tauri 2 & React
      </footer>
    </div>
  );
}

export default App;
