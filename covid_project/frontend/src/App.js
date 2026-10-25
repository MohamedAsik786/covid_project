import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import CasesChart from './components/CasesChart';
import PredictionChart from './components/PredictionChart';
import AlertPanel from './components/AlertPanel';
import HospitalCapacity from './components/HospitalCapacity';
import VaccinationTracker from './components/VaccinationTracker';
import RiskScoreCard from './components/RiskScoreCard';
import './styles/App.css';

const TABS = [
  { id: 'dashboard',    label: '🏠 Dashboard' },
  { id: 'cases',        label: '📈 Cases' },
  { id: 'prediction',   label: '🔮 Prediction' },
  { id: 'alerts',       label: '🚨 Alerts' },
  { id: 'hospital',     label: '🏥 Hospital' },
  { id: 'vaccination',  label: '💉 Vaccination' },
  { id: 'risk',         label: '⚠️ Risk Scores' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':   return <Dashboard />;
      case 'cases':       return <CasesChart />;
      case 'prediction':  return <PredictionChart />;
      case 'alerts':      return <AlertPanel />;
      case 'hospital':    return <HospitalCapacity />;
      case 'vaccination': return <VaccinationTracker />;
      case 'risk':        return <RiskScoreCard />;
      default:            return <Dashboard />;
    }
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand">
          <span>🦠</span>
          <h1>COVID-19 Predictive Analytics</h1>
        </div>
        <div className="navbar-links">
          {TABS.map(tab => (
            <button key={tab.id} className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
      <div className="app-container">
        {renderTab()}
      </div>
    </div>
  );
}
