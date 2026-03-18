# Hackathon BI Analytics

A conversational Business Intelligence application with AI-powered data analysis.

## Features

- 📊 Upload and analyze CSV files
- 🤖 AI-powered natural language queries
- 📈 Automated dashboard and chart generation
- 💬 Interactive chat interface
- 🎨 Modern, responsive UI

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Google Gemini API key

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd hackthon.3
   ```

2. **Setup Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Deployment

⚠️ **IMPORTANT: 405 Error Fix**

If you're getting a **405 Method Not Allowed** error when uploading files, it means your frontend is deployed without a properly configured backend. See the deployment guide below.

### Recommended: Deploy to Render.com (Full Stack)

The easiest way to deploy this application is using Render.com, which will host both frontend and backend together:

1. Push your code to GitHub
2. Create a new Web Service on Render.com
3. Connect your repository
4. Render will auto-detect `render.yaml`
5. Add `GEMINI_API_KEY` environment variable
6. Deploy!

✅ **No 405 errors** - Backend and frontend are served together

### Alternative: Split Deployment (Vercel + Render)

If you want to deploy frontend to Vercel and backend to Render separately:

1. **Deploy Backend to Render** (see DEPLOYMENT.md for details)
   - Note your backend URL (e.g., `https://your-api.onrender.com`)

2. **Deploy Frontend to Vercel**
   - **CRITICAL:** Set environment variable in Vercel:
     - Name: `VITE_API_BASE_URL`
     - Value: `https://your-api.onrender.com` (your Render backend URL)
   - Without this variable, file uploads will fail with **405 errors**

📖 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions and troubleshooting.**

## Project Structure

```
.
├── backend/              # FastAPI backend
│   ├── main.py          # API endpoints
│   ├── data_service.py  # Data processing
│   ├── llm_service.py   # AI integration
│   └── requirements.txt
├── frontend/            # React frontend
│   ├── src/
│   │   ├── App.tsx     # Main application
│   │   └── components/ # UI components
│   └── package.json
├── render.yaml         # Render.com deployment config
├── vercel.json        # Vercel deployment config (frontend only)
└── DEPLOYMENT.md      # Detailed deployment guide
```

## Technologies

**Backend:**
- FastAPI
- Pandas
- Google Gemini AI
- SQLite
- Python Multipart

**Frontend:**
- React + TypeScript
- Vite
- Axios
- Tailwind CSS
- Lucide Icons

## Troubleshooting

### 405 Error on File Upload

**Problem:** Getting "405 Method Not Allowed" when uploading CSV files

**Solution:**
- If deploying to Vercel: Set `VITE_API_BASE_URL` environment variable
- If deploying to Render: Use the `render.yaml` configuration (recommended)
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed fixes

### Other Issues

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive troubleshooting guide.

## License

MIT
