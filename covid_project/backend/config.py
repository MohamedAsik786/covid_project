import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

class Config:
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    DATA_DIR = DATA_DIR
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000')

    # Dataset paths
    CASES_CSV      = os.path.join(DATA_DIR, 'covid_cases.csv')
    PATIENTS_CSV   = os.path.join(DATA_DIR, 'patient_records.csv')
    HOSPITAL_CSV   = os.path.join(DATA_DIR, 'hospital_capacity.csv')
    ENVIRONMENT_CSV= os.path.join(DATA_DIR, 'environmental_data.csv')
    VACCINATION_CSV= os.path.join(DATA_DIR, 'vaccination_records.csv')

    # Alert thresholds
    ALERT_HIGH_CASES     = 50000
    ALERT_CRITICAL_CASES = 200000
    ALERT_HIGH_CFR       = 2.5
    ALERT_HIGH_OCCUPANCY = 0.80

config = Config()
