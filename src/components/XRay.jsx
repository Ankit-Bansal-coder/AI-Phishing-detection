import React from 'react';
import { Network, Activity, HelpCircle, ArrowRight, CornerDownRight, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { predictDecisionTree } from '../utils/featureExtractor';

export default function XRay({ modelData, currentUrl, scanResult }) {
  if (!scanResult) {
    return (
      <div className="glass-card-no-hover text-center animate-slide-up" style={{ padding: '60px 40px' }}>
        <Network size={48} style={{ color: 'var(--accent-blue)', margin: '0 auto 16px auto', opacity: 0.6 }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
          Explainable AI (X-Ray Mode)
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 24px auto' }}>
          Inspect the mathematical reasoning and rule-based decision trees behind the predictions. Scan a URL first to view live model interpretations.
        </p>
      </div>
    );
  }

  const { features, probability, url } = scanResult;

  // Predict with Decision Tree to get the path
  const dtResult = predictDecisionTree(features, modelData.decision_tree.root);

  // Logistic Regression Feature Weights math
  const lrWeights = modelData.logistic_regression.coefficients;
  const lrIntercept = modelData.logistic_regression.intercept;
  
  // Calculate raw z sum
  let zSum = lrIntercept;
  const mathSteps = lrWeights.map((w, idx) => {
    const val = features[idx];
    const contribution = w * val;
    zSum += contribution;
    return {
      featureIndex: idx,
      featureName: modelData.features[idx],
      weight: w,
      value: val,
      contribution: contribution
    };
  });

  return (
    <div className="animate-slide-up">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>
          X-Ray Explainability
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Deconstruct the decisions. Below is a breakdown of how the Logistic Regression equations and Decision Tree boundaries analyzed <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-blue)', fontSize: '0.95rem' }}>{url}</code>.
        </p>
      </div>

      <div className="dashboard-grid">
        
        {/* Logistic Regression Formula dissection */}
        <div className="glass-card-no-hover" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} style={{ color: 'var(--accent-purple)' }} />
            Logistic Regression Weights
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Linear weights indicate how much a feature pushes the prediction towards Phishing (positive/red) or Legitimate (negative/green).
          </p>

          {/* Mathematical formulation block */}
          <div style={{ 
            background: 'rgba(0,0,0,0.3)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '12px', 
            padding: '16px', 
            fontFamily: 'var(--font-mono)', 
            fontSize: '0.8rem', 
            marginBottom: '20px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6'
          }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px' }}>
              Inference Formulas:
            </div>
            <div>z = Intercept ({lrIntercept.toFixed(4)}) + &Sigma; (Weight<sub>i</sub> &times; Feature<sub>i</sub>)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', margin: '4px 0' }}>
              <span>z = </span>
              <span style={{ color: 'var(--text-primary)' }}>{lrIntercept.toFixed(2)}</span>
              {mathSteps.map((step) => {
                if (step.value === 0) return null;
                const sign = step.weight >= 0 ? '+' : '-';
                return (
                  <span key={step.featureIndex}>
                    {sign} ({Math.abs(step.weight).toFixed(2)} &times; {step.value})
                  </span>
                );
              })}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '6px' }}>
              z = <strong style={{ color: 'var(--text-primary)' }}>{zSum.toFixed(4)}</strong>
            </div>
            <div>
              Probability = 1 / (1 + e<sup>-z</sup>) = <strong style={{ color: 'var(--accent-blue)' }}>{(probability * 100).toFixed(2)}% Risk</strong>
            </div>
          </div>

          {/* List of features contribution */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mathSteps.map((step) => {
              const absW = Math.abs(step.weight);
              const maxW = 5.0; // scale limit for visual bar
              const percent = Math.min(100, (absW / maxW) * 100);
              const isPositive = step.weight >= 0;
              const hasEffect = step.value > 0;
              
              return (
                <div key={step.featureIndex} style={{ 
                  background: hasEffect ? 'rgba(255,255,255,0.01)' : 'transparent',
                  border: `1px solid ${hasEffect ? 'rgba(255,255,255,0.04)' : 'transparent'}`,
                  borderRadius: '10px',
                  padding: '8px 12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: hasEffect ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {step.featureName}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: isPositive ? '#f43f5e' : '#10b981' }}>
                      w = {step.weight >= 0 ? '+' : ''}{step.weight.toFixed(3)}
                    </span>
                  </div>
                  
                  {/* Visual weight bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', position: 'relative' }}>
                      <div style={{ 
                        position: 'absolute', 
                        right: isPositive ? 'auto' : '50%',
                        left: isPositive ? '50%' : 'auto',
                        width: `${percent / 2}%`,
                        height: '100%',
                        background: isPositive ? 'var(--accent-red)' : 'var(--accent-green)',
                        borderRadius: '10px',
                        boxShadow: isPositive ? '0 0 8px rgba(244, 63, 94, 0.4)' : '0 0 8px rgba(16, 185, 129, 0.4)'
                      }}></div>
                      {/* Mid line anchor */}
                      <div style={{ position: 'absolute', left: '50%', top: '-2px', width: '1px', height: '8px', background: 'rgba(255,255,255,0.2)' }}></div>
                    </div>
                    
                    {/* Live values math */}
                    <div style={{ minWidth: '105px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>({step.value})</span>
                      <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>&times;</span>
                      <span style={{ color: step.contribution > 0 ? '#fda4af' : step.contribution < 0 ? '#a7f3d0' : 'var(--text-muted)', fontWeight: step.contribution !== 0 ? 600 : 400 }}>
                        {step.contribution >= 0 ? '+' : ''}{step.contribution.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Decision Tree path */}
        <div className="glass-card-no-hover" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={20} style={{ color: 'var(--accent-blue)' }} />
            Decision Tree Boundary Path
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Decision Trees classify URLs by testing features sequentially against thresholds. Follow the path taken by the active URL.
          </p>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {dtResult.path.map((step, idx) => (
              <div key={idx} className="animate-fade-in" style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                {/* Visual vertical connector line */}
                {idx < dtResult.path.length && (
                  <div style={{ 
                    position: 'absolute', 
                    left: '19px', 
                    top: '38px', 
                    width: '2px', 
                    bottom: '-24px', 
                    background: step.isTrue ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                    zIndex: 0
                  }}></div>
                )}

                {/* Node icon indicating split */}
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: step.isTrue ? 'rgba(59, 130, 246, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                  border: `2px solid ${step.isTrue ? 'var(--accent-blue)' : 'var(--accent-yellow)'}`,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  color: step.isTrue ? 'var(--accent-blue)' : 'var(--accent-yellow)',
                  zIndex: 1
                }}>
                  {idx + 1}
                </div>

                <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 16px', zIndex: 1 }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Step {idx + 1} Split Condition
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{step.featureName}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        Value: {step.value.toFixed(step.featureName === 'sensitive_char_ratio' ? 4 : 0)}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Condition:</span>
                    <span style={{ color: 'var(--text-primary)' }}>{step.condition}</span>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      background: step.isTrue ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                      color: step.isTrue ? 'var(--accent-green)' : 'var(--accent-red)',
                      fontWeight: 600
                    }}>
                      {step.isTrue ? 'TRUE (GO LEFT)' : 'FALSE (GO RIGHT)'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Leaf Node Output */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: dtResult.prediction === 1 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `2px solid ${dtResult.prediction === 1 ? 'var(--accent-red)' : 'var(--accent-green)'}`,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                zIndex: 1
              }}>
                {dtResult.prediction === 1 ? <AlertTriangle size={18} style={{ color: 'var(--accent-red)' }} /> : <ShieldCheck size={18} style={{ color: 'var(--accent-green)' }} />}
              </div>

              <div style={{ flex: 1, background: dtResult.prediction === 1 ? 'rgba(244, 63, 94, 0.03)' : 'rgba(16, 185, 129, 0.03)', border: `1px solid ${dtResult.prediction === 1 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`, borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Decision Leaf Node Reached
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px', color: dtResult.prediction === 1 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                  {dtResult.prediction === 1 ? 'Classified as Phishing' : 'Classified as Legitimate'}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Tree Leaf Node Probability: <strong style={{ color: 'var(--text-primary)' }}>{(dtResult.probability * 100).toFixed(1)}%</strong> of samples matching this final path were malicious during training.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
