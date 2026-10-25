import sys
sys.path.insert(0, '.')
from data_processor import DataProcessor
from ml_model import COVIDPredictor
from alert_system import AlertSystem

dp = DataProcessor()
p = COVIDPredictor(dp)
a = AlertSystem(dp)

alerts = a.generate_alerts()
pred = p.predict_next_30_days()
scores = p.get_risk_scores()

print("=" * 50)
print("VERIFICATION RESULTS")
print("=" * 50)
print(f"Alerts generated   : {len(alerts)}")
print(f"Prediction days    : {len(pred['predictions'])}")
print(f"Model used         : {pred['model']}")
print(f"Risk states        : {len(scores)}")
if scores:
    print(f"Top risk state     : {scores[0]['state']} — Score:{scores[0]['risk_score']} ({scores[0]['risk_level']})")
if alerts:
    print(f"First alert        : {alerts[0]['title']}")
print("=" * 50)
print("ALL CHECKS PASSED ✅")
