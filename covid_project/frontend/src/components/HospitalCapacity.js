import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getHospitals } from '../services/api';

const OccupancyBar = ({ value, warn = 0.8, critical = 0.95 }) => {
  const pct = Math.round(value * 100);
  const color = value >= critical ? '#8e44ad' : value >= warn ? '#e74c3c' : value >= 0.6 ? '#f39c12' : '#27ae60';
  return (
    <div>
      <div style={{ marginBottom: 4, fontSize: '0.78rem', color }}>{pct}%</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

export default function HospitalCapacity() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHospitals().then(res => {
      setHospitals(res.data || []);
      setLoading(false);
    });
  }, []);

  const chartData = hospitals.map(h => ({
    name: h.hospital_name.split(' ').slice(0, 2).join(' '),
    'Total Beds': h.total_beds,
    'Occupied': h.occupied_beds,
    'ICU Total': h.icu_beds,
    'ICU Occupied': h.occupied_icu,
  }));

  return (
    <div>
      <h2 className="page-title">🏥 Hospital Capacity Monitor</h2>

      {loading ? <div className="loading">Loading hospital data...</div> : (
        <>
          {/* Bar Chart */}
          <div className="chart-card" style={{ marginBottom: 20 }}>
            <div className="chart-title">📊 Beds vs Occupancy by Hospital</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a5e" />
                <XAxis dataKey="name" tick={{ fill: '#5a6a8a', fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fill: '#5a6a8a', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0d1230', border: '1px solid #1e2a5e', borderRadius: 8 }} />
                <Legend wrapperStyle={{ color: '#a0b4d6' }} />
                <Bar dataKey="Total Beds" fill="#1e2a5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Occupied" fill="#e74c3c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ICU Total" fill="#0d3a5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ICU Occupied" fill="#8e44ad" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="chart-card">
            <div className="chart-title">📋 Hospital Capacity Details</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hospital</th><th>State</th><th>Total Beds</th>
                    <th>Bed Occupancy</th><th>ICU Beds</th><th>ICU Occupancy</th>
                    <th>Staff</th><th>PPE (days)</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{h.hospital_name}</td>
                      <td>{h.state}</td>
                      <td>{h.total_beds?.toLocaleString()}</td>
                      <td><OccupancyBar value={h.occupancy_rate} /></td>
                      <td>{h.icu_beds?.toLocaleString()}</td>
                      <td><OccupancyBar value={h.icu_occupancy_rate} /></td>
                      <td>{h.staff_available || '—'}</td>
                      <td style={{ color: (h.ppe_stock_days || 0) < 7 ? '#ff4757' : '#2ed573' }}>
                        {h.ppe_stock_days || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
