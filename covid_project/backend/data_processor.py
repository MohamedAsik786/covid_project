import pandas as pd
import numpy as np
from config import config

class DataProcessor:
    def __init__(self):
        self.df_cases = None
        self.df_patients = None
        self.df_hospital = None
        self.df_env = None
        self.df_vax = None
        self.load_all()

    def load_all(self):
        """Load and clean all datasets"""
        try:
            self.df_cases = pd.read_csv(config.CASES_CSV, parse_dates=['date'])
            self.df_patients = pd.read_csv(config.PATIENTS_CSV, parse_dates=['hospitalization_date', 'discharge_date'])
            self.df_hospital = pd.read_csv(config.HOSPITAL_CSV, parse_dates=['date'])
            self.df_env = pd.read_csv(config.ENVIRONMENT_CSV, parse_dates=['date'])
            self.df_vax = pd.read_csv(config.VACCINATION_CSV, parse_dates=['date'])
            self._feature_engineering()
            print("[OK] All datasets loaded successfully.")
        except Exception as e:
            print(f"[ERROR] loading data: {e}")

    def _feature_engineering(self):
        """Add computed features to cases dataset"""
        df = self.df_cases.sort_values('date')
        df['rolling_7day_avg']  = df['new_cases_daily'].rolling(7, min_periods=1).mean()
        df['rolling_14day_avg'] = df['new_cases_daily'].rolling(14, min_periods=1).mean()
        df['growth_rate'] = df['new_cases_daily'].pct_change().fillna(0).clip(-1, 10)
        df['doubling_time'] = df['rolling_7day_avg'].apply(
            lambda x: round(np.log(2) / np.log(1 + max(x, 0.001) / 100000), 1)
        )
        self.df_cases = df

    def get_summary_stats(self):
        df = self.df_cases
        india = df[df['country'] == 'India']
        latest = india.groupby('date').sum(numeric_only=True).iloc[-1]
        return {
            'total_confirmed': int(df['confirmed_cases'].sum()),
            'total_deaths': int(df['deaths'].sum()),
            'total_recovered': int(df['recovered'].sum()),
            'total_active': int(df['active_cases'].sum()),
            'india_confirmed': int(india['confirmed_cases'].sum()),
            'india_deaths': int(india['deaths'].sum()),
            'avg_cfr': round(df['case_fatality_rate'].mean(), 2),
            'avg_recovery_rate': round(df['recovery_rate'].mean(), 2),
            'total_patients': len(self.df_patients),
            'icu_admissions': int(self.df_patients['icu_admitted'].sum()),
            'total_vaccinated': int(self.df_vax['total_vaccinated'].sum()),
        }

    def get_cases_timeseries(self, country=None, state=None, limit=200):
        df = self.df_cases.copy()
        if country:
            df = df[df['country'] == country]
        if state:
            df = df[df['state'] == state]
        df = df.sort_values('date').tail(limit)
        return df[['date', 'state', 'city', 'confirmed_cases', 'new_cases_daily',
                   'deaths', 'recovered', 'active_cases', 'case_fatality_rate',
                   'rolling_7day_avg', 'rolling_14day_avg', 'growth_rate']].to_dict(orient='records')

    def get_hotspots(self, top_n=15):
        df = self.df_cases.copy()
        df = df[df['country'] == 'India']
        recent = df[df['date'] >= df['date'].max() - pd.Timedelta(days=30)]
        grouped = recent.groupby(['state', 'city', 'latitude', 'longitude']).agg(
            total_cases=('confirmed_cases', 'sum'),
            avg_daily=('new_cases_daily', 'mean'),
            avg_cfr=('case_fatality_rate', 'mean')
        ).reset_index()
        grouped['risk_score'] = (
            (grouped['avg_daily'] / grouped['avg_daily'].max() * 50) +
            (grouped['avg_cfr'] / grouped['avg_cfr'].max() * 30) +
            (grouped['total_cases'] / grouped['total_cases'].max() * 20)
        ).round(1)
        grouped['risk_level'] = grouped['risk_score'].apply(
            lambda x: 'CRITICAL' if x >= 70 else 'HIGH' if x >= 50 else 'MEDIUM' if x >= 30 else 'LOW'
        )
        return grouped.nlargest(top_n, 'risk_score').to_dict(orient='records')

    def get_hospital_stats(self, state=None):
        df = self.df_hospital.copy()
        if state:
            df = df[df['state'] == state]
        df['occupancy_rate'] = (df['occupied_beds'] / df['total_beds']).round(3)
        df['icu_occupancy_rate'] = (df['occupied_icu'] / df['icu_beds']).round(3)
        latest = df.sort_values('date').groupby('hospital_name').last().reset_index()
        return latest[['hospital_name', 'state', 'city', 'total_beds', 'occupied_beds',
                        'icu_beds', 'occupied_icu', 'ventilators', 'occupied_ventilators',
                        'occupancy_rate', 'icu_occupancy_rate', 'staff_available', 'ppe_stock_days']].to_dict(orient='records')

    def get_vaccination_stats(self, state=None):
        df = self.df_vax.copy()
        if state:
            df = df[df['state'] == state]
        summary = {
            'total_vaccinated': int(df['total_vaccinated'].sum()),
            'first_dose': int(df['first_dose'].sum()),
            'second_dose': int(df['second_dose'].sum()),
            'booster_dose': int(df['booster_dose'].sum()),
            'adverse_reactions': int(df['adverse_reactions_reported'].sum()),
        }
        by_brand = df.groupby('vaccine_brand')['total_vaccinated'].sum().to_dict()
        by_age = df.groupby('age_group')['total_vaccinated'].sum().to_dict()
        by_state = df.groupby('state')['total_vaccinated'].sum().sort_values(ascending=False).head(10).to_dict()
        timeline = df.groupby('date')['total_vaccinated'].sum().reset_index()
        timeline['date'] = timeline['date'].dt.strftime('%Y-%m-%d')
        return {**summary, 'by_brand': by_brand, 'by_age': by_age,
                'by_state': by_state, 'timeline': timeline.to_dict(orient='records')}

    def get_patient_demographics(self):
        df = self.df_patients.copy()
        age_groups = pd.cut(df['age'], bins=[0, 17, 29, 44, 59, 74, 120],
                            labels=['0-17', '18-29', '30-44', '45-59', '60-74', '75+']).value_counts().to_dict()
        return {
            'total': len(df),
            'by_outcome': df['outcome'].value_counts().to_dict(),
            'by_gender': df['gender'].value_counts().to_dict(),
            'by_variant': df['variant_type'].value_counts().to_dict(),
            'by_vaccination': df['vaccination_status'].value_counts().to_dict(),
            'icu_rate': round(df['icu_admitted'].mean() * 100, 2),
            'ventilator_rate': round(df['ventilator_used'].mean() * 100, 2),
            'avg_age': round(df['age'].mean(), 1),
            'age_groups': {str(k): int(v) for k, v in age_groups.items()},
        }
