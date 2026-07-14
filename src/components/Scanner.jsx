import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle, ShieldAlert, Globe, RefreshCw, ShieldCheck, ArrowRight, Lock, Unlock, Play } from 'lucide-react';
import { extractFeatures, predictLogisticRegression } from '../utils/featureExtractor';

const PRESETS = [
  {
    url: 'https://paypal-verification-alert.xyz/signin.php',
    label: 'PayPal Phish (Spoofed URL)',
    isPhish: true
  },
  {
    url: 'https://metamask-recovery-vault.top/wallet/',
    label: 'Crypto Phish (Suspicious TLD)',
    isPhish: true
  },
  {
    url: 'http://192.168.99.12/secure-login/chase-bank',
    label: 'Chase Phish (IP Domain, HTTP)',
    isPhish: true
  },
  {
    url: 'https://bit.ly/4x9dKs7',
    label: 'Shortened URL redirect',
    isPhish: true
  },
  {
    url: 'https://github.com/trending',
    label: 'GitHub Trending (Safe)',
    isPhish: false
  },
  {
    url: 'https://www.google.com/search?q=cybersecurity',
    label: 'Google Search (Safe)',
    isPhish: false
  },
  {
    url: 'https://en.wikipedia.org/wiki/Phishing',
    label: 'Wikipedia Article (Safe)',
    isPhish: false
  }
];

