# 🚀 Deploying to Render.com - Complete Guide

This guide will walk you through deploying your Instant BI application to Render.com step-by-step.

## Why Render.com?

Render.com is perfect for this full-stack application because:
- ✅ **Supports Python backends** (FastAPI/uvicorn)
- ✅ **Automatic builds** from GitHub
- ✅ **Free tier available** for testing
- ✅ **Single deployment** for both frontend and backend
- ✅ **Environment variable management**
- ✅ **Auto-deploys** on git push
- ✅ **Built-in SSL** certificates
- ✅ **No 405 errors** (unlike Vercel static-only deployments)

---

## Prerequisites

Before you begin, make sure you have:

1. ✅ A **GitHub account** with your code pushed to a repository
2. ✅ A **Render.com account** (sign up at https://render.com - it's free!)
3. ✅ A **Google Gemini API key** (get it from https://makersuite.google.com/app/apikey)

---

## Step-by-Step Deployment

### Step 1: Prepare Your Repository

Your repository should already have these files (they're included):

- `render.yaml` - Render deployment configuration
- `backend/requirements.txt` - Python dependencies
- `backend/main.py` - FastAPI application
- `frontend/package.json` - Frontend dependencies
- `.gitignore` - Excludes .env files (important for security!)

**Verify your `render.yaml` exists:**

```yaml
services:
  - type: web
    name: hackathon-bi
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt && cd ../frontend && npm install && npm run build
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GEMINI_API_KEY
        sync: false
```

This configuration:
- Sets up a Python web service
- Installs backend Python packages
- Builds the frontend React app
- Serves everything from one FastAPI server

---

### Step 2: Push Your Code to GitHub

```bash
# If you haven't already
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

### Step 3: Create a New Web Service on Render

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com/
   - Click "New +" button in the top right
   - Select "Web Service"

2. **Connect Your Repository**
   - Click "Connect account" if you haven't linked GitHub yet
   - Grant Render access to your repositories
   - Find and select your `hackthon.3` repository
   - Click "Connect"

3. **Render Auto-Detects Configuration**
   - Render will automatically detect your `render.yaml` file
   - It will show "Using render.yaml configuration"
   - You should see your service configuration pre-filled

---

### Step 4: Configure Your Service

Render should auto-fill most fields from `render.yaml`, but verify:

| Field | Value |
|-------|-------|
| **Name** | `hackathon-bi` (or choose your own) |
| **Environment** | `Python 3` |
| **Region** | Choose closest to you (e.g., Oregon, Frankfurt) |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt && cd ../frontend && npm install && npm run build` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | `Free` (or choose paid for better performance) |

---

### Step 5: Add Environment Variables

This is **CRITICAL** - without this, your app won't work!

1. Scroll down to the "Environment Variables" section
2. Click "Add Environment Variable"
3. Add the following:

| Key | Value | Example |
|-----|-------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key | `AIzaSyD...your-key-here` |

**Where to get your Gemini API Key:**
- Go to https://makersuite.google.com/app/apikey
- Create a new API key
- Copy it and paste it into Render

**Important Security Notes:**
- ⚠️ Never commit API keys to GitHub
- ✅ Always use environment variables
- ✅ The `.gitignore` already excludes `.env` files

---

### Step 6: Deploy!

1. Click the big blue "**Create Web Service**" button at the bottom
2. Render will start building your application

**What happens during deployment:**

```
📦 Step 1: Installing Python packages...
   - fastapi, uvicorn, pandas, google-genai, etc.

🎨 Step 2: Building frontend...
   - cd ../frontend
   - npm install (installs React, Vite, etc.)
   - npm run build (creates optimized production build)

🚀 Step 3: Starting server...
   - uvicorn main:app --host 0.0.0.0 --port $PORT
   - Backend serves both API and frontend files

✅ Deploy complete!
```

This process usually takes **3-5 minutes** on first deploy.

---

### Step 7: Monitor the Deployment

You'll see a live build log. Watch for:

✅ **Success messages:**
```
==> Installing dependencies...
==> Building frontend...
==> Build successful! ✓
==> Starting service...
==> Your service is live! 🎉
```

❌ **Common errors and fixes:**

| Error | Solution |
|-------|----------|
| `GEMINI_API_KEY not found` | Add environment variable in Render dashboard |
| `npm: command not found` | Check build command includes `npm install` |
| `ModuleNotFoundError: No module named 'fastapi'` | Verify `requirements.txt` exists in `backend/` |
| `Port 10000 already in use` | Render handles this automatically, ignore |

---

### Step 8: Access Your Application

Once deployment succeeds:

1. Render will show your app URL: `https://your-app-name.onrender.com`
2. Click the URL or copy it
3. Your application will load!

**First load might be slow (10-15 seconds)** on the free tier because:
- Free tier services spin down after inactivity
- First request "wakes up" the service
- Subsequent requests are fast

---

## Post-Deployment: Verify Everything Works

### ✅ Checklist:

1. **Homepage loads**
   - You should see the Instant BI interface
   - Chat sidebar on the left
   - Main dashboard area

2. **Upload CSV works**
   - Drag and drop a CSV file
   - No 405 errors!
   - File uploads successfully

3. **Queries work**
   - Type a question like "Show me a trend over time"
   - Dashboard generates with charts
   - No errors in the browser console

4. **Mobile responsive**
   - Open on phone or narrow browser window
   - Sidebar should slide in/out
   - Charts adapt to screen size

---

## Automatic Deployments

**Great news!** Render automatically redeploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Render automatically:
# 1. Detects the push
# 2. Rebuilds the app
# 3. Deploys the new version
# 4. Zero downtime!
```

You can watch auto-deploys in the Render dashboard under "Events".

---

## Updating Environment Variables

If you need to change environment variables later:

1. Go to Render Dashboard
2. Select your service
3. Go to "Environment" tab
4. Edit variables
5. Click "Save Changes"
6. Service will automatically restart

---

## Scaling & Performance

### Free Tier Limitations:
- 512 MB RAM
- Shared CPU
- Spins down after 15 min inactivity
- 750 hours/month (enough for always-on if alone)

### Upgrading:

If you need better performance:
1. Go to your service settings
2. Click "Change Plan"
3. Choose a paid plan:
   - **Starter ($7/mo)**: Always-on, better CPU
   - **Standard ($25/mo)**: Dedicated resources
   - **Pro ($85/mo)**: High performance

**When to upgrade:**
- App is slow or times out
- Multiple concurrent users
- Production use
- Need guaranteed uptime

---

## Monitoring & Logs

### View Logs:

1. Go to Render Dashboard
2. Select your service
3. Click "Logs" tab
4. See real-time logs of requests, errors, etc.

**Common log entries:**
```
INFO: Uvicorn running on http://0.0.0.0:10000
INFO: Started server process [1]
INFO: Application startup complete
INFO: 127.0.0.1:12345 - "POST /api/upload HTTP/1.1" 200 OK
INFO: 127.0.0.1:12345 - "POST /api/query HTTP/1.1" 200 OK
```

### Enable Notifications:

1. Go to service settings
2. Enable "Deploy Notifications"
3. Get emails on successful/failed deploys

---

## Troubleshooting

### Problem: "Application Error" or 500 errors

**Solution:**
1. Check logs for error details
2. Common causes:
   - Missing `GEMINI_API_KEY`
   - Gemini API quota exceeded
   - Invalid API key

**Fix:**
```bash
# Test your API key locally first
cd backend
python -c "
import google.genai as genai
genai.configure(api_key='YOUR_KEY_HERE')
print('API key works!')
"
```

### Problem: Frontend not loading (blank page)

**Solution:**
1. Check build logs - did `npm run build` succeed?
2. Verify `frontend/dist` was created during build
3. Check browser console for errors

**Fix:**
```bash
# Test frontend build locally
cd frontend
npm install
npm run build
# Should create dist/ folder
```

### Problem: CSV upload fails with 413 "Payload Too Large"

**Solution:**
Render has a 10MB request size limit. For larger files:
1. Split your CSV into smaller chunks
2. Or upgrade to a paid plan with higher limits
3. Or add file size validation in frontend

### Problem: Slow performance

**Solutions:**
1. **Optimize queries** - check backend SQL execution time
2. **Add caching** - cache frequently requested data
3. **Upgrade plan** - paid plans have better resources
4. **Use CDN** - for static assets (images, CSS)

---

## Custom Domain (Optional)

Want to use your own domain like `bi.yourcompany.com`?

1. Go to your service settings
2. Click "Custom Domains"
3. Click "Add Custom Domain"
4. Enter your domain
5. Add the CNAME record to your DNS:
   ```
   bi.yourcompany.com CNAME your-app.onrender.com
   ```
6. Render automatically provisions SSL certificate

---

## Costs & Billing

### Free Tier:
- ✅ 750 hours/month
- ✅ SSL included
- ✅ Automatic deployments
- ⚠️ Spins down after 15 min
- ⚠️ Shared resources

### Paid Plans:
- **Starter $7/mo**: Always-on, better for demos
- **Standard $25/mo**: Production-ready
- Check current pricing at https://render.com/pricing

**Pro tip:** Start with free tier, upgrade only when needed!

---

## Security Best Practices

1. ✅ **Never commit secrets** - use environment variables
2. ✅ **Rotate API keys** - change keys periodically
3. ✅ **Monitor logs** - watch for suspicious activity
4. ✅ **Use HTTPS** - Render provides free SSL
5. ✅ **Limit CORS** - in production, restrict allowed origins
6. ✅ **Add rate limiting** - prevent API abuse

**Update CORS for production:**

In `backend/main.py`, change:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Too permissive for production
    ...
)
```

To:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.onrender.com",
        "https://yourdomain.com"
    ],  # ✅ Specific origins only
    ...
)
```

---

## Alternative: Deploy Frontend and Backend Separately

If you want to deploy them separately:

### Backend on Render:
1. Create a Web Service
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add `GEMINI_API_KEY` environment variable

### Frontend on Vercel:
1. Deploy to Vercel
2. **CRITICAL:** Add environment variable:
   - `VITE_API_BASE_URL` = `https://your-backend.onrender.com`
3. See `DEPLOYMENT.md` for details

**Note:** Monolith deployment (Option 1, described above) is simpler!

---

## Summary

🎉 **Congratulations!** You've deployed your Instant BI application to Render.com!

**What you achieved:**
- ✅ Full-stack deployment (Python backend + React frontend)
- ✅ Automatic HTTPS/SSL
- ✅ Auto-deployments on git push
- ✅ Environment variable management
- ✅ Free hosting (with upgrade options)
- ✅ No 405 errors!

**Next steps:**
1. Share your app URL with users
2. Monitor logs and performance
3. Add features and iterate
4. Upgrade plan if needed for production

**Need help?**
- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- GitHub Issues: Open an issue in your repository

---

**Happy deploying! 🚀**
