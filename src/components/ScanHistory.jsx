import React, { useEffect, useState } from 'react';
import { History, Trash2, ShieldAlert, ShieldCheck, AlertTriangle, ChevronRight, Database, BarChart2, FileText, ExternalLink } from 'lucide-react';
import { getAllScans, getScanStats, clearAllScans } from '../utils/db';
import { generatePDFReport } from '../utils/pdfReport';

const FEATURE_NAMES = [
  'url_length', 'qty_at', 'qty_double_slash', 'qty_hyphen_domain',
  'qty_subdomains', 'qty_https_domain', 'ip_presence', 'qty_shortening_service',
  'qty_suspicious_keywords', 'qty_non_standard_port', 'tld_safety_index', 'sensitive_char_ratio'
];

function RiskBadge({ risk }) {
  switch (risk) {
    case 'danger':
      return <span className="cyber-badge cyber-badge-danger" style={{ fontSize: '0.7rem' }}><ShieldAlert size={11} /> PHISHING</span>;
    case 'warning':
      return <span className="cyber-badge cyber-badge-warning" style={{ fontSize: '0.7rem' }}><AlertTriangle size={11} /> SUSPICIOUS</span>;
    default:
      return <span className="cyber-badge cyber-badge-safe" style={{ fontSize: '0.7rem' }}><ShieldCheck size={11} /> SAFE</span>;
  }
}

function formatDate(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch {
    return isoStr;
  }
}

