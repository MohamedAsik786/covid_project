# -*- coding: utf-8 -*-
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from config import config
from data_processor import DataProcessor
from ml_model import COVIDPredictor
from alert_system import AlertSystem

app = Flask(__name__)
CORS(app)

# Initialize services
print("Initializing COVID Analytics Platform...")
dp = DataProcessor()
predictor = COVIDPredictor(dp)
alerts = AlertSystem(dp)
print("Platform ready!")

# ─────────────────────────────────────────────
# Frontend — serve dashboard at root
# ─────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')

# ─────────────────────────────────────────────
# 1. Health check
# ─────────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'platform': 'COVID Predictive Analytics', 'version': '1.0.0'})

# ─────────────────────────────────────────────
# 2. Dashboard Summary
# ─────────────────────────────────────────────
@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    try:
        stats = dp.get_summary_stats()
        # convert numpy types
        stats = {k: (v.item() if hasattr(v, 'item') else v) for k, v in stats.items()}
        alert_summary = alerts.get_alert_summary()
        risk_scores = predictor.get_risk_scores()
        return jsonify({
            'status': 'success',
            'stats': stats,
            'alert_summary': alert_summary,
            'top_risk_states': risk_scores[:5]
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ─────────────────────────────────────────────
# 3. Cases Data
# ─────────────────────────────────────────────
@app.route('/api/cases', methods=['GET'])
def cases():
    try:
        country = request.args.get('country')
        state = request.args.get('state')
        limit = int(request.args.get('limit', 200))
        data = dp.get_cases_timeseries(country=country, state=state, limit=limit)
        for row in data:
            for k, v in list(row.items()):
                if hasattr(v, 'item'):
                    row[k] = v.item()
                elif hasattr(v, 'strftime'):
                    row[k] = v.strftime('%Y-%m-%d')
                else:
                    row[k] = str(v)[:10] if k == 'date' else v
        return jsonify({'status': 'success', 'count': len(data), 'data': data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ─────────────────────────────────────────────
# 4. ML Predictions
# ─────────────────────────────────────────────
@app.route('/api/predict', methods=['GET'])
def predict():
    try:
        state = request.args.get('state')
        result = predictor.predict_next_30_days(state=state)
        return jsonify({'status': 'success', 'data': result})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ─────────────────────────────────────────────
# 5. Hotspots
# ─────────────────────────────────────────────
@app.route('/api/hotspots', methods=['GET'])
def hotspots():
    try:
        top_n = int(request.args.get('top', 15))
        data = dp.get_hotspots(top_n=top_n)
        clean = []
        for row in data:
            clean.append({k: (v.item() if hasattr(v, 'item') else v) for k, v in row.items()})
        return jsonify({'status': 'success', 'count': len(clean), 'data': clean})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ─────────────────────────────────────────────
# 6. Early Warning Alerts
# ─────────────────────────────────────────────
@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    try:
        all_alerts = alerts.generate_alerts()
        level_filter = request.args.get('level')
        if level_filter:
            all_alerts = [a for a in all_alerts if a['level'] == level_filter.upper()]
        return jsonify({'status': 'success', 'count': len(all_alerts), 'data': all_alerts})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ─────────────────────────────────────────────
# 7. Hospital Capacity
# ─────────────────────────────────────────────
@app.route('/api/hospital-capacity', methods=['GET'])
def hospital_capacity():
    try:
        state = request.args.get('state')
        data = dp.get_hospital_stats(state=state)
        clean = []
        for row in data:
            clean.append({k: (v.item() if hasattr(v, 'item') else v) for k, v in row.items()})
        return jsonify({'status': 'success', 'count': len(clean), 'data': clean})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ─────────────────────────────────────────────
# 8. Vaccination Stats
# ─────────────────────────────────────────────
@app.route('/api/vaccination', methods=['GET'])
def vaccination():
    try:
        state = request.args.get('state')
        data = dp.get_vaccination_stats(state=state)
        def convert(obj):
            if hasattr(obj, 'item'):   return obj.item()
            if isinstance(obj, dict):  return {k: convert(v) for k, v in obj.items()}
            if isinstance(obj, list):  return [convert(i) for i in obj]
            return obj
        return jsonify({'status': 'success', 'data': convert(data)})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ─────────────────────────────────────────────
# 9. Custom Analysis
# ─────────────────────────────────────────────
@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        body = request.get_json() or {}
        analysis_type = body.get('type', 'demographics')
        if analysis_type == 'demographics':
            raw = dp.get_patient_demographics()
        elif analysis_type == 'anomalies':
            raw = predictor.detect_anomalies()
        elif analysis_type == 'risk_scores':
            raw = predictor.get_risk_scores()
        else:
            return jsonify({'status': 'error', 'message': 'Unknown type'}), 400

        def convert(obj):
            if hasattr(obj, 'item'):   return obj.item()
            if isinstance(obj, dict):  return {k: convert(v) for k, v in obj.items()}
            if isinstance(obj, list):  return [convert(i) for i in obj]
            return obj

        return jsonify({'status': 'success', 'type': analysis_type, 'data': convert(raw)})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host=config.HOST, port=config.PORT, debug=False)
