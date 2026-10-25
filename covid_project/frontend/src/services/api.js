import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

// Mock data for when backend is offline
const MOCK = {
  dashboard: {
    stats: {
      total_confirmed: 44690000, total_deaths: 530779, total_recovered: 44200000,
      total_active: 3500000, india_confirmed: 44690000, india_deaths: 530779,
      avg_cfr: 1.8, avg_recovery_rate: 92.4, total_patients: 800,
      icu_admissions: 187, total_vaccinated: 2200000000
    },
    alert_summary: { total: 12, by_level: { CRITICAL: 2, HIGH: 4, MEDIUM: 5, LOW: 1 } },
    top_risk_states: [
      { state: 'Maharashtra', risk_score: 82, risk_level: 'CRITICAL', avg_new_cases: 41200, avg_cfr: 2.1 },
      { state: 'Delhi', risk_score: 74, risk_level: 'HIGH', avg_new_cases: 28000, avg_cfr: 1.9 },
      { state: 'Karnataka', risk_score: 61, risk_level: 'HIGH', avg_new_cases: 19500, avg_cfr: 1.5 },
      { state: 'Tamil Nadu', risk_score: 48, risk_level: 'MEDIUM', avg_new_cases: 14200, avg_cfr: 1.3 },
      { state: 'Kerala', risk_score: 35, risk_level: 'MEDIUM', avg_new_cases: 9800, avg_cfr: 1.1 },
    ]
  },
  cases: Array.from({ length: 100 }, (_, i) => {
    const d = new Date('2020-03-01'); d.setDate(d.getDate() + i * 12);
    const wave = Math.sin(i / 15) * 50000 + 30000 + Math.random() * 10000;
    return {
      date: d.toISOString().split('T')[0],
      new_cases_daily: Math.max(0, Math.round(wave)),
      confirmed_cases: Math.round(wave * 100),
      deaths: Math.round(wave * 0.018),
      recovered: Math.round(wave * 0.92),
      rolling_7day_avg: Math.max(0, Math.round(wave * 0.95)),
      state: 'All India'
    };
  }),
  predictions: Array.from({ length: 30 }, (_, i) => ({
    date: (() => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d.toISOString().split('T')[0]; })(),
    predicted_cases: Math.round(8000 + Math.random() * 4000 + i * 50),
    lower_bound: Math.round(6500 + Math.random() * 2000),
    upper_bound: Math.round(10000 + Math.random() * 3000),
    day: i + 1
  })),
  alerts: [
    { id: 'ALT001', level: 'CRITICAL', title: '🚨 Critical Surge in Maharashtra', message: 'Average daily cases: 214,000 — Immediate intervention required!', region: 'Maharashtra', timestamp: '2021-05-05 08:00:00', color: '#8e44ad' },
    { id: 'ALT002', level: 'HIGH', title: '⚠️ High Case Load in Delhi', message: 'Average daily cases: 28,000 — Enhanced monitoring needed.', region: 'Delhi', timestamp: '2021-05-05 08:00:00', color: '#e74c3c' },
    { id: 'ALT003', level: 'HIGH', title: '🏥 Hospital Near Capacity: AIIMS Delhi', message: 'AIIMS Delhi at 94% bed occupancy.', region: 'Delhi', timestamp: '2021-05-05 08:00:00', color: '#e74c3c' },
    { id: 'ALT004', level: 'MEDIUM', title: '📈 Rapid Growth in Karnataka', message: '7-day avg growth rate: 52% — Potential outbreak forming.', region: 'Karnataka', timestamp: '2021-05-05 08:00:00', color: '#f39c12' },
    { id: 'ALT005', level: 'MEDIUM', title: '💉 Low Vaccination Coverage: UP', message: 'Vaccination rate below 50% of national median in Uttar Pradesh.', region: 'Uttar Pradesh', timestamp: '2021-05-05 08:00:00', color: '#f39c12' },
  ],
  hospitals: [
    { hospital_name: 'AIIMS Delhi', state: 'Delhi', city: 'New Delhi', total_beds: 2000, occupied_beds: 1880, icu_beds: 300, occupied_icu: 291, occupancy_rate: 0.94, icu_occupancy_rate: 0.97 },
    { hospital_name: 'KEM Hospital', state: 'Maharashtra', city: 'Mumbai', total_beds: 1800, occupied_beds: 1620, icu_beds: 250, occupied_icu: 235, occupancy_rate: 0.90, icu_occupancy_rate: 0.94 },
    { hospital_name: 'CMC Vellore', state: 'Tamil Nadu', city: 'Vellore', total_beds: 2200, occupied_beds: 1540, icu_beds: 320, occupied_icu: 192, occupancy_rate: 0.70, icu_occupancy_rate: 0.60 },
    { hospital_name: 'Nimhans', state: 'Karnataka', city: 'Bengaluru', total_beds: 1200, occupied_beds: 1080, icu_beds: 180, occupied_icu: 162, occupancy_rate: 0.90, icu_occupancy_rate: 0.90 },
    { hospital_name: 'SGPGI', state: 'Uttar Pradesh', city: 'Lucknow', total_beds: 1400, occupied_beds: 980, icu_beds: 190, occupied_icu: 114, occupancy_rate: 0.70, icu_occupancy_rate: 0.60 },
  ],
  vaccination: {
    total_vaccinated: 2200000000, first_dose: 2000000000, second_dose: 1750000000, booster_dose: 450000000,
    by_brand: { Covishield: 900000000, Covaxin: 750000000, Pfizer: 350000000, Moderna: 150000000, 'Sputnik V': 50000000 },
    by_age: { '18-29': 600000000, '30-44': 700000000, '45-59': 500000000, '60-74': 300000000, '75+': 100000000 },
    timeline: Array.from({ length: 30 }, (_, i) => {
      const d = new Date('2021-01-16'); d.setDate(d.getDate() + i * 30);
      return { date: d.toISOString().split('T')[0], total_vaccinated: Math.round(i * 80000000) };
    })
  }
};

const withFallback = async (fn, mockData) => {
  try { const res = await fn(); return res.data; }
  catch { return { status: 'mock', data: mockData }; }
};

export const getDashboard   = ()         => withFallback(() => api.get('/dashboard'), MOCK.dashboard);
export const getCases       = (params)   => withFallback(() => api.get('/cases', { params }), { data: MOCK.cases });
export const getPredictions = (state)    => withFallback(() => api.get('/predict', { params: { state } }), { data: { predictions: MOCK.predictions } });
export const getAlerts      = ()         => withFallback(() => api.get('/alerts'), { data: MOCK.alerts });
export const getHospitals   = (state)    => withFallback(() => api.get('/hospital-capacity', { params: { state } }), { data: MOCK.hospitals });
export const getVaccination = (state)    => withFallback(() => api.get('/vaccination', { params: { state } }), { data: MOCK.vaccination });
export const getHotspots    = ()         => withFallback(() => api.get('/hotspots'), { data: [] });
export const postAnalyze    = (type)     => withFallback(() => api.post('/analyze', { type }), { data: {} });
