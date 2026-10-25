import React, { useEffect, useState } from 'react';
import { getAlerts } from '../services/api';

export default function AlertPanel() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlerts().then(res => {
      setAlerts(res.data || []);
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.level === filter);
  const counts = alerts.reduce((acc, a) => { acc[a.level] = (acc[a.level] || 0) + 1; return acc; }, {});

  return (
    <div>
      <h2 className="page-title">🚨 Early Warning Alerts</h2>

      {/* Summary badges */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['ALL', '#00d4ff', alerts.length], ['CRITICAL', '#8e44ad', counts.CRITICAL || 0],
          ['HIGH', '#e74c3c', counts.HIGH || 0], ['MEDIUM', '#f39c12', counts.MEDIUM || 0],
          ['LOW', '#27ae60', counts.LOW || 0]].map(([lvl, color, count]) => (
          <button key={lvl} onClick={() => setFilter(lvl)}
            style={{
              background: filter === lvl ? color + '33' : '#0d1230',
              border: `1px solid ${filter === lvl ? color : '#1e2a5e'}`,
              color: filter === lvl ? color : '#a0b4d6',
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem'
            }}>
            {lvl} ({count})
          </button>
        ))}
      </div>

      {loading ? <div className="loading">Loading alerts...</div> : (
        <div className="alert-list">
          {filtered.length === 0 && <div className="loading">No alerts for this filter.</div>}
          {filtered.map((alert, i) => (
            <div key={i} className={`alert-item ${alert.level}`}>
              <div className="alert-title">
                <span className={`badge ${alert.level}`}>{alert.level}</span>
                {alert.title}
              </div>
              <div className="alert-msg">{alert.message}</div>
              <div className="alert-meta">
                📍 {alert.region} &nbsp;|&nbsp; 📊 {alert.metric}: {
                  typeof alert.value === 'number' ? alert.value.toLocaleString() : alert.value
                } &nbsp;|&nbsp; 🕐 {alert.timestamp}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
