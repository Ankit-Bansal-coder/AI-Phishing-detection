import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, Network, Cpu, Terminal, RefreshCw, History } from 'lucide-react';
import Scanner from './components/Scanner';
import XRay from './components/XRay';
import Sandbox from './components/Sandbox';
import ModelPlayground from './components/ModelPlayground';
import ScanHistory from './components/ScanHistory';
import { initDB } from './utils/db';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [modelData, setModelData] = useState(null);
  const [dbReady, setDbReady] = useState(false);

  // Shared scanner state — lifted here so History can replay scans
  const [currentUrl, setCurrentUrl] = useState('');
  const [scanResult, setScanResult] = useState(null);

  // Load ML model JSON
  useEffect(() => {
    const loadModel = async () => {
      try {
        const data = await import('./assets/phishing_model.json');
        setModelData(data.default);
      } catch {
        setTimeout(loadModel, 2000);
      }
    };
    loadModel();
  }, []);

  // Initialize SQLite database
  useEffect(() => {
    initDB()
      .then(() => setDbReady(true))
      .catch(err => console.error('[PhishAI] DB init failed:', err));
  }, []);

  // Replay a scan from history: switch to scanner tab and restore result
  const handleReplayScan = (pastScanResult) => {
    setScanResult(pastScanResult);
    setCurrentUrl(pastScanResult.url);
    setActiveTab('scanner');
  };

  if (!modelData) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#070913', color: '#f8fafc', fontFamily: 'Outfit, sans-serif'
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
          background: 'rgba(15, 22, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '40px', boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)', textAlign: 'center', maxWidth: '450px'
        }}>
          <RefreshCw size={40} style={{ color: '#3b82f6', animation: 'cyber-pulse 1.5s infinite' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Synchronizing Threat Database</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Initializing browser-side ML inference engine and loading model weights...
          </p>
        </div>
      </div>
    );
  }

  const NAV = [
    { id: 'scanner',    label: 'URL Safety Scanner',   icon: ShieldCheck },
    { id: 'xray',       label: 'X-Ray Explainability', icon: Eye },
    { id: 'sandbox',    label: 'Sandbox Viewport',      icon: Terminal },
    { id: 'playground', label: 'Model Playground',      icon: Cpu },
    { id: 'history',    label: 'Scan History',          icon: History },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      <div className="bg-grid" />
      <div className="bg-radial-gradient" />

      {/* Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(59,130,246,0.4)'
          }}>
            <ShieldCheck size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.05em', fontFamily: 'var(--font-heading)' }}>
              PHISH.AI
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Threat Intelligence
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1 }}>
          {NAV.map(({ id, label, icon: Icon }) => (
            <div
              key={id}
              className={`sidebar-nav-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={18} />
              {label}
              {/* DB dot badge for History */}
              {id === 'history' && dbReady && (
                <span style={{
                  marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%',
                  background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)',
                  display: 'inline-block'
                }} />
              )}
            </div>
          ))}
        </nav>

        {/* Footer status */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px',
          display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', boxShadow: '0 0 8px var(--accent-green)' }} />
            Engine: Online
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: dbReady ? '#3b82f6' : '#64748b', display: 'inline-block' }} />
            SQLite: {dbReady ? 'Connected' : 'Initializing...'}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Top bar */}
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px'
        }}>
          <div style={{ display: 'flex', gap: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Dataset: </span><strong>10,000 URLs</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Features: </span><strong>12 heuristics</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Storage: </span><strong>SQLite (local)</strong></div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span className="cyber-badge cyber-badge-info">v1.3.0</span>
            <span className="cyber-badge cyber-badge-safe">Browser ML</span>
          </div>
        </header>

        {activeTab === 'scanner' && (
          <Scanner
            modelData={modelData}
            currentUrl={currentUrl}
            setCurrentUrl={setCurrentUrl}
            scanResult={scanResult}
            setScanResult={setScanResult}
            dbReady={dbReady}
          />
        )}
        {activeTab === 'xray' && (
          <XRay modelData={modelData} currentUrl={currentUrl} scanResult={scanResult} />
        )}
        {activeTab === 'sandbox' && (
          <Sandbox currentUrl={currentUrl} scanResult={scanResult} />
        )}
        {activeTab === 'playground' && (
          <ModelPlayground modelData={modelData} currentUrl={currentUrl} scanResult={scanResult} setScanResult={setScanResult} />
        )}
        {activeTab === 'history' && (
          <ScanHistory dbReady={dbReady} onReplayScan={handleReplayScan} />
        )}
      </main>
    </div>
  );
}
