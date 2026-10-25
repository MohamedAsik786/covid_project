import React, { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';

const fmt = (n) => {
  if (n >= 1e7) return (n / 1e7).toFixed(1) + ' Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(1) + ' L';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n?.toString() || '0';
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(res => {
      setData(res.data || res);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading">⏳ Loading dashboard...</div>;
  if (!data) return <div className="loading">❌ Failed to load data</div>;

  const { stats, alert_summary, top_risk_states } = data;

  return (
    <div>
      <h2 className="page-title">🦠 COVID-19 Analytics Dashboard</h2>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card confirmed">
          <div className="label">Total Confirmed</div>
          <div className="value">{fmt(stats.total_confirmed)}</div>
          <div className="sub">All countries combined</div>
        </div>
        <div className="kpi-card deaths">
          <div className="label">Total Deaths</div>
          <div className="value">{fmt(stats.total_deaths)}</div>
          <div className="sub">CFR: {stats.avg_cfr}%</div>
        </div>
        <div className="kpi-card recovered">
          <div className="label">Total Recovered</div>
          <div className="value">{fmt(stats.total_recovered)}</div>
          <div className="sub">Recovery: {stats.avg_recovery_rate}%</div>
        </div>
        <div className="kpi-card active">
          <div className="label">Active Cases</div>
          <div className="value">{fmt(stats.total_active)}</div>
          <div className="sub">Currently infected</div>
        </div>
        <div className="kpi-card vaccinated">
          <div className="label">Total Vaccinated</div>
          <div className="value">{fmt(stats.total_vaccinated)}</div>
          <div className="sub">Doses administered</div>
        </div>
        <div className="kpi-card alerts">
          <div className="label">Active Alerts</div>
          <div className="value">{alert_summary?.total || 0}</div>
          <div className="sub">
            🔴 {alert_summary?.by_level?.CRITICAL || 0} Critical &nbsp;
            🟠 {alert_summary?.by_level?.HIGH || 0} High
          </div>
        </div>
      </div>

      {/* Risk State Table */}
      <div className="chart-card" style={{ marginBottom: 20 }}>
        <div className="chart-title">🗺️ Top Risk States — Current Status</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Risk Score</th>
              <th>Risk Level</th>
              <th>Avg Daily Cases</th>
              <th>CFR %</th>
              <th>Risk Meter</th>
            </tr>
          </thead>
          <tbody>
            {(top_risk_states || []).map((s, i) => (
              <tr key={i}>
                <td>🏙️ {s.state}</td>
                <td style={{ fontWeight: 700, color: '#00d4ff' }}>{s.risk_score}</td>
                <td><span className={`risk-badge risk-${s.risk_level}`}>{s.risk_level}</span></td>
                <td>{Math.round(s.avg_new_cases).toLocaleString()}</td>
                <td>{s.avg_cfr?.toFixed ? s.avg_cfr.toFixed(2) : s.avg_cfr}%</td>
                <td style={{ width: 120 }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${s.risk_score}%`,
                      background: s.risk_score >= 75 ? '#8e44ad' : s.risk_score >= 50 ? '#e74c3c' : '#f39c12'
                    }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* India Summary */}
      <div className="chart-card">
        <div className="chart-title">🇮🇳 India Summary</div>
        <div className="kpi-grid">
          <div className="kpi-card confirmed">
            <div className="label">India Confirmed</div>
            <div className="value">{fmt(stats.india_confirmed)}</div>
          </div>
          <div className="kpi-card deaths">
            <div className="label">India Deaths</div>
            <div className="value">{fmt(stats.india_deaths)}</div>
          </div>
          <div className="kpi-card active">
            <div className="label">ICU Admissions</div>
            <div className="value">{fmt(stats.icu_admissions)}</div>
          </div>
          <div className="kpi-card vaccinated">
            <div className="label">Patients Tracked</div>
            <div className="value">{fmt(stats.total_patients)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
