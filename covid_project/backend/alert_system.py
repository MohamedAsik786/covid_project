# -*- coding: utf-8 -*-
from datetime import datetime
import pandas as pd
from config import config


class AlertSystem:
    def __init__(self, data_processor):
        self.dp = data_processor
        self.alert_history = []

    def _make_alert(self, level, title, message, region, metric_value, metric_name):
        return {
            'id': f"ALT{len(self.alert_history)+1:04d}",
            'level': level,
            'title': title,
            'message': message,
            'region': region,
            'metric': metric_name,
            'value': round(metric_value, 2),
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'color': {'LOW': '#27ae60', 'MEDIUM': '#f39c12', 'HIGH': '#e74c3c', 'CRITICAL': '#8e44ad'}[level]
        }

    def generate_alerts(self):
        alerts = []

        # -- Case surge alerts --
        df = self.dp.df_cases.copy()
        recent = df[df['date'] >= df['date'].max() - pd.Timedelta(days=7)]
        for state, grp in recent.groupby('state'):
            avg = grp['new_cases_daily'].mean()
            if avg >= config.ALERT_CRITICAL_CASES:
                alerts.append(self._make_alert(
                    'CRITICAL', f'[CRITICAL] Case Surge in {state}',
                    f'Average daily new cases: {avg:.0f} - Immediate intervention required!',
                    state, avg, 'daily_cases'))
            elif avg >= config.ALERT_HIGH_CASES:
                alerts.append(self._make_alert(
                    'HIGH', f'[HIGH] High Case Load in {state}',
                    f'Average daily new cases: {avg:.0f} - Enhanced monitoring needed.',
                    state, avg, 'daily_cases'))

        # -- CFR alerts --
        for state, grp in recent.groupby('state'):
            cfr = grp['case_fatality_rate'].mean()
            if cfr >= config.ALERT_HIGH_CFR:
                alerts.append(self._make_alert(
                    'HIGH', f'[HIGH] High Fatality Rate in {state}',
                    f'Case Fatality Rate: {cfr:.2f}% - Healthcare capacity review needed.',
                    state, cfr, 'case_fatality_rate'))

        # -- Hospital occupancy alerts --
        df_h = self.dp.df_hospital.copy()
        df_h['occ'] = df_h['occupied_beds'] / df_h['total_beds']
        critical_hosp = df_h[df_h['occ'] >= config.ALERT_HIGH_OCCUPANCY]
        for _, row in critical_hosp.iterrows():
            lvl = 'CRITICAL' if row['occ'] >= 0.95 else 'HIGH'
            alerts.append(self._make_alert(
                lvl,
                f'[{lvl}] Hospital Near Capacity: {row["hospital_name"]}',
                f'{row["hospital_name"]} at {row["occ"]*100:.0f}% bed occupancy in {row["state"]}.',
                row['state'], float(row['occ'] * 100), 'bed_occupancy'))

        # -- Growth rate alerts --
        for state, grp in recent.groupby('state'):
            growth = grp['growth_rate'].mean()
            if growth > 0.5:
                alerts.append(self._make_alert(
                    'MEDIUM', f'[MEDIUM] Rapid Growth in {state}',
                    f'7-day avg growth rate: {growth*100:.1f}% - Potential outbreak forming.',
                    state, float(growth * 100), 'growth_rate'))

        # -- Low vaccination alerts --
        df_v = self.dp.df_vax.copy()
        state_vax = df_v.groupby('state')['total_vaccinated'].sum()
        low_vax = state_vax[state_vax < state_vax.median() * 0.5]
        for state in low_vax.index:
            alerts.append(self._make_alert(
                'MEDIUM', f'[MEDIUM] Low Vaccination Coverage: {state}',
                f'Vaccination rate below 50% of national median in {state}.',
                state, float(low_vax[state]), 'vaccination_count'))

        self.alert_history.extend(alerts)
        order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
        alerts.sort(key=lambda x: order.get(x['level'], 4))
        return alerts[:30]

    def get_alert_summary(self):
        alerts = self.generate_alerts()
        summary = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
        for a in alerts:
            summary[a['level']] = summary.get(a['level'], 0) + 1
        return {'total': len(alerts), 'by_level': summary, 'latest': alerts[:5]}
