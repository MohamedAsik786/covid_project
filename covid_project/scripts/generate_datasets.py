import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os

random.seed(42)
np.random.seed(42)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(OUTPUT_DIR, exist_ok=True)

INDIAN_STATES = [
    'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Kerala',
    'Uttar Pradesh', 'West Bengal', 'Gujarat', 'Rajasthan', 'Madhya Pradesh'
]

CITIES = {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
    'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Saket'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur']
}

COORDS = {
    'Mumbai': (19.0760, 72.8777), 'Pune': (18.5204, 73.8567),
    'New Delhi': (28.6139, 77.2090), 'Bengaluru': (12.9716, 77.5946),
    'Chennai': (13.0827, 80.2707), 'Kolkata': (22.5726, 88.3639),
    'Ahmedabad': (23.0225, 72.5714), 'Jaipur': (26.9124, 75.7873),
    'Lucknow': (26.8467, 80.9462), 'Bhopal': (23.2599, 77.4126),
    'Thiruvananthapuram': (8.5241, 76.9366), 'Kochi': (9.9312, 76.2673),
    'Nagpur': (21.1458, 79.0882), 'Mysuru': (12.2958, 76.6394),
    'Coimbatore': (11.0168, 76.9558), 'Hyderabad': (17.3850, 78.4867)
}

INTERNATIONAL = ['USA', 'UK', 'Brazil', 'Germany', 'France']
INT_CITIES = {
    'USA': [('New York', 40.7128, -74.0060), ('Los Angeles', 34.0522, -118.2437)],
    'UK': [('London', 51.5074, -0.1278), ('Manchester', 53.4808, -2.2426)],
    'Brazil': [('São Paulo', -23.5505, -46.6333), ('Rio de Janeiro', -22.9068, -43.1729)],
    'Germany': [('Berlin', 52.5200, 13.4050), ('Munich', 48.1351, 11.5820)],
    'France': [('Paris', 48.8566, 2.3522), ('Lyon', 45.7640, 4.8357)]
}

def wave_multiplier(date):
    """Simulate COVID waves with realistic patterns"""
    d = (date - datetime(2020, 1, 1)).days
    # Wave 1: peak around Sep 2020 (day ~250)
    w1 = 0.4 * np.exp(-((d - 250)**2) / (2 * 60**2))
    # Wave 2: peak around May 2021 (day ~490)
    w2 = 1.0 * np.exp(-((d - 490)**2) / (2 * 50**2))
    # Wave 3: peak around Jan 2022 (day ~730)
    w3 = 0.7 * np.exp(-((d - 730)**2) / (2 * 40**2))
    # Wave 4: small bump mid 2022
    w4 = 0.2 * np.exp(-((d - 900)**2) / (2 * 45**2))
    return max(0.01, w1 + w2 + w3 + w4)

# ============================================================
# 1. COVID CASES (1000 rows)
# ============================================================
print("Generating covid_cases.csv...")
cases_rows = []
dates = pd.date_range('2020-03-01', '2023-12-31', periods=1000)

for i, date in enumerate(dates):
    state = random.choice(INDIAN_STATES) if i % 6 != 0 else random.choice(INTERNATIONAL)
    is_india = state in INDIAN_STATES

    if is_india:
        city_list = CITIES[state]
        city = random.choice(city_list)
        country = 'India'
        lat, lon = COORDS.get(city, (20.0 + random.uniform(-5, 5), 78.0 + random.uniform(-5, 5)))
        base = random.randint(50000, 500000)
    else:
        country = state
        city_data = random.choice(INT_CITIES[state])
        city, lat, lon = city_data
        base = random.randint(100000, 2000000)
        state = city

    wm = wave_multiplier(date.to_pydatetime())
    noise = random.uniform(0.85, 1.15)
    confirmed = int(base * wm * noise)
    cfr = random.uniform(0.01, 0.035)
    rr = random.uniform(0.85, 0.97)
    deaths = int(confirmed * cfr)
    recovered = int(confirmed * rr)
    active = max(0, confirmed - deaths - recovered)
    new_cases = max(0, int(confirmed * random.uniform(0.002, 0.008)))
    new_deaths = max(0, int(new_cases * cfr))
    testing_rate = random.uniform(200, 1500)

    cases_rows.append({
        'date': date.strftime('%Y-%m-%d'),
        'country': country,
        'state': state,
        'city': city,
        'latitude': round(lat, 4),
        'longitude': round(lon, 4),
        'confirmed_cases': confirmed,
        'deaths': deaths,
        'recovered': recovered,
        'active_cases': active,
        'new_cases_daily': new_cases,
        'new_deaths_daily': new_deaths,
        'case_fatality_rate': round(cfr * 100, 2),
        'recovery_rate': round(rr * 100, 2),
        'testing_rate_per_100k': round(testing_rate, 1)
    })

df_cases = pd.DataFrame(cases_rows)
df_cases.to_csv(os.path.join(OUTPUT_DIR, 'covid_cases.csv'), index=False)
print(f"  -> {len(df_cases)} rows saved.")

