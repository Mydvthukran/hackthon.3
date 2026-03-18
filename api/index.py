import sys
import os

# Add the backend directory to sys.path so relative imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app  # noqa: E402 – FastAPI ASGI app
from mangum import Mangum  # noqa: E402

# Mangum wraps the ASGI app for the Lambda-compatible runtime used by Vercel
handler = Mangum(app, lifespan="off")
