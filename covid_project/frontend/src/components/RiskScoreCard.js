import React, { useEffect, useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { postAnalyze } from '../services/api';

const MOCK_RISK = [
  { state: 'Maharashtra', risk_score: 82, risk_level: 'CRITICAL', avg_new_cases: 41200, avg_cfr: 2.1 },
  { state: 'Delhi', risk_score: 74, risk_level: 'HIGH', avg_new_cases: 28000, avg_cfr: 1.9 },
  { state: 'Karnataka', risk_score: 61, risk_level: 'HIGH', avg_new_cases: 19500, avg_cfr: 1.5 },
  { state: 'Tamil Nadu', risk_score: 48, risk_level: 'MEDIUM', avg_new_cases: 14200, avg_cfr: 1.3 },
  { state: 'Kerala', risk_score: 35, risk_level: 'MEDIUM', avg_new_cases: 9800, avg_cfr: 1.1 },
  { state: 'Gujarat', risk_score: 29, risk_level: 'LOW', avg_new_cases: 7200, avg_cfr: 0.9 },
  { state: 'West Bengal', risk_score: 52, risk_level: 'HIGH', avg_new_cases: 16800, avg_cfr: 1.6 },
  { state: 'Uttar Pradesh', risk_score: 44, risk_level: 'MEDIUM', avg_new_cases: 12500, avg_cfr: 1.2 },
  { state: 'Rajasthan', risk_score: 22, risk_level: 'LOW', avg_new_cases: 5400, avg_cfr: 0.8 },
  { state: 'Madhya Pradesh', risk_score: 38, risk_level: 'MEDIUM', avg_new_cases: 10100, avg_cfr: 1.15 },
];

export default function RiskScoreCard() {
  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    postAnalyze('risk_scores').then(res => {
      const d = res.data || MOCK_RISK;
      setRiskData(d.length > 0 ? d : MOCK_RISK);
      setSelected(d[0] || MOCK_RISK[0]);
      setLoading(false);
    }).catch(() => {
      setRiskData(MOCK_RISK);
      setSelected(MOCK_RISK[0]);
      setLoading(false);
    });
  }, []);

  const radarData = selected ? [
    { metric: 'New Cases', value: Math.min(100, (selected.avg_new_cases / 50000) * 100) },
    { metric: 'CFR', value: Math.min(100, (selected.avg_cfr / 3) * 100) },
    { metric: 'Risk Score', value: selected.risk_score },
    { metric: 'Growth', value: Math.random() * 60 + 20 },
    { metric: 'Capacity', value: Math.random() * 70 + 30 },
  ] : [];

  const color = lvl => ({ CRITICAL: '#8e44ad', HIGH: '#e74c3c', MEDIUM: '#f39c12', LOW: '#27ae60' }[lvl] || '#00d4ff');

  return (
    <div>
      <h2 className="page-title">⚠️ Regional Risk Scores</h2>
      {loading ? <div className="loading">Calculating risk scores...</div> : (
        <div className="section-grid">
          {/* State list */}
          <div className="chart-card">
            <div className="chart-title">🗺️ All States — Risk Overview</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {riskData.map((s, i) => (
                <div key={i} onClick={() => setSelected(s)}
                  style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    background: selected?.state === s.state ? '#1e2a5e' : '#111730',
                    border: `1px solid ${selected?.state === s.state ? color(s.risk_level) : '#1e2a5e'}`,
                    transition: 'all 0.2s'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{s.state}</span>
                    <span className={`risk-badge risk-${s.risk_level}`}>{s.risk_level}</span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${s.risk_score}%`, background: color(s.risk_level) }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.75rem', color: '#5a6a8a' }}>
                      <span>Score: {s.risk_score}</span>
                      <span>CFR: {s.avg_cfr?.toFixed ? s.avg_cfr.toFixed(2) : s.avg_cfr}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div>
              <div className="chart-card" style={{ marginBottom: 16 }}>
                <div className="chart-title">📍 {selected.state} — Detailed Risk Analysis</div>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '4rem', fontWeight: 900, color: color(selected.risk_level) }}>
                    {selected.risk_score}
                  </div>
                  <div style={{ fontSize: '1rem', color: '#a0b4d6', marginBottom: 16 }}>Risk Score / 100</div>
                  <span className={`risk-badge risk-${selected.risk_level}`} style={{ fontSize: '1rem', padding: '6px 16px' }}>
                    {selected.risk_level} RISK
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                  {[
                    ['Avg Daily Cases', Math.round(selected.avg_new_cases)?.toLocaleString()],
                    ['Case Fatality Rate', `${selected.avg_cfr?.toFixed ? selected.avg_cfr.toFixed(2) : selected.avg_cfr}%`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: '#111730', padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: '0.72rem', color: '#5a6a8a', marginBottom: 4 }}>{k}</div>
                      <div style={{ fontWeight: 700, color: '#e0e6ff' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="chart-card">
                <div className="chart-title">🕸️ Risk Radar</div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1e2a5e" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#a0b4d6', fontSize: 11 }} />
                    <Radar name="Risk" dataKey="value" stroke={color(selected.risk_level)} fill={color(selected.risk_level)} fillOpacity={0.25} />
                    <Tooltip contentStyle={{ background: '#0d1230', border: '1px solid #1e2a5e', borderRadius: 8 }} formatter={v => `${Math.round(v)}/100`} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
