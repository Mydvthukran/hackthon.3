import os
import pandas as pd
import numpy as np
import random

np.random.seed(42)
n_rows = 1000

data = {
    'age': np.random.randint(18, 80, n_rows),
    'monthly_income': np.random.randint(20000, 300000, n_rows),
    'daily_internet_hours': np.round(np.random.uniform(1.0, 12.0, n_rows), 1),
    'smartphone_usage_years': np.random.randint(1, 15, n_rows),
    'social_media_hours': np.round(np.random.uniform(0.0, 8.0, n_rows), 1),
    'online_payment_trust_score': np.random.randint(1, 11, n_rows),
    'tech_savvy_score': np.random.randint(1, 11, n_rows),
    'monthly_online_orders': np.random.randint(0, 30, n_rows),
    'monthly_store_visits': np.random.randint(0, 20, n_rows),
    'avg_online_spend': np.random.randint(0, 150000, n_rows),
    'avg_store_spend': np.random.randint(0, 150000, n_rows),
    'discount_sensitivity': np.random.randint(1, 6, n_rows),
    'primary_shopping_channel': np.random.choice(['Store', 'Online', 'Hybrid'], n_rows, p=[0.3, 0.5, 0.2])
}

df = pd.DataFrame(data)

# Introduce some correlations to make the BI dashboards realistic and insightful:
# Tech savvy -> higher online orders and online spend
high_tech = df['tech_savvy_score'] >= 7
df.loc[high_tech, 'monthly_online_orders'] += np.random.randint(5, 15, high_tech.sum())
df.loc[high_tech, 'avg_online_spend'] += np.random.randint(20000, 50000, high_tech.sum())
df.loc[high_tech, 'primary_shopping_channel'] = 'Online'

# High trust -> higher online spend
high_trust = df['online_payment_trust_score'] >= 8
df.loc[high_trust, 'avg_online_spend'] += np.random.randint(10000, 40000, high_trust.sum())

# Older age -> higher store visits
older = df['age'] >= 55
df.loc[older, 'monthly_store_visits'] += np.random.randint(2, 8, older.sum())
df.loc[older, 'primary_shopping_channel'] = np.random.choice(['Store', 'Hybrid'], older.sum())

# Younger age -> higher tech savvy, more social media hours
younger = df['age'] <= 30
df.loc[younger, 'tech_savvy_score'] = np.random.randint(7, 11, younger.sum())
df.loc[younger, 'social_media_hours'] += np.round(np.random.uniform(2.0, 5.0, younger.sum()), 1)

# Ensure no negative or crazy values
df['avg_online_spend'] = df['avg_online_spend'].clip(lower=0)
df['avg_store_spend'] = df['avg_store_spend'].clip(lower=0)

os.makedirs('data', exist_ok=True)
df.to_csv('data/customer_behaviour.csv', index=False)
print("Generated mock customer_behaviour.csv at data/customer_behaviour.csv")
