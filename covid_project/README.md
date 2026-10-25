# 🦠 COVID-19 Predictive Analytics Platform

AI-powered disease outbreak prediction system built per the PRD for Predictive Analytics for Disease Outbreaks.

---

## 📁 Project Structure

```
covid_project/
├── data/                        # 3600+ rows of COVID datasets
│   ├── covid_cases.csv          # 1000 rows — case trends by region
│   ├── patient_records.csv      # 800 rows  — patient outcomes
│   ├── hospital_capacity.csv    # 500 rows  — hospital occupancy
│   ├── environmental_data.csv   # 600 rows  — climate & mobility
│   └── vaccination_records.csv  # 700 rows  — vaccine rollout
├── backend/                     # Python Flask API
│   ├── app.py                   # 8 API endpoints
│   ├── ml_model.py              # RandomForest + IsolationForest
│   ├── data_processor.py        # Data pipeline
│   ├── alert_system.py          # Early warning alerts
│   ├── config.py                # Configuration
│   └── requirements.txt
├── frontend/                    # React dashboard
│   └── src/
│       ├── App.js               # Main app with 7 tabs
│       ├── components/          # 7 React components
│       ├── services/api.js      # API service + mock fallback
│       └── styles/App.css       # Dark theme
├── scripts/
│   └── generate_datasets.py     # Dataset generator
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

### Generate Datasets (already done)

```bash
python scripts/generate_datasets.py
```

---

## 🌐 API Endpoints

| Method | Endpoint                  | Description                    |
|--------|---------------------------|--------------------------------|
| GET    | /api/dashboard            | Summary stats + top risk states|
| GET    | /api/cases                | Timeseries case data           |
| GET    | /api/predict              | 30-day ML prediction           |
| GET    | /api/hotspots             | Geographic hotspot analysis    |
| GET    | /api/alerts               | Early warning alerts           |
| GET    | /api/hospital-capacity    | Hospital occupancy data        |
| GET    | /api/vaccination          | Vaccination statistics         |
| POST   | /api/analyze              | Custom analysis (demographics/anomalies/risk)|

---

## 📊 Dataset Details

### covid_cases.csv (1000 rows)
- Date range: 2020–2023 with realistic wave patterns
- Wave 1: Sep 2020 peak | Wave 2: May 2021 peak | Wave 3: Jan 2022 peak
- Covers 10 Indian states + USA, UK, Brazil, Germany, France

### patient_records.csv (800 rows)
- Patient demographics, outcomes, ICU admissions
- Variant tracking: Original → Alpha → Delta → Omicron

### hospital_capacity.csv (500 rows)
- 10 major Indian hospitals
- Bed/ICU/ventilator occupancy aligned with wave severity

### environmental_data.csv (600 rows)
- Temperature, humidity, AQI, lockdown levels, mobility index
- Vaccination coverage over time

### vaccination_records.csv (700 rows)
- Rollout from Jan 16, 2021
- Brand breakdown: Covishield, Covaxin, Pfizer, Moderna, Sputnik V

---

## 🤖 AI/ML Components

- **RandomForestRegressor** — 30-day case prediction
- **IsolationForest** — Anomaly detection in outbreak data
- **Rule-based Alert Engine** — CRITICAL/HIGH/MEDIUM/LOW alerts
- **Risk Scoring** — 0-100 score per state using 4 metrics

---

## 🛡️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Recharts, Axios           |
| Backend    | Python Flask, Flask-CORS            |
| ML         | scikit-learn (RF + IsolationForest) |
| Data       | Pandas, NumPy                       |
| Database   | CSV (upgrade to PostgreSQL/MongoDB) |
| Cloud      | Docker-ready (AWS/GCP/Azure)        |

---

## 📋 PRD Coverage

- ✅ Data Collection & Integration (multi-source datasets)
- ✅ AI-Powered Disease Prediction (RandomForest)
- ✅ Early Warning System (automated alerts)
- ✅ Geographic Analysis (hotspots, risk scores)
- ✅ Hospital Capacity Monitoring
- ✅ Vaccination Tracking
- ✅ Anomaly Detection (IsolationForest)
- ✅ Intuitive Dashboard (React dark theme)
