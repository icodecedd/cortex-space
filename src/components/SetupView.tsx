import { useState } from "react";
import { FolderOpen, Grid3X3, Play, Plus } from "lucide-react";

interface SetupViewProps {
  onLaunch: (config: any) => void;
}

export function SetupView({ onLaunch }: SetupViewProps) {
  const [rootPath, setRootPath] = useState("");
  const [layout, setLayout] = useState("2x2");
  const [panes, setPanes] = useState([
    { id: 1, name: "Pane 1", command: "npm run dev" },
    { id: 2, name: "Pane 2", command: "npm run start" },
    { id: 3, name: "Pane 3", command: "ls -la" },
    { id: 4, name: "Pane 4", command: "git status" },
  ]);

  const handleLaunch = () => {
    onLaunch({ rootPath, layout, panes });
  };

  return (
    <div className="fade-in" style={{ padding: '0 2rem 2rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      <section className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderOpen size={20} />
          Workspace Root
        </h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            value={rootPath} 
            onChange={(e) => setRootPath(e.target.value)}
            placeholder="Select your project directory..."
            style={{ 
              flex: 1, 
              padding: '0.75rem 1rem', 
              borderRadius: '8px', 
              background: 'rgba(0,0,0,0.2)', 
              border: '1px solid var(--glass-border)',
              color: 'white'
            }}
          />
          <button onClick={() => { /* TODO: Open Tauri Dialog */ }}>Browse</button>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <section className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Grid3X3 size={20} />
            Layout Grid
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {['1x1', '1x2', '2x1', '2x2', '3x3'].map((l) => (
              <div 
                key={l}
                onClick={() => setLayout(l)}
                style={{ 
                  aspectRatio: '1', 
                  border: `2px solid ${layout === l ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: layout === l ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{l}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} />
            Pane Configuration
          </h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {panes.map((pane, index) => (
              <div key={pane.id} style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  {pane.name} Command
                </label>
                <input 
                  type="text" 
                  value={pane.command}
                  onChange={(e) => {
                    const newPanes = [...panes];
                    newPanes[index].command = e.target.value;
                    setPanes(newPanes);
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem', 
                    borderRadius: '6px', 
                    background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid var(--glass-border)',
                    color: 'white',
                    fontFamily: 'JetBrains Mono'
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
        <button className="primary" onClick={handleLaunch} style={{ padding: '1rem 3rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Play size={20} fill="white" />
          Launch Space
        </button>
      </div>
    </div>
  );
}
