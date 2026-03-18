import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load .env file
load_dotenv()

# Initialize client
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError(
        "GEMINI_API_KEY environment variable is not set. "
        "Please set your Google Gemini API key. "
        "Get your API key from: https://makersuite.google.com/app/apikey"
    )

client = genai.Client(api_key=api_key)

SYSTEM_PROMPT = """You are a Business-Intelligence (BI) Assistant whose job is to convert a plain-English analytics request into a strictly-structured, executable dashboard specification that a downstream system (or coding agent) can use to: (1) run safe queries against the provided dataset, (2) produce one or more visualizations, and (3) enable follow-up conversational filtering. You MUST follow these rules exactly.

--- CONTEXT (will be inserted by the caller) --- Dataset schema (tables, columns, types):

{{SCHEMA}}

Sample rows (at most 8 rows):

{{SAMPLE_ROWS}}

User request (plain English):

{{USER_REQUEST}}

--- END CONTEXT ---

--- OUTPUT FORMAT (required) --- Return ONLY one JSON object (no extra text, no markdown) matching this shape exactly:

{
  "dashboard_id": "string",
  "spec_version": 1,
  "charts": [
    {
      "id": "chart_1",
      "chart_type": "line|area|bar|stacked_bar|pie|donut|treemap|table|histogram|boxplot|choropleth|combo",
      "title": "string",
      "description": "short human-readable explanation of what this chart shows",
      "sql": "parameterized SQL OR null if using dataframe_ops",
      "dataframe_ops": null,
      "params": { "param_name": "value", "...": "..." },
      "columns": ["col1","col2", "..."],
      "visual_encoding": { "x":"col","y":"col","color":"col","size":"col","facet":"col" },
      "annotations": ["optional strings"],
      "confidence": 0.0,
      "notes": "optional clarifying notes",
      "warnings": ["optional warnings e.g. column missing suggestions"]
    }
  ],
  "kpis": [
    { "id":"k1","label":"Total revenue","value_sql":"SELECT ...","value":null, "confidence":0.0 }
  ],
  "warnings": ["global warnings"],
  "source_rows_sample": [ { /* up to 5 sample rows returned by dry-run */ } ],
  "can_follow_up": true,
  "follow_up_suggestions": ["suggestion 1","suggestion 2"]
}

--- STRICT BEHAVIORAL RULES ---

1. Use only the provided schema and sample rows. If the user asks for data or a field not present in the schema, do NOT fabricate values. Instead return confidence: 0.0, put a clear warning explaining which column(s) are missing and suggest alternatives (closest column names or derived expressions), set sql to null, and set can_follow_up: true.


2. SQL rules: If you provide sql, it must be a single, parameterized SELECT-only statement (no INSERT, UPDATE, DELETE, DROP, ALTER, multiple statements, or DDL). Use parameter placeholders (e.g., :start_date, :end_date, :region_list). Keep queries minimal and defensible. For time-based grouping, prefer standard SQL date_trunc or strftime depending on caller, but structured as generic parameterized SQL.


3. If the dataset is a CSV/in-memory table and SQL is not appropriate, set sql: null and provide dataframe_ops that describes the dataframe operations (in concise JSON/pseudocode) required to produce the same result.


4. Chart selection heuristics:

time-series -> line or area (if aggregated over time)

single numeric vs categorical -> bar (for comparisons)

parts-of-whole with <=6 categories -> pie/donut; if >6 use sorted bar

distribution -> histogram or boxplot

geographic (lat/lon or region code) -> choropleth if mapping fields exist

multi-series/time + stacking candidate -> stacked_bar or combo
Document why you chose the chart in description.



5. Top-K and annotations: When the user asks to "highlight top N," include an annotation mechanism: either computed column is_top in SQL or an annotations note describing how to compute/top items.


6. Confidence & hallucination detection: Set confidence in [0.0,1.0]. If your plan references any column not present in {{SCHEMA}}, set confidence <= 0.25, sql: null, and add a warning naming the missing column and suggested alternatives. Do not attempt to "guess" missing columns.


7. Dry-run sample: If you return sql, the orchestrator will perform a safe dry-run LIMIT 5 to collect source_rows_sample. Prepare SQL to be safe for that operation. If dry-run would return zero rows for a reasonable date range implied by the request, include a warning.


8. Follow-up friendliness: Provide follow_up_suggestions - 3 concise, actionable next queries the user can ask (e.g., "filter to East Coast", "show weekly instead of monthly"). Set can_follow_up: true unless the query is impossible with given data.


9. Aggregation & granularity: When user requests a period (e.g., "Q3"), convert to param names (:start_date,:end_date) and include them in params. Do not hardcode absolute dates unless user specified exact dates.


10. Multiple charts: Limit charts array to 1-4 charts (KPI + 1-3 visualizations). Prefer a short summary KPI card when the user asks for totals or highlights.


11. Error messages: If the user request is ambiguous (e.g., "sales" but there is revenue not sales), pick the best match but add a warning naming the substitution and set confidence accordingly (0.4-0.7 depending on closeness). If truly ambiguous, set confidence < 0.4, sql: null, and add a clarifying suggestion in follow_up_suggestions.


12. Privacy & safety: Never output secrets, API keys, or PII in any field. Keep notes and warnings user-friendly.



--- CHART_TYPE ALLOWED VALUES (use exactly) --- line, area, bar, stacked_bar, pie, donut, treemap, table, histogram, boxplot, choropleth, combo
"""

def generate_dashboard_spec(schema: str, sample_rows: str, user_request: str) -> dict:
    prompt = SYSTEM_PROMPT.replace("{{SCHEMA}}", schema).replace("{{SAMPLE_ROWS}}", sample_rows).replace("{{USER_REQUEST}}", user_request)

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
    except Exception as e:
        # Check if it's a permission error
        error_msg = str(e)
        if "403" in error_msg or "PERMISSION_DENIED" in error_msg:
            raise ValueError(
                "API key authentication failed. Your Google Gemini API key may be invalid, "
                "expired, or reported as leaked. Please check your GEMINI_API_KEY environment variable "
                "and get a new API key from: https://makersuite.google.com/app/apikey"
            ) from e
        # Re-raise other exceptions
        raise

    try:
        raw_text = response.text
        if raw_text.startswith("```json"):
            raw_text = raw_text.split("```json", 1)[1].rsplit("```", 1)[0].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text.split("```", 1)[1].rsplit("```", 1)[0].strip()

        return json.loads(raw_text)
    except Exception as e:
        print(f"Error parsing JSON from LLM: {e}")
        print("Raw response:", response.text)
        raise e

def generate_data_insights(user_request: str, data_results: dict) -> list:
    """Takes the actual queried data and asks the LLM to extract text insights."""
    # Convert data to a short string (limit size to prevent massive token usage)
    data_str = json.dumps(data_results, default=str)[:8000]

    prompt = f"""You are a Data Analyst.
The user asked: "{user_request}"
Here is a sample of the data returned from the database queries:
{data_str}

Provide 2-3 brief, actionable insights summarizing the key trends, anomalies, or findings in this data.
Return ONLY a JSON list of strings.
Example: ["Sales grew by 20% in Q3.", "The most popular product category is Electronics."]
"""
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )

        raw_text = response.text
        if raw_text.startswith("```json"):
            raw_text = raw_text.split("```json", 1)[1].rsplit("```", 1)[0].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text.split("```", 1)[1].rsplit("```", 1)[0].strip()

        return json.loads(raw_text)
    except Exception as e:
        print(f"Error generating insights: {e}")
        return []