# ============================================================
# 2. PATIENT RECORDS (800 rows)
# ============================================================
print("Generating patient_records.csv...")
COMORBIDITIES = ['None', 'Diabetes', 'Hypertension', 'Obesity', 'Heart Disease',
                 'Asthma', 'CKD', 'Diabetes,Hypertension', 'Obesity,Heart Disease']
SYMPTOMS = ['Fever,Cough', 'Fever,Breathlessness', 'Loss of smell,Fever',
            'Asymptomatic', 'Fever,Fatigue,Cough', 'Breathlessness,Chest Pain',
            'Fever,Body Ache', 'Cough,Fatigue']
VARIANTS = ['Original', 'Alpha', 'Beta', 'Delta', 'Omicron', 'Omicron BA.2', 'XBB']
VACCINES = ['Unvaccinated', 'Covishield', 'Covaxin', 'Pfizer', 'Moderna', 'Sputnik V']
OUTCOMES = ['Recovered', 'Deceased', 'Active']

patient_rows = []
hosp_start = datetime(2020, 3, 15)

for i in range(800):
    admit_offset = random.randint(0, 1350)
    admit_date = hosp_start + timedelta(days=admit_offset)
    stay_days = random.randint(3, 30)
    discharge_date = admit_date + timedelta(days=stay_days)
    age = random.randint(5, 90)
    wm = wave_multiplier(admit_date)

    # Higher severity in wave 2
    severity_factor = wm * (1.2 if age > 60 else 1.0)
    icu = random.random() < min(0.35, 0.1 * severity_factor)
    vent = icu and random.random() < 0.4
    
    outcome_r = random.random()
    if icu:
        outcome = 'Deceased' if outcome_r < 0.25 else 'Recovered'
    else:
        outcome = 'Deceased' if outcome_r < 0.04 else 'Recovered'
    if admit_offset > 1300:
        outcome = 'Active'

    # Variant by date
    if admit_date < datetime(2020, 12, 1):
        variant = 'Original'
    elif admit_date < datetime(2021, 4, 1):
        variant = random.choice(['Original', 'Alpha', 'Beta'])
    elif admit_date < datetime(2021, 12, 1):
        variant = random.choice(['Alpha', 'Delta'])
    elif admit_date < datetime(2022, 6, 1):
        variant = random.choice(['Delta', 'Omicron'])
    else:
        variant = random.choice(['Omicron', 'Omicron BA.2', 'XBB'])

    # Vaccination by date
    if admit_date < datetime(2021, 1, 16):
        vax = 'Unvaccinated'
    else:
        vax = random.choice(VACCINES)

    patient_rows.append({
        'patient_id': f'PID{10000 + i}',
        'age': age,
        'gender': random.choice(['Male', 'Female']),
        'comorbidities': random.choice(COMORBIDITIES),
        'symptoms': random.choice(SYMPTOMS),
        'hospitalization_date': admit_date.strftime('%Y-%m-%d'),
        'discharge_date': discharge_date.strftime('%Y-%m-%d'),
        'outcome': outcome,
        'icu_admitted': icu,
        'ventilator_used': vent,
        'vaccination_status': vax,
        'variant_type': variant
    })

df_patients = pd.DataFrame(patient_rows)
df_patients.to_csv(os.path.join(OUTPUT_DIR, 'patient_records.csv'), index=False)
print(f"  -> {len(df_patients)} rows saved.")

# ============================================================
# 3. HOSPITAL CAPACITY (500 rows)
# ============================================================
print("Generating hospital_capacity.csv...")
HOSPITALS = [
    ('AIIMS Delhi', 'Delhi', 'New Delhi', 2000, 300, 150),
    ('KEM Hospital', 'Maharashtra', 'Mumbai', 1800, 250, 120),
    ('Nimhans', 'Karnataka', 'Bengaluru', 1200, 180, 90),
    ('PGIMER', 'Punjab', 'Chandigarh', 1500, 200, 100),
    ('CMC Vellore', 'Tamil Nadu', 'Vellore', 2200, 320, 160),
    ('SGPGI', 'Uttar Pradesh', 'Lucknow', 1400, 190, 95),
    ('IPGMER', 'West Bengal', 'Kolkata', 1600, 220, 110),
    ('BJ Medical', 'Gujarat', 'Ahmedabad', 1100, 160, 80),
    ('SMS Hospital', 'Rajasthan', 'Jaipur', 1300, 175, 88),
    ('Hamidia Hospital', 'Madhya Pradesh', 'Bhopal', 1000, 140, 70),
]

