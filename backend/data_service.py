import os
import re
import pandas as pd
import sqlite3
import json


def _sanitize_table_name(name: str) -> str:
    """Convert an arbitrary string into a valid SQLite table name."""
    sanitized = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    # Ensure it doesn't start with a digit
    if sanitized and sanitized[0].isdigit():
        sanitized = 't_' + sanitized
    return sanitized or 'uploaded_data'


class DataService:
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.df = pd.read_csv(csv_path)
        base = os.path.basename(csv_path)
        self.table_name = _sanitize_table_name(os.path.splitext(base)[0])
        self._load_to_sqlite()

    @classmethod
    def from_dataframe(cls, df: pd.DataFrame, filename: str = 'uploaded_data') -> 'DataService':
        """Create a DataService from an already-loaded DataFrame (e.g. user upload)."""
        instance = cls.__new__(cls)
        instance.csv_path = None
        instance.df = df
        instance.table_name = _sanitize_table_name(os.path.splitext(filename)[0])
        instance._load_to_sqlite()
        return instance

    def _load_to_sqlite(self):
        self.conn = sqlite3.connect(':memory:', check_same_thread=False)
        self.df.to_sql(self.table_name, self.conn, index=False, if_exists='replace')

    def get_schema_summary(self) -> str:
        schema = []
        for col in self.df.columns:
            dtype = str(self.df[col].dtype)
            schema.append(f"- {col} ({dtype})")
        return f"Table: {self.table_name}\nColumns:\n" + "\n".join(schema)

    def get_sample_rows(self) -> str:
        sample = self.df.head(4).to_dict(orient='records')
        return json.dumps(sample, indent=2)

    def execute_query(self, sql: str, params: dict = None) -> list:
        if not sql:
            return []
        if params is None:
            params = {}

        # Basic safety check on SQL string (must be SELECT)
        if not sql.strip().upper().startswith("SELECT") and not sql.strip().upper().startswith("WITH"):
            raise ValueError("Only SELECT queries are allowed.")

        try:
            result_df = pd.read_sql_query(sql, self.conn, params=params)
            return result_df.to_dict(orient='records')
        except Exception as e:
            print(f"Query Error for SQL: {sql}\nException: {e}")
            raise e
