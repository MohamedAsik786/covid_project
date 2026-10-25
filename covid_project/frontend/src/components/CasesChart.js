import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { getCases } from '../services/api';

const STATES = ['All India', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Kerala', 'Gujarat'];

export default function CasesChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('');
  const [chartType, setChartType] = useState('area');

  useEffect(() => {
    setLoading(true);
    getCases({ state: selectedState || undefined, limit: 150 }).then(res => {
      const rows = res.data || [];
      const cleaned = rows.map(r => ({
        ...r,
        date: r.date?.slice(0, 10),
        new_cases_daily: Math.max(0, r.new_cases_daily || 0),
        rolling_7day_avg: Math.max(0, r.rolling_7day_avg || 0),
        deaths: Math.max(0, r.deaths || 0),
      }));
      setData(cleaned);
      setLoading(false);
    });
  }, [selectedState]);

  const fmt = (v) => v >= 1e5 ? `${(v/1e5).toFixed(1)}L` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v;

  return (
    <div>
      <h2 className="page-title">📈 COVID-19 Case Trends</h2>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={selectedState} onChange={e => setSelectedState(e.target.value)}
          style={{ background: '#0d1230', border: '1px solid #1e2a5e', color: '#e0e6ff', padding: '8px 12px', borderRadius: 8 }}>
          {STATES.map(s => <option key={s} value={s === 'All India' ? '' : s}>{s}</option>)}
        </select>
        <button onClick={() => setChartType('area')}
          className={`nav-btn ${chartType === 'area' ? 'active' : ''}`}>Area Chart</button>
        <button onClick={() => setChartType('line')}
          className={`nav-btn ${chartType === 'line' ? 'active' : ''}`}>Line Chart</button>
      </div>

      {loading ? <div className="loading">Loading chart data...</div> : (
        <>
          {/* Main chart */}
          <div className="chart-card" style={{ marginBottom: 20 }}>
            <div className="chart-title">
              📊 Daily New Cases — Wave Patterns (2020–2023)
              <span style={{ fontSize: '0.75rem', color: '#5a6a8a', marginLeft: 12 }}>
                Wave 1: Sep 2020 | Wave 2: May 2021 | Wave 3: Jan 2022
              </span>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              {chartType === 'area' ? (
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="casesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffa502" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ffa502" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5e" />
                  <XAxis dataKey="date" tick={{ fill: '#5a6a8a', fontSize: 11 }} tickFormatter={d => d?.slice(2, 10)} />
                  <YAxis tick={{ fill: '#5a6a8a', fontSize: 11 }} tickFormatter={fmt} />
                  <Tooltip contentStyle={{ background: '#0d1230', border: '1px solid #1e2a5e', borderRadius: 8 }}
                    formatter={(v, name) => [v?.toLocaleString(), name]} />
                  <Legend wrapperStyle={{ color: '#a0b4d6' }} />
                  <Area type="monotone" dataKey="new_cases_daily" name="Daily Cases" stroke="#00d4ff" fill="url(#casesGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="rolling_7day_avg" name="7-Day Avg" stroke="#ffa502" fill="url(#avgGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              ) : (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5e" />
                  <XAxis dataKey="date" tick={{ fill: '#5a6a8a', fontSize: 11 }} tickFormatter={d => d?.slice(2, 10)} />
                  <YAxis tick={{ fill: '#5a6a8a', fontSize: 11 }} tickFormatter={fmt} />
                  <Tooltip contentStyle={{ background: '#0d1230', border: '1px solid #1e2a5e', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ color: '#a0b4d6' }} />
                  <Line type="monotone" dataKey="new_cases_daily" name="Daily Cases" stroke="#00d4ff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="rolling_7day_avg" name="7-Day Avg" stroke="#ffa502" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Deaths chart */}
          <div className="chart-card">
            <div className="chart-title">💀 Daily Deaths Over Time</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="deathsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4757" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5e" />
                <XAxis dataKey="date" tick={{ fill: '#5a6a8a', fontSize: 10 }} tickFormatter={d => d?.slice(2, 10)} />
                <YAxis tick={{ fill: '#5a6a8a', fontSize: 10 }} tickFormatter={fmt} />
                <Tooltip contentStyle={{ background: '#0d1230', border: '1px solid #1e2a5e', borderRadius: 8 }} />
                <Area type="monotone" dataKey="deaths" name="Deaths" stroke="#ff4757" fill="url(#deathsGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
