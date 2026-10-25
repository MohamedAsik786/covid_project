import React, { useEffect, useState } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { getPredictions } from '../services/api';

const STATES = ['All India', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Kerala'];

export default function PredictionChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState('');
  const [modelInfo, setModelInfo] = useState({});

  useEffect(() => {
    setLoading(true);
    getPredictions(state || undefined).then(res => {
      const result = res.data || res;
      setData(result.predictions || []);
      setModelInfo({ model: result.model, confidence: result.confidence });
      setLoading(false);
    });
  }, [state]);

  const fmt = v => v >= 1e5 ? `${(v / 1e5).toFixed(1)}L` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : v;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <h2 className="page-title">🔮 30-Day Outbreak Prediction</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={state} onChange={e => setState(e.target.value)}
          style={{ background: '#0d1230', border: '1px solid #1e2a5e', color: '#e0e6ff', padding: '8px 12px', borderRadius: 8 }}>
          {STATES.map(s => <option key={s} value={s === 'All India' ? '' : s}>{s}</option>)}
        </select>
        {modelInfo.model && (
          <div style={{ fontSize: '0.8rem', color: '#7a8cad', background: '#0d1230', padding: '6px 12px', borderRadius: 8, border: '1px solid #1e2a5e' }}>
            🤖 Model: {modelInfo.model} &nbsp;|&nbsp; Confidence: {modelInfo.confidence}
          </div>
        )}
      </div>

      {loading ? <div className="loading">🔮 Running predictions...</div> : (
        <>
          <div className="chart-card" style={{ marginBottom: 20 }}>
            <div className="chart-title">📉 Predicted Daily Cases — Next 30 Days</div>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={data}>
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7bed9f" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7bed9f" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5e" />
                <XAxis dataKey="date" tick={{ fill: '#5a6a8a', fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fill: '#5a6a8a', fontSize: 11 }} tickFormatter={fmt} />
                <Tooltip
                  contentStyle={{ background: '#0d1230', border: '1px solid #1e2a5e', borderRadius: 8 }}
                  formatter={(v, name) => [v?.toLocaleString(), name]}
                />
                <Legend wrapperStyle={{ color: '#a0b4d6' }} />
                <ReferenceLine x={today} stroke="#ffa502" strokeDasharray="4 4" label={{ value: 'Today', fill: '#ffa502', fontSize: 11 }} />
                <Area type="monotone" dataKey="upper_bound" name="Upper Bound" stroke="none" fill="url(#ciGrad)" />
                <Area type="monotone" dataKey="lower_bound" name="Lower Bound" stroke="none" fill="#0a0e27" />
                <Line type="monotone" dataKey="predicted_cases" name="Predicted Cases" stroke="#7bed9f" strokeWidth={3} dot={{ r: 3, fill: '#7bed9f' }} />
                <Line type="monotone" dataKey="upper_bound" name="95% CI Upper" stroke="#00d4ff" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="lower_bound" name="95% CI Lower" stroke="#00d4ff" strokeWidth={1} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Summary table */}
          <div className="chart-card">
            <div className="chart-title">📋 Weekly Prediction Summary</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Week</th><th>Date Range</th><th>Predicted Cases</th><th>Lower</th><th>Upper</th><th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3].map(week => {
                  const start = data[week * 7];
                  const end = data[Math.min(week * 7 + 6, data.length - 1)];
                  if (!start || !end) return null;
                  const avg = Math.round((start.predicted_cases + end.predicted_cases) / 2);
                  const trend = end.predicted_cases > start.predicted_cases;
                  return (
                    <tr key={week}>
                      <td>Week {week + 1}</td>
                      <td>{start.date?.slice(5)} – {end.date?.slice(5)}</td>
                      <td style={{ color: '#7bed9f', fontWeight: 600 }}>{avg.toLocaleString()}</td>
                      <td style={{ color: '#5a6a8a' }}>{start.lower_bound?.toLocaleString()}</td>
                      <td style={{ color: '#5a6a8a' }}>{end.upper_bound?.toLocaleString()}</td>
                      <td>{trend ? '📈 Rising' : '📉 Falling'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
