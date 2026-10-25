import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts';
import { getVaccination } from '../services/api';

const COLORS = ['#00d4ff', '#7bed9f', '#ffa502', '#ff4757', '#a29bfe', '#fd79a8'];
const fmt = n => n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e7 ? `${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `${(n / 1e5).toFixed(1)}L` : n?.toLocaleString();

export default function VaccinationTracker() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVaccination().then(res => {
      setData(res.data || res);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading">💉 Loading vaccination data...</div>;
  if (!data) return <div className="loading">No data available</div>;

  const brandData = Object.entries(data.by_brand || {}).map(([name, value]) => ({ name, value }));
  const ageData = Object.entries(data.by_age || {}).map(([name, value]) => ({ name, value }));
  const stateData = Object.entries(data.by_state || {}).map(([name, value]) => ({ name: name.slice(0, 10), value }));

  return (
    <div>
      <h2 className="page-title">💉 Vaccination Tracker</h2>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        {[
          ['Total Vaccinated', data.total_vaccinated, '#7bed9f'],
          ['1st Dose', data.first_dose, '#00d4ff'],
          ['2nd Dose', data.second_dose, '#ffa502'],
          ['Booster', data.booster_dose, '#a29bfe'],
          ['Adverse Reactions', data.adverse_reactions, '#ff4757'],
        ].map(([label, val, color]) => (
          <div key={label} className="kpi-card">
            <div className="label">{label}</div>
            <div className="value" style={{ color }}>{fmt(val)}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        {/* Vaccine Brand Pie */}
        <div className="chart-card">
          <div className="chart-title">🧪 Vaccines by Brand</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={brandData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {brandData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: '#0d1230', border: '1px solid #1e2a5e', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Age Group Bar */}
        <div className="chart-card">
          <div className="chart-title">👥 Vaccination by Age Group</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5e" />
              <XAxis dataKey="name" tick={{ fill: '#5a6a8a', fontSize: 11 }} />
              <YAxis tick={{ fill: '#5a6a8a', fontSize: 11 }} tickFormatter={fmt} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: '#0d1230', border: '1px solid #1e2a5e', borderRadius: 8 }} />
              <Bar dataKey="value" name="Vaccinated" radius={[6, 6, 0, 0]}>
                {ageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Timeline */}
        <div className="chart-card full-width">
          <div className="chart-title">📅 Vaccination Rollout Timeline</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={(data.timeline || []).slice(0, 30)}>
              <defs>
                <linearGradient id="vaxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7bed9f" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7bed9f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5e" />
              <XAxis dataKey="date" tick={{ fill: '#5a6a8a', fontSize: 10 }} tickFormatter={d => d?.slice(2, 10)} />
              <YAxis tick={{ fill: '#5a6a8a', fontSize: 10 }} tickFormatter={fmt} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: '#0d1230', border: '1px solid #1e2a5e', borderRadius: 8 }} />
              <Area type="monotone" dataKey="total_vaccinated" name="Vaccinated" stroke="#7bed9f" fill="url(#vaxGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top States */}
        <div className="chart-card full-width">
          <div className="chart-title">🗺️ Top States by Vaccination</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5e" />
              <XAxis type="number" tick={{ fill: '#5a6a8a', fontSize: 10 }} tickFormatter={fmt} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a0b4d6', fontSize: 11 }} width={110} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: '#0d1230', border: '1px solid #1e2a5e', borderRadius: 8 }} />
              <Bar dataKey="value" name="Vaccinated" fill="#00d4ff" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
