import pandas as pd
import sqlite3
import json

class DataService:
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.df = pd.read_csv(csv_path)
        
        # Load it into an in-memory SQLite database for robust SQL execution
        self.conn = sqlite3.connect(':memory:', check_same_thread=False)
        self.df.to_sql('customer_behaviour', self.conn, index=False, if_exists='replace')
        
    def get_schema_summary(self) -> str:
        schema = []
        for col in self.df.columns:
            dtype = str(self.df[col].dtype)
            schema.append(f"- {col} ({dtype})")
        return "Table: customer_behaviour\nColumns:\n" + "\n".join(schema)
        
    def get_sample_rows(self) -> str:
        sample = self.df.head(4).to_dict(orient='records')
        return json.dumps(sample, indent=2)

    def execute_query(self, sql: str, params: dict = None) -> list:
        if not sql:
            return []
        if params is None:
            params = {}
            
        # Optional: basic safety check on SQL string (must be SELECT)
        if not sql.strip().upper().startswith("SELECT") and not sql.strip().upper().startswith("WITH"):
            raise ValueError("Only SELECT queries are allowed.")
            
        try:
            # Query the sqlite database directly, passing params
            # Note: The LLM output should use standard sqlite named params e.g. :start_date
            result_df = pd.read_sql_query(sql, self.conn, params=params)
            return result_df.to_dict(orient='records')
        except Exception as e:
            print(f"Query Error for SQL: {sql}\nException: {e}")
            raise e