hosp_rows = []
for i in range(500):
    hosp = random.choice(HOSPITALS)
    name, state, city, beds, icu, vents = hosp
    date = hosp_start + timedelta(days=random.randint(0, 1350))
    wm = wave_multiplier(date)
    occupancy = min(0.98, 0.3 + wm * 0.65)
    noise = random.uniform(0.9, 1.1)

    hosp_rows.append({
        'hospital_id': f'H{str(HOSPITALS.index(hosp)+1).zfill(3)}',
        'hospital_name': name,
        'state': state,
        'city': city,
        'total_beds': beds,
        'icu_beds': icu,
        'ventilators': vents,
        'occupied_beds': int(beds * occupancy * noise),
        'occupied_icu': int(icu * min(0.99, occupancy * 1.1) * noise),
        'occupied_ventilators': int(vents * min(0.99, occupancy * 0.9) * noise),
        'date': date.strftime('%Y-%m-%d'),
        'staff_available': int(random.randint(300, 800) * (1 - occupancy * 0.2)),
        'ppe_stock_days': int(random.uniform(2, 45) * (1 - occupancy * 0.5))
    })

df_hosp = pd.DataFrame(hosp_rows)
df_hosp.to_csv(os.path.join(OUTPUT_DIR, 'hospital_capacity.csv'), index=False)
print(f"  -> {len(df_hosp)} rows saved.")

# ============================================================
# 4. ENVIRONMENTAL DATA (600 rows)
# ============================================================
print("Generating environmental_data.csv...")
env_rows = []
for i in range(600):
    state = random.choice(INDIAN_STATES)
    city = random.choice(CITIES[state])
    date = hosp_start + timedelta(days=random.randint(0, 1350))
    wm = wave_multiplier(date)
    month = date.month
    is_summer = month in [4, 5, 6]
    is_winter = month in [12, 1, 2]
    temp = random.uniform(15, 30) + (8 if is_summer else -5 if is_winter else 0)
    lockdown = 0
    if date < datetime(2020, 6, 1): lockdown = 4
    elif date < datetime(2020, 9, 1): lockdown = 2
    elif wm > 0.6: lockdown = random.choice([2, 3])
    elif wm > 0.3: lockdown = random.choice([1, 2])

    env_rows.append({
        'date': date.strftime('%Y-%m-%d'),
        'city': city,
        'state': state,
        'temperature_celsius': round(temp, 1),
        'humidity_percent': round(random.uniform(30, 90), 1),
        'air_quality_index': round(random.uniform(50, 350), 1),
        'pollution_pm25': round(random.uniform(10, 180), 1),
        'population_density': random.randint(500, 25000),
        'mobility_index': round(random.uniform(0.2, 1.0) * (1 - lockdown * 0.15), 2),
        'lockdown_level': lockdown,
        'vaccination_coverage_percent': round(min(85, max(0, (date - datetime(2021, 1, 16)).days / 730 * 80 + random.uniform(-5, 5))), 1)
    })

df_env = pd.DataFrame(env_rows)
df_env.to_csv(os.path.join(OUTPUT_DIR, 'environmental_data.csv'), index=False)
print(f"  -> {len(df_env)} rows saved.")

# ============================================================
# 5. VACCINATION RECORDS (700 rows)
# ============================================================
print("Generating vaccination_records.csv...")
VAX_BRANDS = ['Covishield', 'Covaxin', 'Pfizer', 'Moderna', 'Sputnik V']
AGE_GROUPS = ['18-29', '30-44', '45-59', '60-74', '75+']

vax_rows = []
vax_start = datetime(2021, 1, 16)
for i in range(700):
    state = random.choice(INDIAN_STATES)
    city = random.choice(CITIES[state])
    date = vax_start + timedelta(days=random.randint(0, 1000))
    days_since_start = (date - vax_start).days
    coverage_factor = min(1.0, days_since_start / 600)
    pop = random.randint(100000, 5000000)
    total_vax = int(pop * coverage_factor * random.uniform(0.7, 0.9))
    first_dose = int(total_vax * random.uniform(0.85, 1.0))
    second_dose = int(first_dose * random.uniform(0.70, 0.90))
    booster = int(second_dose * random.uniform(0.20, 0.50)) if days_since_start > 270 else 0

    vax_rows.append({
        'date': date.strftime('%Y-%m-%d'),
        'state': state,
        'city': city,
        'total_vaccinated': total_vax,
        'first_dose': first_dose,
        'second_dose': second_dose,
        'booster_dose': booster,
        'vaccine_brand': random.choice(VAX_BRANDS),
        'age_group': random.choice(AGE_GROUPS),
        'gender': random.choice(['Male', 'Female', 'Other']),
        'adverse_reactions_reported': int(total_vax * random.uniform(0.0005, 0.003))
    })

df_vax = pd.DataFrame(vax_rows)
df_vax.to_csv(os.path.join(OUTPUT_DIR, 'vaccination_records.csv'), index=False)
print(f"  -> {len(df_vax)} rows saved.")

print("\n✅ All datasets generated successfully!")
print(f"   covid_cases.csv        : {len(df_cases)} rows")
print(f"   patient_records.csv    : {len(df_patients)} rows")
print(f"   hospital_capacity.csv  : {len(df_hosp)} rows")
print(f"   environmental_data.csv : {len(df_env)} rows")
print(f"   vaccination_records.csv: {len(df_vax)} rows")
print(f"   Total rows             : {len(df_cases)+len(df_patients)+len(df_hosp)+len(df_env)+len(df_vax)}")
