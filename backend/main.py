import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from llm_service import generate_dashboard_spec
from data_service import DataService

app = FastAPI(title="Conversational BI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DataService
csv_path = os.path.join(os.path.dirname(__file__), "data", "customer_behaviour.csv")
data_service = DataService(csv_path)

class QueryRequest(BaseModel):
    query: str

@app.post("/api/query")
async def analyze_query(req: QueryRequest):
    try:
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
        
        return {"status": "success", "data": spec}
    except Exception as e:
        print(f"Backend error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Serve static frontend build
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    # Serve static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="static-assets")
    
    # Serve favicon and other root static files
    @app.get("/favicon.svg")
    async def favicon():
        return FileResponse(os.path.join(FRONTEND_DIST, "favicon.svg"))
    
    # Catch-all route: serve index.html for any non-API route (SPA support)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
