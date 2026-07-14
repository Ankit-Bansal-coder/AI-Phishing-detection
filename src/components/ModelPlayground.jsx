import React, { useState, useEffect } from 'react';
import { Settings, BarChart2, Cpu, RefreshCw, Info, Code, Play } from 'lucide-react';
import { predictLogisticRegression, extractFeatures } from '../utils/featureExtractor';

export default function ModelPlayground({ modelData, currentUrl, scanResult, setScanResult }) {
  const lrMetrics = modelData.logistic_regression.metrics;
  const dtMetrics = modelData.decision_tree.metrics;
  const originalWeights = modelData.logistic_regression.coefficients;
  const featuresList = modelData.features;

  // Custom weights state for interactive slider adjustments
  const [customWeights, setCustomWeights] = useState([...originalWeights]);
  const [playgroundProb, setPlaygroundProb] = useState(scanResult ? scanResult.probability : 0.5);
  const [playgroundFeatures, setPlaygroundFeatures] = useState(
    scanResult ? scanResult.features : extractFeatures('https://paypal-security-alert.xyz/login')
  );
  const [playgroundUrl, setPlaygroundUrl] = useState(
    scanResult ? scanResult.url : 'https://paypal-security-alert.xyz/login'
  );

  useEffect(() => {
    if (scanResult) {
      setPlaygroundFeatures(scanResult.features);
      setPlaygroundUrl(scanResult.url);
      recalculateScore(scanResult.features, customWeights);
    }
  }, [scanResult]);

  const recalculateScore = (feats, weights) => {
    const prob = predictLogisticRegression(feats, modelData, weights);
    setPlaygroundProb(prob);
  };

  const handleWeightChange = (index, value) => {
    const updated = [...customWeights];
    updated[index] = parseFloat(value);
    setCustomWeights(updated);
    recalculateScore(playgroundFeatures, updated);
  };

  const resetWeights = () => {
    setCustomWeights([...originalWeights]);
    recalculateScore(playgroundFeatures, originalWeights);
  };

  const getRiskColor = (prob) => {
    if (prob >= 0.7) return 'var(--accent-red)';
    if (prob >= 0.35) return 'var(--accent-yellow)';
    return 'var(--accent-green)';
  };

  const codeSnippet = `import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier

# 1. Initialize classifiers
lr_model = LogisticRegression(max_iter=1000)
dt_model = DecisionTreeClassifier(max_depth=4)

# 2. Train on URL features
lr_model.fit(X_train, y_train)
dt_model.fit(X_train, y_train)

# 3. Export weights & thresholds for browser execution
weights = lr_model.coef_[0]
intercept = lr_model.intercept_[0]
`;

  return (
    <div className="animate-slide-up">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>
          Model Training Playground
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Explore the performance profiles of the models trained on the Python pipeline. Adjust feature weights interactively to see how the decision boundary responds.
        </p>
      </div>

      {/* Grid of metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card-no-hover metric-box">
          <div className="metric-value">{(lrMetrics.accuracy * 100).toFixed(2)}%</div>
          <div className="metric-label">Model Accuracy</div>
        </div>
        <div className="glass-card-no-hover metric-box">
          <div className="metric-value">{(lrMetrics.precision * 100).toFixed(2)}%</div>
          <div className="metric-label">Precision Rate</div>
        </div>
        <div className="glass-card-no-hover metric-box">
          <div className="metric-value">{(lrMetrics.recall * 100).toFixed(2)}%</div>
          <div className="metric-label">Recall (Sensitivity)</div>
        </div>
        <div className="glass-card-no-hover metric-box">
          <div className="metric-value">{(lrMetrics.f1_score * 100).toFixed(2)}%</div>
          <div className="metric-label">F1 Threat Score</div>
        </div>
      </div>

      <div className="dashboard-grid">
        
        {/* Left Side: interactive weights playground */}
        <div className="glass-card-no-hover" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} style={{ color: 'var(--accent-blue)' }} />
              Interactive Weights Tuner
            </h2>
            <button 
              onClick={resetWeights}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
              <RefreshCw size={12} />
              Reset Weights
            </button>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Modify the coefficient values for the current test target. Slide left (negative) to make the feature indicate safety, slide right (positive) to make it indicate a phishing threat.
          </p>

          {/* Current URL indicator */}
          <div style={{ 
            background: 'rgba(0,0,0,0.2)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '10px', 
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '0.85rem'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>Target URL: </span>
            <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', wordBreak: 'break-all' }}>{playgroundUrl}</code>
          </div>

          {/* Live playground prediction */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.02)', 
            border: `1px solid ${getRiskColor(playgroundProb)}`, 
            borderRadius: '12px', 
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                Recalculated Risk Score
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: getRiskColor(playgroundProb), marginTop: '4px' }}>
                {(playgroundProb * 100).toFixed(2)}% Phishing Risk
              </div>
            </div>
            <div style={{ 
              background: getRiskColor(playgroundProb) + '1a',
              color: getRiskColor(playgroundProb),
              border: `1px solid ${getRiskColor(playgroundProb)}33`,
              borderRadius: '24px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              {playgroundProb >= 0.7 ? 'Dangerous' : playgroundProb >= 0.35 ? 'Suspicious' : 'Legit'}
            </div>
          </div>

          {/* Sliders list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {featuresList.map((featName, idx) => {
              const weightVal = customWeights[idx];
              const featVal = playgroundFeatures[idx];
              const contrib = weightVal * featVal;
              
              return (
                <div key={featName} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: featVal > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {featName} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>({featVal})</span>
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: contrib > 0 ? '#fda4af' : contrib < 0 ? '#a7f3d0' : 'var(--text-muted)' }}>
                      Contrib: {contrib >= 0 ? '+' : ''}{contrib.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="range"
                      min="-4.0"
                      max="4.0"
                      step="0.05"
                      value={weightVal}
                      onChange={(e) => handleWeightChange(idx, e.target.value)}
                      style={{ flex: 1, accentColor: 'var(--accent-blue)', height: '6px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', outline: 'none' }}
                    />
                    <span style={{ minWidth: '45px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      {weightVal.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Charts & Math Code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* ROC Curve Graph */}
          <div className="glass-card-no-hover">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} style={{ color: 'var(--accent-purple)' }} />
              ROC-AUC Performance Curve
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
              The Receiver Operating Characteristic curve measures model trade-off. An AUC of 1.0 represents a perfect classifier.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
              <div style={{ position: 'relative', width: '220px', height: '220px', borderLeft: '2px solid rgba(255,255,255,0.1)', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                {/* Diagonal random guess line */}
                <svg width="220" height="220" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <line x1="0" y1="220" x2="220" y2="0" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" strokeWidth="2" />
                  
                  {/* ROC curve path */}
                  <path 
                    d={`M 0 220 ` + lrMetrics.roc_curve.map(pt => `${pt.fpr * 220} ${220 - (pt.tpr * 220)}`).join(' L ')}
                    fill="none"
                    stroke="var(--accent-purple)"
                    strokeWidth="3"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.4))' }}
                  />
                </svg>

                {/* Legend Labels */}
                <div style={{ position: 'absolute', bottom: '6px', right: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  FPR (1 - Spec)
                </div>
                <div style={{ position: 'absolute', top: '6px', left: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', transform: 'rotate(90deg)', transformOrigin: 'top left' }}>
                  TPR (Recall)
                </div>
                <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', fontFamily: 'var(--font-heading)', color: 'white' }}>
                  AUC: ~0.985
                </div>
              </div>
            </div>
          </div>

          {/* Confusion Matrix Panel */}
          <div className="glass-card-no-hover">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} style={{ color: 'var(--accent-green)' }} />
              Confusion Matrix (Test Set)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
              Classification breakdown on test predictions. Measures errors: False Positives & False Negatives.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
              {/* Row Header */}
              <div></div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Pred LEGIT</div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Pred PHISH</div>

              {/* Row 1 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 600, color: 'var(--text-secondary)', paddingRight: '8px' }}>Actual L</div>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-green)' }}>{lrMetrics.confusion_matrix[0][0]}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>True Neg (TN)</div>
              </div>
              <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-red)' }}>{lrMetrics.confusion_matrix[0][1]}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>False Pos (FP)</div>
              </div>

              {/* Row 2 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 600, color: 'var(--text-secondary)', paddingRight: '8px' }}>Actual P</div>
              <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-red)' }}>{lrMetrics.confusion_matrix[1][0]}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>False Neg (FN)</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-green)' }}>{lrMetrics.confusion_matrix[1][1]}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>True Pos (TP)</div>
              </div>
            </div>
          </div>

          {/* Model Training script details */}
          <div className="glass-card-no-hover">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code size={18} style={{ color: 'var(--text-secondary)' }} />
              Scikit-Learn Code Setup
            </h2>
            <pre style={{ 
              background: 'rgba(0,0,0,0.3)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '14px', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.75rem', 
              color: '#cbd5e1', 
              overflowX: 'auto',
              lineHeight: 1.5
            }}>{codeSnippet}</pre>
          </div>

        </div>

      </div>
    </div>
  );
}