export default function Scanner({ modelData, currentUrl, setCurrentUrl, scanResult, setScanResult }) {
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanStep, setScanStep] = useState('');

  const FEATURE_METADATA = [
    {
      key: 'url_length',
      name: 'URL Length',
      description: 'Longer URLs are often used to hide the actual host name in the address bar.',
      evaluate: (val) => val > 75 ? { label: 'High Risk', type: 'danger', detail: `${val} chars (>75)` } :
                         val > 54 ? { label: 'Warning', type: 'warning', detail: `${val} chars (>54)` } :
                                    { label: 'Safe', type: 'safe', detail: `${val} chars` }
    },
    {
      key: 'qty_at',
      name: 'At Symbol (@)',
      description: 'The @ symbol forces the browser to ignore everything before it, highlighting the fake domain.',
      evaluate: (val) => val > 0 ? { label: 'High Risk', type: 'danger', detail: `Found @ symbol` } :
                                   { label: 'Safe', type: 'safe', detail: 'None' }
    },
    {
      key: 'qty_double_slash',
      name: 'Path Redirect (//)',
      description: 'Double slashes in URL path redirect users to another location.',
      evaluate: (val) => val > 0 ? { label: 'High Risk', type: 'danger', detail: `Found ${val} redirects` } :
                                   { label: 'Safe', type: 'safe', detail: 'None' }
    },
    {
      key: 'qty_hyphen_domain',
      name: 'Domain Hyphens (-)',
      description: 'Phishing sites often combine names with hyphens to look legitimate (e.g., paypal-support.com).',
      evaluate: (val) => val > 0 ? { label: 'Warning', type: 'warning', detail: `Found ${val} hyphens` } :
                                   { label: 'Safe', type: 'safe', detail: 'None' }
    },
    {
      key: 'qty_subdomains',
      name: 'Subdomains Count',
      description: 'Multiple subdomains can mimic a target domain (e.g., bank.com.login.security.net).',
      evaluate: (val) => val > 2 ? { label: 'High Risk', type: 'danger', detail: `${val} subdomains` } :
                         val > 0 ? { label: 'Warning', type: 'warning', detail: `${val} subdomains` } :
                                   { label: 'Safe', type: 'safe', detail: 'None' }
    },
    {
      key: 'qty_https_domain',
      name: 'HTTPS Token in Domain',
      description: 'Using "https" inside the domain name is a common trick to fake secure connection indicators.',
      evaluate: (val) => val > 0 ? { label: 'High Risk', type: 'danger', detail: 'Contains "https"' } :
                                   { label: 'Safe', type: 'safe', detail: 'None' }
    },
    {
      key: 'ip_presence',
      name: 'IP Address Host',
      description: 'Legitimate sites almost never use raw IP addresses (e.g. 192.168.1.1) in their public URLs.',
      evaluate: (val) => val > 0 ? { label: 'High Risk', type: 'danger', detail: 'Using IP as domain' } :
                                   { label: 'Safe', type: 'safe', detail: 'None' }
    },
    {
      key: 'qty_shortening_service',
      name: 'URL Shortener',
      description: 'Shortening services (e.g. bit.ly, tinyurl) mask the final destination of phishing links.',
      evaluate: (val) => val > 0 ? { label: 'High Risk', type: 'danger', detail: 'Shortened link' } :
                                   { label: 'Safe', type: 'safe', detail: 'No' }
    },
    {
      key: 'qty_suspicious_keywords',
      name: 'Suspicious Keywords',
      description: 'Words like "login", "verify", "secure", "paypal" are commonly found in phishing URLs.',
      evaluate: (val) => val > 1 ? { label: 'High Risk', type: 'danger', detail: `${val} keywords found` } :
                         val > 0 ? { label: 'Warning', type: 'warning', detail: `${val} keyword found` } :
                                   { label: 'Safe', type: 'safe', detail: 'None' }
    },
    {
      key: 'qty_non_standard_port',
      name: 'Non-Standard Port',
      description: 'Websites typically serve public pages over port 80 (HTTP) or 443 (HTTPS).',
      evaluate: (val) => val > 0 ? { label: 'Warning', type: 'warning', detail: 'Custom port detected' } :
                                   { label: 'Safe', type: 'safe', detail: 'Standard' }
    },
    {
      key: 'tld_safety_index',
      name: 'Suspicious TLD',
      description: 'Suspicious Top-Level Domains (.xyz, .top, .club, .tk) are cheap/free and popular for scams.',
      evaluate: (val) => val > 0 ? { label: 'High Risk', type: 'danger', detail: 'Suspicious TLD' } :
                                   { label: 'Safe', type: 'safe', detail: 'Safe TLD' }
    },
    {
      key: 'sensitive_char_ratio',
      name: 'Special Char Ratio',
      description: 'Phishing URLs often have a high concentration of delimiters like ?, =, &, and -.',
      evaluate: (val) => val > 0.15 ? { label: 'High Risk', type: 'danger', detail: `${(val * 100).toFixed(1)}%` } :
                         val > 0.08 ? { label: 'Warning', type: 'warning', detail: `${(val * 100).toFixed(1)}%` } :
                                      { label: 'Safe', type: 'safe', detail: `${(val * 100).toFixed(1)}%` }
    }
  ];

  const handleScan = (urlToScan) => {
    if (!urlToScan) return;
    setIsScanning(true);
    setProgress(0);
    setScanResult(null);
    setCurrentUrl(urlToScan);

    const steps = [
      { text: 'Parsing URL structure...', delay: 300 },
      { text: 'Checking domain name and host...', delay: 500 },
      { text: 'Analyzing URL heuristics & parameters...', delay: 400 },
      { text: 'Running ML Logistic Regression coefficients...', delay: 600 },
      { text: 'Running ML Decision Tree classification...', delay: 400 },
      { text: 'Finalizing prediction analysis...', delay: 300 }
    ];

    let currentStep = 0;
    const runStep = () => {
      if (currentStep < steps.length) {
        setScanStep(steps[currentStep].text);
        setProgress(Math.round(((currentStep + 1) / steps.length) * 100));
        setTimeout(() => {
          currentStep++;
          runStep();
        }, steps[currentStep].delay);
      } else {
        // Complete scan
        const features = extractFeatures(urlToScan);
        const probability = predictLogisticRegression(features, modelData);
        
        let riskScore = 'safe';
        if (probability >= 0.70) riskScore = 'danger';
        else if (probability >= 0.35) riskScore = 'warning';

        setScanResult({
          url: urlToScan,
          features: features,
          probability: probability,
          risk: riskScore
        });
        setIsScanning(false);
      }
    };

    runStep();
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'danger':
        return <span className="cyber-badge cyber-badge-danger"><ShieldAlert size={14} /> DANGEROUS / PHISHING</span>;
      case 'warning':
        return <span className="cyber-badge cyber-badge-warning"><AlertTriangle size={14} /> SUSPICIOUS / WARNING</span>;
      default:
        return <span className="cyber-badge cyber-badge-safe"><ShieldCheck size={14} /> SECURE / LEGITIMATE</span>;
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'danger': return 'var(--accent-red)';
      case 'warning': return 'var(--accent-yellow)';
      default: return 'var(--accent-green)';
    }
  };

  return (
    <div className="animate-slide-up">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>
          URL Safety Analyzer
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '800px' }}>
          Analyze web links in real-time. Our dual-engine machine learning algorithm inspects URL features to identify deceptive sites instantly.
        </p>
      </div>

      {/* Main Scanner Section */}
      <div className="glass-card-no-hover" style={{ marginBottom: '32px', position: 'relative' }}>
        {isScanning && <div className="scanner-beam"></div>}
        
        <form onSubmit={(e) => { e.preventDefault(); handleScan(urlInput); }} style={{ display: 'flex', gap: '16px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '18px', top: '18px', color: 'var(--text-muted)' }} size={20} />
            <input
              type="text"
              className="cyber-input"
              style={{ paddingLeft: '50px' }}
              placeholder="Paste or type a URL to analyze (e.g. http://paypal-secure-login.xyz)..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isScanning}
            />
          </div>
          <button type="submit" className="cyber-button" disabled={isScanning || !urlInput.trim()}>
            {isScanning ? (
              <>
                <RefreshCw size={18} className="animate-spin" style={{ animation: 'cyber-pulse 1.5s infinite' }} />
                Analyzing URL...
              </>
            ) : (
              <>
                <Play size={18} />
                Analyze Link
              </>
            )}
          </button>
        </form>

        {/* Scanning Progress */}
        {isScanning && (
          <div style={{ marginTop: '24px', animation: 'fade-in 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{scanStep}</span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{progress}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-blue)', transition: 'width 0.3s ease', boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}></div>
            </div>
          </div>
        )}

        {/* Presets Gallery */}
        <div style={{ marginTop: '24px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Interactive Demo Sandbox URLs
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setUrlInput(preset.url);
                  handleScan(preset.url);
                }}
                disabled={isScanning}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '0.85rem',
                  color: preset.isPhish ? '#fda4af' : '#a7f3d0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = preset.isPhish ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                {preset.isPhish ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scan Results Layout */}
      {scanResult && !isScanning && (
        <div className="dashboard-grid animate-fade-in">
          
          {/* Detailed Features Breakdown */}
          <div className="glass-card-no-hover" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={20} className="text-blue-400" style={{ color: 'var(--accent-blue)' }} />
              URL Feature Dissection
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              These heuristics are extracted in real-time. Click the <strong>X-Ray</strong> tab to see how they feed mathematically into the ML classifier.
            </p>
            
            <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
              {FEATURE_METADATA.map((feat, idx) => {
                const rawVal = scanResult.features[idx];
                const evaluation = feat.evaluate(rawVal);
                
                return (
                  <div key={feat.key} className="feature-list-row">
                    <div style={{ width: '45%' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{String(idx + 1).padStart(2, '0')}.</span>
                        {feat.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                        {feat.description}
                      </div>
                    </div>
                    <div style={{ width: '30%', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', textAlign: 'right', paddingRight: '16px' }}>
                      {evaluation.detail}
                    </div>
                    <div style={{ width: '25%', display: 'flex', justifyContent: 'flex-end' }}>
                      <span className={`cyber-badge cyber-badge-${evaluation.type}`} style={{ minWidth: '95px', justifyContent: 'center' }}>
                        {evaluation.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Machine Learning Engine Prediction Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Classification Summary Card */}
            <div className="glass-card" style={{ 
              borderColor: getRiskColor(scanResult.risk),
              boxShadow: scanResult.risk === 'danger' ? 'var(--shadow-glow-red)' :
                         scanResult.risk === 'warning' ? 'var(--shadow-glow-yellow)' : 'var(--shadow-glow-green)'
            }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>
                Engine Decision
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '16px 0 24px 0' }}>
                <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  
                  {/* Glowing background ring */}
                  <svg className="w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="rgba(255,255,255,0.03)"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={getRiskColor(scanResult.risk)}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * scanResult.probability)}
                      style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                    />
                  </svg>
                  
                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                      {(scanResult.probability * 100).toFixed(0)}%
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      Risk Index
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {getRiskBadge(scanResult.risk)}
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', fontSize: '0.85rem' }}>
                {scanResult.risk === 'danger' && (
                  <p style={{ color: '#fda4af' }}>
                    <strong>Warning!</strong> The model detected multiple high-risk indicators associated with social engineering and spoofing. Do NOT enter sensitive credentials on this page.
                  </p>
                )}
                {scanResult.risk === 'warning' && (
                  <p style={{ color: '#fef08a' }}>
                    <strong>Caution!</strong> Some features deviate from standard patterns. This domain age, naming configuration, or character structure carries suspicious traits.
                  </p>
                )}
                {scanResult.risk === 'safe' && (
                  <p style={{ color: '#a7f3d0' }}>
                    <strong>Safe!</strong> The URL conforms to standard legitimate formatting guidelines. No malicious structural elements were found by our classifier.
                  </p>
                )}
              </div>
            </div>

            {/* URL Meta-Data Panel */}
            <div className="glass-card-no-hover">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                Target Details
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Protocol:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: scanResult.url.startsWith('https://') ? 'var(--accent-green)' : 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {scanResult.url.startsWith('https://') ? <Lock size={12} /> : <Unlock size={12} />}
                    {scanResult.url.startsWith('https://') ? 'HTTPS (Secure)' : 'HTTP (Insecure)'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Host Domain:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    {scanResult.url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ML Classifier:</span>
                  <span style={{ color: 'var(--text-primary)' }}>Logistic Regression v1.0</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
