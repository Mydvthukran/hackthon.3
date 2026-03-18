# Deployment Guide

This application consists of a FastAPI backend and a React frontend. There are multiple deployment options:

## Option 1: Monolith Deployment (Recommended) - Render.com

Deploy both frontend and backend together using Render.com.

### Steps:
1. Push your code to GitHub
2. Connect your repository to Render.com
3. Render will automatically detect the `render.yaml` configuration
4. Set the `GEMINI_API_KEY` environment variable in Render dashboard
5. Deploy!

The `render.yaml` file is already configured to:
- Install Python dependencies
- Build the frontend
- Serve both frontend and backend from a single service
- The backend serves the built frontend static files

**Environment Variables (Render):**
- `GEMINI_API_KEY`: Your Google Gemini API key (required)

**URL:** Your app will be available at `https://your-app-name.onrender.com`

---

## Option 2: Split Deployment - Vercel (Frontend) + Render (Backend)

Deploy frontend to Vercel and backend to Render separately.

### Backend (Render):
1. Create a new Web Service on Render
2. Connect your repository
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variable: `GEMINI_API_KEY`
5. Deploy and note your backend URL (e.g., `https://your-api.onrender.com`)

### Frontend (Vercel):
1. Push your code to GitHub
2. Import your repository to Vercel
3. Configure:
   - **Root Directory:** Leave as repository root
   - **Build Command:** Already configured in `vercel.json`
   - **Output Directory:** `frontend/dist`
4. **Critical:** Add environment variable in Vercel dashboard:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** Your backend URL from Render (e.g., `https://your-api.onrender.com`)
   - **Important:** Do NOT include trailing slash
5. Deploy!

**Why this fails without VITE_API_BASE_URL:**
- Without this environment variable, the frontend tries to make API calls to Vercel
- Vercel only hosts static files and cannot handle `/api/upload` POST requests
- This causes **405 Method Not Allowed errors** during file uploads

---

## Option 3: Local Development

### Backend:
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your GEMINI_API_KEY
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (in a separate terminal):
```bash
cd frontend
npm install
npm run dev
```

The Vite dev server (port 5173) will proxy `/api/*` requests to the backend (port 8000) automatically.

---

## Troubleshooting

### 403 PERMISSION_DENIED Error (Google Gemini API)

**Symptom:** Getting error like:
```
403 PERMISSION_DENIED. {'error': {'code': 403, 'message': 'Your API key was reported as leaked. Please use another API key.', 'status': 'PERMISSION_DENIED'}}
```

**Common Causes:**

1. **GEMINI_API_KEY environment variable not set**
   - **Fix:** Set the `GEMINI_API_KEY` environment variable in your deployment platform
   - **Render:** Go to your service → Environment → Add `GEMINI_API_KEY`
   - **Local:** Create `backend/.env` file with `GEMINI_API_KEY=your_api_key_here`

2. **API key was leaked and disabled by Google**
   - **Fix:** Get a new API key from https://makersuite.google.com/app/apikey
   - **Important:** Never commit API keys to Git. They are excluded by `.gitignore`
   - Delete the old leaked key from Google Cloud Console

3. **Using an invalid or expired API key**
   - **Fix:** Verify your API key is still valid in Google Cloud Console
   - Generate a new key if needed

4. **API key has insufficient permissions**
   - **Fix:** Ensure the API key has permission to use Gemini API
   - Check quota limits in Google Cloud Console

**How to get a new API key:**
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AI...`)
4. Set it in your environment:
   - **Render:** Dashboard → Environment → `GEMINI_API_KEY`
   - **Local:** Add to `backend/.env` file
   - **Never** commit the `.env` file to Git

### 405 Error on File Upload

**Symptom:** Getting "405 Method Not Allowed" when trying to upload CSV files

**Common Causes:**

1. **Deploying to Vercel without configuring VITE_API_BASE_URL**
   - **Fix:** Add `VITE_API_BASE_URL` environment variable in Vercel pointing to your backend
   - **Or:** Use Option 1 (monolith deployment on Render)

2. **CORS issues**
   - **Fix:** Ensure your backend CORS configuration allows your frontend domain
   - Already configured in `backend/main.py` to allow all origins

3. **Missing python-multipart**
   - **Fix:** Ensure `python-multipart>=0.0.9` is in `backend/requirements.txt`
   - Already included

### Other Common Issues

**Backend not found (404)**
- Check that VITE_API_BASE_URL is set correctly (if using split deployment)
- Ensure backend is deployed and running
- Check backend logs for errors

**CSV parsing errors**
- Ensure you're uploading a valid CSV file
- Check that the file has headers
- Backend returns specific error messages for debugging

**Environment variables not working**
- Vercel: Redeploy after adding environment variables
- Render: Restart the service after adding environment variables
- Local: Restart dev servers after changing .env files

---

## Architecture Notes

### How the application handles file uploads:

1. **Frontend** (`frontend/src/App.tsx`):
   - Creates FormData with the uploaded file
   - POSTs to `${VITE_API_BASE_URL}/api/upload`
   - If `VITE_API_BASE_URL` is empty, it uses relative URL `/api/upload`

2. **Backend** (`backend/main.py`):
   - Receives multipart form data (requires `python-multipart`)
   - Validates CSV format
   - Parses with pandas
   - Creates a session ID
   - Stores data in memory (for serverless, would need external storage)
   - Returns session info

3. **Deployment-specific behavior**:
   - **Monolith (Render):** Backend serves frontend, same origin, no CORS issues
   - **Split (Vercel + Render):** Must set `VITE_API_BASE_URL` for cross-origin requests
   - **Local:** Vite proxy handles cross-origin during development

### Why Vercel alone doesn't work:

Vercel is a static hosting platform optimized for frontend applications. While it supports serverless functions, those are Node.js/Python functions that run independently, not full FastAPI applications. The current architecture uses:
- FastAPI with in-memory session management
- pandas for CSV processing
- sqlite3 for data queries
- Stateful data storage

This is better suited for a traditional server deployment (Render) rather than serverless functions (Vercel).
