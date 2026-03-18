# Hackathon BI Analytics

A conversational Business Intelligence application with AI-powered data analysis and modern, responsive UI.

## ✨ Features

### Core Features
- 📊 **Upload and analyze CSV files** with drag-and-drop support
- 🤖 **AI-powered natural language queries** using Google Gemini
- 📈 **Automated dashboard and chart generation** with multiple chart types
- 💬 **Interactive chat interface** with conversation history
- 🎨 **Modern, responsive UI** with glassmorphism design

### NEW: Enhanced UI Features (Latest Update)
- 📱 **Fully mobile responsive** - Works great on phones, tablets, and desktops
- 🎯 **Collapsible sidebar** - Toggle on mobile with smooth animations
- 📊 **New chart types**:
  - **Table view** - Display data in sortable tables
  - **Stacked bar charts** - Compare multiple data series
  - **Scatter plots** - Visualize correlations and distributions
- ⚡ **Enhanced loading states** - Progress indicators show what's happening
- ♿ **Improved accessibility** - ARIA labels, keyboard navigation, focus states
- 🖨️ **Print-friendly** - Dashboards look great when printed

### Supported Chart Types
- Line charts
- Bar charts
- Stacked bar charts ⭐ NEW
- Area charts
- Pie charts
- Donut charts
- Scatter plots ⭐ NEW
- Histograms
- Tables ⭐ NEW

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

## 🚀 Deployment

### Option 1: Deploy to Render.com (Recommended)

The easiest way to deploy this full-stack application is using Render.com:

**Quick Deploy:**
1. Push your code to GitHub
2. Go to https://render.com and create a new Web Service
3. Connect your repository
4. Add `GEMINI_API_KEY` environment variable
5. Deploy! ✨

**Detailed Guide:** See [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) for complete step-by-step instructions.

✅ **No 405 errors** - Backend and frontend are served together
✅ **Auto-deploys** - Automatically redeploys on git push
✅ **Free tier available** - Perfect for testing and demos
✅ **SSL included** - HTTPS out of the box

### Option 2: Split Deployment (Vercel + Render)

If you want to deploy frontend to Vercel and backend to Render separately:

1. **Deploy Backend to Render** (see RENDER_DEPLOYMENT_GUIDE.md)
   - Note your backend URL (e.g., `https://your-api.onrender.com`)

2. **Deploy Frontend to Vercel**
   - **CRITICAL:** Set environment variable in Vercel:
     - Name: `VITE_API_BASE_URL`
     - Value: `https://your-api.onrender.com` (your Render backend URL)
   - Without this variable, file uploads will fail with **405 errors**

📖 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions and troubleshooting.**

## ⚠️ Troubleshooting: 405 Error on File Upload

**Problem:** Getting "405 Method Not Allowed" when uploading CSV files

**Solution:**
- If deploying to Vercel: Set `VITE_API_BASE_URL` environment variable
- If deploying to Render: Use the `render.yaml` configuration (recommended)
- See [DEPLOYMENT.md](./DEPLOYMENT.md) and [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) for detailed fixes

## Project Structure

```
.
├── backend/              # FastAPI backend
│   ├── main.py          # API endpoints (upload, query)
│   ├── data_service.py  # Data processing with pandas & SQLite
│   ├── llm_service.py   # AI integration with Google Gemini
│   └── requirements.txt # Python dependencies
├── frontend/            # React frontend
│   ├── src/
│   │   ├── App.tsx     # Main application with chat UI
│   │   ├── components/
│   │   │   └── Dashboard.tsx  # Chart rendering
│   │   ├── types.ts    # TypeScript interfaces
│   │   └── index.css   # Responsive design & glassmorphism
│   └── package.json
├── render.yaml                    # Render.com deployment config
├── vercel.json                    # Vercel deployment config (frontend only)
├── DEPLOYMENT.md                  # Detailed deployment guide
├── RENDER_DEPLOYMENT_GUIDE.md     # Step-by-step Render guide ⭐ NEW
└── README.md                      # This file
```

## Technologies

**Backend:**
- FastAPI - Modern Python web framework
- Pandas - Data manipulation and analysis
- Google Gemini AI - Natural language understanding
- SQLite - In-memory data querying
- Python Multipart - File upload handling

**Frontend:**
- React 19 + TypeScript - UI framework with type safety
- Vite - Lightning-fast build tool
- Recharts - Beautiful chart visualizations
- Axios - HTTP client for API calls
- CSS Variables - Modern responsive design
- Lucide React - Clean, consistent icons

**Design:**
- Glassmorphism UI with backdrop blur effects
- Responsive breakpoints (1024px, 768px, 480px)
- Dark theme with gradient accents
- Smooth animations and transitions
- Mobile-first approach

## Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **First load:** ~200-300KB (gzipped)
- **Backend response:** <2s for typical queries
- **Chart rendering:** <100ms
- **Mobile optimized:** Touch-friendly, responsive

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Acknowledgments

- Google Gemini for AI-powered insights
- Recharts for beautiful data visualizations
- FastAPI for the excellent Python framework
- Render.com for hassle-free deployment

---

**Happy analyzing! 📊✨**
