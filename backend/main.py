import os
import uuid
import io
from typing import Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from llm_service import generate_dashboard_spec, generate_data_insights
from data_service import DataService

app = FastAPI(title="Conversational BI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Default DataService (hardcoded CSV shipped with the app)
# Use the Database folder which contains the actual customer behaviour data
csv_path = os.path.join(os.path.dirname(__file__), "..", "Database", "Customer_Behaviour_Online_vs_Offline.csv")
default_data_service = DataService(csv_path)

# In-memory session store: session_id -> DataService
sessions: dict[str, DataService] = {}


def _get_data_service(session_id: Optional[str]) -> DataService:
    """Return the session-specific DataService, or the default one."""
    if session_id and session_id in sessions:
        return sessions[session_id]
    return default_data_service


# ---------------------------------------------------------------------------
# CSV Upload endpoint
# ---------------------------------------------------------------------------

@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    """Accept a user-uploaded CSV file and return a session_id for subsequent queries."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()

    # Check for common non-CSV formats that might have .csv extension
    # Safari webarchive files start with 'bplist'
    if content.startswith(b'bplist'):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file appears to be a Safari webarchive, not a CSV file. Please download the actual CSV file instead of saving it from the browser preview."
        )

    # Check for HTML content (some browsers save CSV previews as HTML)
    if content.startswith(b'<!DOCTYPE') or content.startswith(b'<html'):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file appears to be an HTML file, not a CSV file. Please ensure you're uploading a proper CSV file."
        )

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

    session_id = str(uuid.uuid4())
    ds = DataService.from_dataframe(df, filename=file.filename)
    sessions[session_id] = ds

    return {
        "status": "success",
        "session_id": session_id,
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "table_name": ds.table_name,
    }


# ---------------------------------------------------------------------------
# Query endpoint
# ---------------------------------------------------------------------------

class QueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = None


@app.post("/api/query")
async def analyze_query(req: QueryRequest):
    try:
        data_service = _get_data_service(req.session_id)

        # 1. Get Schema and Sample Rows
        schema = data_service.get_schema_summary()
        sample_rows = data_service.get_sample_rows()

        # 2. Get LLM Spec
        spec = generate_dashboard_spec(schema, sample_rows, req.query)

        # 3. Enhance with actual data points
        for chart in spec.get("charts", []):
            if chart.get("sql"):
                try:
                    chart_data = data_service.execute_query(chart["sql"], chart.get("params", {}))
                    chart["chart_data"] = chart_data
                except Exception as e:
                    chart["error"] = str(e)
                    chart["chart_data"] = []

        for kpi in spec.get("kpis", []):
            if kpi.get("value_sql"):
                try:
                    kpi_data = data_service.execute_query(kpi["value_sql"], spec.get("params", {}))
                    if kpi_data and len(kpi_data) > 0:
                        first_row = kpi_data[0]
                        kpi["value"] = list(first_row.values())[0] if first_row else None
                except Exception as e:
                    kpi["error"] = str(e)

        # --- NEW CODE: GENERATE INSIGHTS FROM THE EXECUTED DATA ---
        extracted_data_for_insights = {}

        # Grab a small sample of the chart data
        for chart in spec.get("charts", []):
            if "chart_data" in chart and chart["chart_data"]:
                extracted_data_for_insights[chart.get("title", "Chart")] = chart["chart_data"][:10]

        # Grab the KPI values
        for kpi in spec.get("kpis", []):
            if "value" in kpi:
                extracted_data_for_insights[kpi.get("label", "KPI")] = kpi["value"]

        # Call the second LLM pass if we successfully retrieved data
        if extracted_data_for_insights:
            spec["insights"] = generate_data_insights(req.query, extracted_data_for_insights)
        else:
            spec["insights"] = []

        return {"status": "success", "data": spec}
    except Exception as e:
        print(f"Backend error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Serve static frontend build
# ---------------------------------------------------------------------------
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

_assets_dir = os.path.join(FRONTEND_DIST, "assets")
if os.path.isdir(_assets_dir):
    # Serve static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=_assets_dir), name="static-assets")


# Serve favicon and other root static files
@app.get("/favicon.svg")
async def favicon():
    fav_path = os.path.join(FRONTEND_DIST, "favicon.svg")
    if os.path.isfile(fav_path):
        return FileResponse(fav_path)
    raise HTTPException(status_code=404, detail="favicon not found")


# Catch-all route: serve index.html for any non-API route (SPA support)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Don't intercept API routes
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")

    index_html = os.path.join(FRONTEND_DIST, "index.html")
    if not os.path.isdir(FRONTEND_DIST) or not os.path.isfile(index_html):
        raise HTTPException(
            status_code=503,
            detail="Frontend build not found. Run 'npm install && npm run build' in the frontend directory.",
        )

    # Resolve and validate to prevent path traversal
    dist_real = os.path.realpath(FRONTEND_DIST)
    file_path = os.path.realpath(os.path.join(FRONTEND_DIST, full_path))
    if full_path and file_path.startswith(dist_real + os.sep) and os.path.isfile(file_path):
        return FileResponse(file_path)

    return FileResponse(index_html)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
