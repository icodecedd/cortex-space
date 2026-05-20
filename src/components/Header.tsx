import { Settings, Cpu } from "lucide-react";

export function Header() {
  return (
    <header className="glass" style={{ 
      margin: '1rem', 
      padding: '0.75rem 1.5rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
          padding: '0.5rem', 
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
        }}>
          <Cpu size={20} color="white" />
        </div>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Cortex<span style={{ opacity: 0.7, fontWeight: 300 }}>Space</span></h2>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <Settings size={16} />
          Settings
        </button>
      </div>
    </header>
  );
}
