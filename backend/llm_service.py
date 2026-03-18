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


# Comma-separated model list allows automatic fallback on quota/rate errors.
MODEL_CANDIDATES = [
    m.strip()
    for m in os.environ.get("GEMINI_MODELS", "gemini-2.5-flash,gemini-2.0-flash-lite").split(",")
    if m.strip()
]

ENABLE_LLM_INSIGHTS = os.environ.get("ENABLE_LLM_INSIGHTS", "false").strip().lower() in {"1", "true", "yes", "on"}
geographic (lat/lon or region code) -> choropleth if mapping fields exist

multi-series/time + stacking candidate -> stacked_bar or combo
Document why you chose the chart in description.


def _generate_content_with_fallback(prompt: str, temperature: float):
    """Try multiple Gemini models to survive free-tier quota/rate limits."""
    last_error = None

    for model_name in MODEL_CANDIDATES:
        try:
            return client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=temperature,
                ),
            )
        except Exception as e:
            last_error = e
            error_msg = str(e)
            # Keep trying model fallback for quota/rate related failures.
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                continue
            # For auth issues, fail immediately with a clear message.
            if "403" in error_msg or "PERMISSION_DENIED" in error_msg:
                raise ValueError(
                    "API key authentication failed. Your Google Gemini API key may be invalid, "
                    "expired, or reported as leaked. Please check your GEMINI_API_KEY environment variable "
                    "and get a new API key from: https://makersuite.google.com/app/apikey"
                ) from e
            raise

    # If all fallbacks were exhausted, surface a concise and actionable quota message.
    raise RuntimeError(
        "Gemini API quota exceeded on all configured models. "
        "Please wait and retry, switch to a paid plan, or set GEMINI_MODELS to include available models."
    ) from last_error




    response = _generate_content_with_fallback(prompt, temperature=0.2)

12. Privacy & safety: Never output secrets, API keys, or PII in any field. Keep notes and warnings user-friendly.

    if not ENABLE_LLM_INSIGHTS:
        return []


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
        response = _generate_content_with_fallback(prompt, temperature=0.3)
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