export default function ScanHistory({ dbReady, onReplayScan }) {
  const [scans, setScans] = useState([]);
  const [stats, setStats] = useState({ total: 0, phishing: 0, safe: 0, suspicious: 0 });
  const [generatingPdf, setGeneratingPdf] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const loadData = () => {
    if (!dbReady) return;
    setScans(getAllScans());
    setStats(getScanStats());
  };

  useEffect(() => {
    loadData();
  }, [dbReady]);

  const handleClearHistory = () => {
    clearAllScans();
    setScans([]);
    setStats({ total: 0, phishing: 0, safe: 0, suspicious: 0 });
    setShowClearConfirm(false);
  };

  const handleDownloadPDF = async (scan) => {
    setGeneratingPdf(scan.id);
    try {
      const features = JSON.parse(scan.features);
      await generatePDFReport({
        url: scan.url,
        risk: scan.risk,
        probability: scan.probability,
        features: features
      });
    } catch (e) {
      console.error('PDF generation failed', e);
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleReplay = (scan) => {
    const features = JSON.parse(scan.features);
    onReplayScan({
      url: scan.url,
      risk: scan.risk,
      probability: scan.probability,
      features: features
    });
  };

  if (!dbReady) {
    return (
      <div className="animate-slide-up">
        <div className="glass-card-no-hover" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <Database size={48} style={{ color: 'var(--accent-blue)', margin: '0 auto 16px auto', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-secondary)' }}>Initializing SQLite database engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      {/* Page header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>
            Scan History
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Persistent scan records stored in a local{' '}
            <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(59,130,246,0.08)', color: 'var(--accent-blue)', padding: '2px 6px', borderRadius: '4px' }}>
              SQLite
            </code>{' '}
            database. Data survives page reloads. Replay any past scan or download its full PDF report.
          </p>
        </div>

        {stats.total > 0 && (
          <div>
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '10px', padding: '10px 16px', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}>
                <Trash2 size={15} />
                Clear History
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleClearHistory}
                  style={{ background: 'var(--accent-red)', border: 'none', borderRadius: '10px', padding: '10px 14px', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                  Confirm Delete
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '20px', cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Database size={18} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Total Scans</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{stats.total}</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', cursor: 'default', borderColor: 'rgba(244,63,94,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <ShieldAlert size={18} style={{ color: 'var(--accent-red)' }} />
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Phishing Detected</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--accent-red)' }}>{stats.phishing}</div>
          {stats.total > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {((stats.phishing / stats.total) * 100).toFixed(1)}% of scans
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: '20px', cursor: 'default', borderColor: 'rgba(234,179,8,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--accent-yellow)' }} />
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Suspicious</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--accent-yellow)' }}>{stats.suspicious}</div>
          {stats.total > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {((stats.suspicious / stats.total) * 100).toFixed(1)}% of scans
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: '20px', cursor: 'default', borderColor: 'rgba(16,185,129,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <ShieldCheck size={18} style={{ color: 'var(--accent-green)' }} />
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Safe URLs</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--accent-green)' }}>{stats.safe}</div>
          {stats.total > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {((stats.safe / stats.total) * 100).toFixed(1)}% of scans
            </div>
          )}
        </div>
      </div>

      {/* Distribution bar */}
      {stats.total > 0 && (
        <div className="glass-card-no-hover" style={{ marginBottom: '28px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart2 size={14} /> Threat Distribution
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last {stats.total} scans</span>
          </div>
          <div style={{ height: '10px', borderRadius: '10px', overflow: 'hidden', display: 'flex', gap: '2px' }}>
            {stats.phishing > 0 && (
              <div style={{ flex: stats.phishing, background: 'var(--accent-red)', boxShadow: '0 0 10px rgba(244,63,94,0.4)' }} />
            )}
            {stats.suspicious > 0 && (
              <div style={{ flex: stats.suspicious, background: 'var(--accent-yellow)', boxShadow: '0 0 10px rgba(234,179,8,0.3)' }} />
            )}
            {stats.safe > 0 && (
              <div style={{ flex: stats.safe, background: 'var(--accent-green)', boxShadow: '0 0 10px rgba(16,185,129,0.3)' }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-red)', display: 'inline-block' }}></span> Phishing ({stats.phishing})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-yellow)', display: 'inline-block' }}></span> Suspicious ({stats.suspicious})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }}></span> Safe ({stats.safe})
            </span>
          </div>
        </div>
      )}

      {/* History table or empty state */}
      {scans.length === 0 ? (
        <div className="glass-card-no-hover" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <History size={52} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.4 }} />
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>
            No Scan History Yet
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
            Every URL you analyze will be automatically saved here. Head to the <strong>URL Safety Scanner</strong> to run your first scan.
          </p>
        </div>
      ) : (
        <div className="glass-card-no-hover" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 90px 140px 160px',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(0,0,0,0.2)'
          }}>
            {['URL', 'Risk Level', 'ML Score', 'Scanned At', 'Actions'].map(h => (
              <div key={h} style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                {h}
              </div>
            ))}
          </div>

          {/* Table rows */}
          {scans.map((scan, idx) => (
            <div key={scan.id}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 90px 140px 160px',
                  padding: '14px 20px',
                  borderBottom: idx < scans.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  background: expandedRow === scan.id ? 'rgba(59,130,246,0.04)' : 'transparent',
                  alignItems: 'center'
                }}
                onClick={() => setExpandedRow(expandedRow === scan.id ? null : scan.id)}
                onMouseEnter={(e) => { if (expandedRow !== scan.id) e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; }}
                onMouseLeave={(e) => { if (expandedRow !== scan.id) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* URL column */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <ChevronRight
                    size={14}
                    style={{
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                      transition: 'transform 0.2s ease',
                      transform: expandedRow === scan.id ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {scan.url}
                  </span>
                </div>

                {/* Risk badge */}
                <div><RiskBadge risk={scan.risk} /></div>

                {/* Score */}
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: scan.risk === 'danger' ? 'var(--accent-red)' : scan.risk === 'warning' ? 'var(--accent-yellow)' : 'var(--accent-green)'
                }}>
                  {(scan.probability * 100).toFixed(1)}%
                </div>

                {/* Timestamp */}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {formatDate(scan.scanned_at)}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleReplay(scan)}
                    title="Re-analyze this URL"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '6px', padding: '5px 10px', fontSize: '0.75rem', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
                    <ExternalLink size={12} /> Replay
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(scan)}
                    disabled={generatingPdf === scan.id}
                    title="Download PDF report"
                    style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '6px', padding: '5px 10px', fontSize: '0.75rem', color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s', opacity: generatingPdf === scan.id ? 0.5 : 1 }}>
                    <FileText size={12} /> {generatingPdf === scan.id ? '...' : 'PDF'}
                  </button>
                </div>
              </div>

              {/* Expanded feature details */}
              {expandedRow === scan.id && (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)', padding: '16px 20px 16px 52px' }} className="animate-fade-in">
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Extracted Feature Vector
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {JSON.parse(scan.features).map((val, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        fontSize: '0.72rem'
                      }}>
                        <span style={{ color: 'var(--text-muted)' }}>{FEATURE_NAMES[i]}: </span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: val > 0 ? '#fda4af' : 'var(--text-secondary)', fontWeight: val > 0 ? 600 : 400 }}>
                          {i === 11 ? `${(val * 100).toFixed(2)}%` : val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
