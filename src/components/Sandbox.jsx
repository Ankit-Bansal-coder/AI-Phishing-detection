import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertOctagon, ArrowLeft, ArrowRight, RotateCcw, Lock, Unlock, ShieldAlert } from 'lucide-react';
import { parseUrlRobust } from '../utils/featureExtractor';

// ---- Extracted into a proper React component to comply with hooks rules ----
function SimulatedPage({ type, isDangerous }) {
  const [submitting, setSubmitting] = useState(false);
  const [capturedData, setCapturedData] = useState(null);
  const [userVal, setUserVal] = useState('');
  const [passVal, setPassVal] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setCapturedData({ user: userVal, pass: passVal });
      setSubmitting(false);
    }, 1000);
  };

  if (capturedData) {
    return (
      <div style={{ padding: '40px', background: '#0f172a', color: 'white', minHeight: '344px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <ShieldAlert size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '12px' }}>Credentials Harvested!</h3>
        <p style={{ color: '#94a3b8', maxWidth: '400px', fontSize: '0.9rem', marginBottom: '20px' }}>
          This is exactly how phishing works. The fake website captures your input and forwards it to the hacker's server.
        </p>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px', width: '100%', maxWidth: '380px', fontFamily: 'monospace', fontSize: '0.85rem', textAlign: 'left' }}>
          <div style={{ color: '#f43f5e', fontWeight: 'bold', marginBottom: '8px' }}>[DATA INTERCEPTED BY SANDBOX]</div>
          <div><strong>Email/User:</strong> {capturedData.user}</div>
          <div><strong>Password:</strong> {capturedData.pass}</div>
        </div>
        <button
          onClick={() => { setCapturedData(null); setUserVal(''); setPassVal(''); }}
          style={{ marginTop: '20px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    );
  }

  switch (type) {
    case 'paypal':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', fontFamily: 'sans-serif', background: '#ffffff', minHeight: '344px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '32px' }}>
            <span style={{ color: '#003087' }}>Pay</span><span style={{ color: '#0079c1' }}>Pal</span>
          </div>
          <form onSubmit={handleFormSubmit} style={{ width: '100%', maxWidth: '350px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 'normal', color: '#333', marginBottom: '16px', textAlign: 'center' }}>
              {isDangerous ? 'Security Check: Verify Your Account Credentials' : 'Log in to your PayPal account'}
            </h2>
            <input type="text" placeholder="Email or mobile number" value={userVal} onChange={(e) => setUserVal(e.target.value)}
              style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px', marginBottom: '12px', fontSize: '0.95rem' }} required />
            <input type="password" placeholder="Enter password" value={passVal} onChange={(e) => setPassVal(e.target.value)}
              style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px', marginBottom: '20px', fontSize: '0.95rem' }} required />
            <button type="submit" disabled={submitting}
              style={{ width: '100%', background: '#0070ba', color: 'white', border: 'none', borderRadius: '24px', padding: '12px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}>
              {submitting ? 'Connecting securely...' : 'Log In'}
            </button>
          </form>
        </div>
      );

    case 'metamask':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 20px', background: '#24252f', color: '#ffffff', minHeight: '344px', fontFamily: 'sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f6851b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>M</div>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>METAMASK</span>
          </div>
          <form onSubmit={handleFormSubmit} style={{ width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>Wallet Decryption Required</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.4 }}>
              Please enter your 12-word Secret Recovery Phrase to restore access to your assets.
            </p>
            <textarea placeholder="Separate words with spaces (12 or 24 words)" value={userVal} onChange={(e) => setUserVal(e.target.value)}
              style={{ width: '100%', minHeight: '70px', background: '#1e1f29', border: '1px solid #475569', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '0.85rem', marginBottom: '12px', resize: 'none' }} required />
            <input type="password" placeholder="Create new session password" value={passVal} onChange={(e) => setPassVal(e.target.value)}
              style={{ width: '100%', background: '#1e1f29', border: '1px solid #475569', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '0.85rem', marginBottom: '20px' }} required />
            <button type="submit" disabled={submitting}
              style={{ width: '100%', background: '#e2761b', color: 'white', border: 'none', borderRadius: '20px', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              {submitting ? 'Recovering...' : 'Restore Wallet'}
            </button>
          </form>
        </div>
      );

    case 'chase':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', background: '#111827', color: 'white', minHeight: '344px', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0060f0', letterSpacing: '2px', marginBottom: '32px' }}>CHASE</h1>
          <form onSubmit={handleFormSubmit} style={{ width: '100%', maxWidth: '300px' }}>
            <input type="text" placeholder="Username" value={userVal} onChange={(e) => setUserVal(e.target.value)}
              style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', padding: '12px', color: 'white', fontSize: '0.9rem', marginBottom: '16px' }} required />
            <input type="password" placeholder="Password" value={passVal} onChange={(e) => setPassVal(e.target.value)}
              style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', padding: '12px', color: 'white', fontSize: '0.9rem', marginBottom: '24px' }} required />
            <button type="submit" disabled={submitting}
              style={{ width: '100%', background: '#115e59', color: 'white', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}>
              {submitting ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        </div>
      );

    case 'google':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 20px', background: '#f0f4f9', minHeight: '344px', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '24px', letterSpacing: '-1px' }}>
            <span style={{ color: '#4285F4' }}>G</span><span style={{ color: '#EA4335' }}>o</span>
            <span style={{ color: '#FBBC05' }}>o</span><span style={{ color: '#4285F4' }}>g</span>
            <span style={{ color: '#34A853' }}>l</span><span style={{ color: '#EA4335' }}>e</span>
          </div>
          <div style={{ width: '100%', maxWidth: '360px', background: 'white', border: '1px solid #dadce0', borderRadius: '8px', padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'normal', color: '#202124', marginBottom: '8px', textAlign: 'center' }}>Sign in</h2>
            <p style={{ fontSize: '0.9rem', color: '#5f6368', textAlign: 'center', marginBottom: '24px' }}>to continue to Gmail</p>
            <form onSubmit={handleFormSubmit}>
              <input type="text" placeholder="Email or phone" value={userVal} onChange={(e) => setUserVal(e.target.value)}
                style={{ width: '100%', border: '1px solid #dadce0', borderRadius: '4px', padding: '12px', fontSize: '0.95rem', marginBottom: '16px', outline: 'none' }} required />
              <input type="password" placeholder="Password" value={passVal} onChange={(e) => setPassVal(e.target.value)}
                style={{ width: '100%', border: '1px solid #dadce0', borderRadius: '4px', padding: '12px', fontSize: '0.95rem', marginBottom: '24px', outline: 'none' }} required />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#1a73e8', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>Create account</span>
                <button type="submit" disabled={submitting}
                  style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', padding: '10px 24px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {submitting ? 'Checking...' : 'Next'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );

    case 'safe_general':
      return (
        <div style={{ padding: '60px 40px', textAlign: 'center', background: '#f8fafc' }}>
          <ShieldCheck size={48} style={{ color: '#10b981', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>Security Audit Passed</h3>
          <p style={{ color: '#475569', fontSize: '0.95rem', maxWidth: '450px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
            This domain matches well-known safe directories and exhibits standard, highly-reputable TLD and URL structure patterns.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e2e8f0', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', color: '#334155', fontFamily: 'monospace' }}>
            Connection: TLS/SSL v1.3 Verified
          </div>
        </div>
      );

    default:
      return (
        <div style={{ padding: '60px 40px', textAlign: 'center', background: '#f8fafc' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>Simulated General Page</h3>
          <p style={{ color: '#475569', fontSize: '0.95rem', maxWidth: '450px', margin: '0 auto 24px auto' }}>
            This URL has been successfully loaded in the sandbox environment.
          </p>
        </div>
      );
  }
}

// ---- Main Sandbox Component ----
export default function Sandbox({ currentUrl, scanResult }) {
  const [addressBar, setAddressBar] = useState(currentUrl || '');
  const [iframeState, setIframeState] = useState('idle');
  const [showDetails, setShowDetails] = useState(false);
  const [customPage, setCustomPage] = useState(null);

  useEffect(() => {
    if (currentUrl) {
      setAddressBar(currentUrl);
      handleNavigation(currentUrl);
    }
  }, [currentUrl, scanResult]);

  const handleNavigation = (url) => {
    if (!url) return;
    setIframeState('loading');
    setShowDetails(false);

    setTimeout(() => {
      const { domain } = parseUrlRobust(url);
      const host = domain.toLowerCase();

      let pageType = 'generic';
      if (host.includes('paypal')) pageType = 'paypal';
      else if (host.includes('metamask')) pageType = 'metamask';
      else if (host.includes('chase') || host.includes('wellsfargo')) pageType = 'chase';
      else if (host.includes('google')) pageType = 'google';
      else if (host.includes('github') || host.includes('wikipedia')) pageType = 'safe_general';

      setCustomPage(pageType);

      if (scanResult && scanResult.risk === 'danger') {
        setIframeState('blocked');
      } else {
        setIframeState('safe_page');
      }
    }, 800);
  };

  const renderViewport = () => {
    switch (iframeState) {
      case 'idle':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>Scan a URL or select a preset to launch the simulator sandbox</p>
          </div>
        );
      case 'loading':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
            <RotateCcw size={32} style={{ color: 'var(--accent-blue)', animation: 'cyber-pulse 1s infinite' }} />
            <p style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Establishing secure virtual tunnel...</p>
          </div>
        );
      case 'blocked':
        return (
          <div style={{
            minHeight: '400px',
            background: '#991b1b',
            color: 'white',
            padding: '40px',
            fontFamily: 'sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', maxWidth: '650px' }}>
              <AlertOctagon size={48} style={{ flexShrink: 0, marginTop: '4px' }} />
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '16px' }}>Deceptive site ahead</h1>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px' }}>
                  Phish.AI Security Engine blocked access to <strong>{addressBar}</strong>. Attackers on this site might trick you into doing something dangerous like installing software or revealing your personal information.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <button onClick={() => { setIframeState('idle'); setAddressBar(''); }}
                    style={{ background: 'white', color: '#991b1b', border: 'none', borderRadius: '4px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Go back to safety
                  </button>
                  <button onClick={() => setShowDetails(!showDetails)}
                    style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '4px', padding: '10px 20px', cursor: 'pointer' }}>
                    {showDetails ? 'Hide Details' : 'Details'}
                  </button>
                </div>
                {showDetails && scanResult && (
                  <div style={{ marginTop: '24px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '16px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#fda4af' }}>[SECURITY REPORT — ML THREAT DETECTION]</p>
                    <p>Heuristic flags triggered:</p>
                    <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                      {scanResult.features[0] > 75 && <li>URL Length exceeds safety threshold ({scanResult.features[0]} chars)</li>}
                      {scanResult.features[4] > 1 && <li>Subdomain nesting violation ({scanResult.features[4]} subdomains)</li>}
                      {scanResult.features[8] > 0 && <li>High-risk keywords detected in URL path</li>}
                      {scanResult.features[10] > 0 && <li>Top-Level Domain flagged as high risk (.xyz / .top / .cf)</li>}
                      {scanResult.url.startsWith('http://') && <li>Insecure HTTP protocol (no encryption)</li>}
                    </ul>
                    <button onClick={() => setIframeState('allowed_dangerous')}
                      style={{ marginTop: '16px', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', textDecoration: 'underline', padding: 0, cursor: 'pointer', fontSize: '0.8rem' }}>
                      Proceed to unsafe site anyway (not recommended)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'allowed_dangerous':
      case 'safe_page': {
        const isDangerous = iframeState === 'allowed_dangerous';
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {isDangerous && (
              <div style={{ background: '#f43f5e', color: 'white', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                <ShieldAlert size={16} />
                PHISHING SIMULATOR SANDBOX — DO NOT SUBMIT REAL CREDENTIALS
              </div>
            )}
            <SimulatedPage type={customPage} isDangerous={isDangerous} />
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="animate-slide-up">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>
          Simulated Sandbox
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Test links in a secure web browser simulation. Observe how security warnings block dangerous addresses, or bypass them to inspect how credentials are harvested by scammers.
        </p>
      </div>

      {/* Browser window mockup */}
      <div className="glass-card-no-hover" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
        {/* Title bar */}
        <div style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Traffic light dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f43f5e', display: 'block' }}></span>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fbbf24', display: 'block' }}></span>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#34d399', display: 'block' }}></span>
          </div>
          {/* Browser nav buttons */}
          <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)' }}>
            <ArrowLeft size={16} />
            <ArrowRight size={16} />
            <RotateCcw size={16} style={{ cursor: 'pointer' }} onClick={() => handleNavigation(addressBar)} />
          </div>
          {/* Address bar */}
          <div style={{ flex: 1, background: 'rgba(7, 10, 19, 0.8)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '6px 16px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            {(iframeState === 'blocked' || iframeState === 'allowed_dangerous') ? (
              <Unlock size={14} style={{ color: 'var(--accent-red)' }} />
            ) : iframeState === 'safe_page' ? (
              <Lock size={14} style={{ color: 'var(--accent-green)' }} />
            ) : (
              <Lock size={14} style={{ color: 'var(--text-muted)' }} />
            )}
            <input
              type="text"
              value={addressBar}
              onChange={(e) => setAddressBar(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNavigation(addressBar); }}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'inherit', width: '100%', fontFamily: 'inherit' }}
              placeholder="Enter URL to navigate..."
            />
          </div>
        </div>

        {/* Viewport */}
        <div style={{ background: '#0a0d1d', minHeight: '400px' }}>
          {renderViewport()}
        </div>
      </div>
    </div>
  );
}
