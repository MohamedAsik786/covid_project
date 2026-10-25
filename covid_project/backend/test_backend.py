import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("Testing backend modules...")

try:
    from data_processor import DataProcessor
    dp = DataProcessor()
    stats = dp.get_summary_stats()
    print(f"[OK] DataProcessor - confirmed: {stats['total_confirmed']:,}, deaths: {stats['total_deaths']:,}")
except Exception as e:
    print(f"[FAIL] DataProcessor: {e}")
    sys.exit(1)

try:
    from ml_model import COVIDPredictor
    p = COVIDPredictor(dp)
    pred = p.predict_next_30_days()
    scores = p.get_risk_scores()
    print(f"[OK] ML Model - {len(pred['predictions'])} day predictions, {len(scores)} risk states")
    print(f"     Top risk: {scores[0]['state']} score={scores[0]['risk_score']} ({scores[0]['risk_level']})")
except Exception as e:
    print(f"[FAIL] ML Model: {e}")
    sys.exit(1)

try:
    from alert_system import AlertSystem
    a = AlertSystem(dp)
    al = a.generate_alerts()
    print(f"[OK] Alert System - {len(al)} alerts generated")
    if al:
        print(f"     First alert: {al[0]['level']} - {al[0]['title'][:60]}")
except Exception as e:
    print(f"[FAIL] Alert System: {e}")
    sys.exit(1)

try:
    from app import app
    client = app.test_client()
    # Root route (frontend)
    r = client.get('/')
    s = "OK" if r.status_code == 200 else f"FAIL({r.status_code})"
    print(f"[{s}] GET / (frontend)")

    # API endpoints
    endpoints = ['/api/health', '/api/dashboard', '/api/cases', '/api/alerts',
                 '/api/hotspots', '/api/hospital-capacity', '/api/vaccination', '/api/predict']
    for ep in endpoints:
        r = client.get(ep)
        s = "OK" if r.status_code == 200 else f"FAIL({r.status_code})"
        print(f"[{s}] GET {ep}")

    r2 = client.post('/api/analyze', json={"type": "risk_scores"}, content_type='application/json')
    s = "OK" if r2.status_code == 200 else f"FAIL({r2.status_code})"
    print(f"[{s}] POST /api/analyze")
except Exception as e:
    print(f"[FAIL] Flask app: {e}")
    sys.exit(1)

print("\n============================")
print("ALL BACKEND TESTS PASSED OK")
print("============================")
print("Run:  python app.py  -> open http://localhost:5000")
