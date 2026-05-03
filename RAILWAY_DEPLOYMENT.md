# 🚀 Railway Deployment Guide

## Step-by-Step Instructions

### Step 1: Push Deployment Files to GitHub

The deployment files are already created:
- `railway.json` - Railway configuration
- `nixpacks.toml` - Build configuration
- `Procfile` - Start command

Push them:
```bash
cd "/Users/gokul/Documents/Omilos RAG/OmilosRAG"
git add railway.json nixpacks.toml Procfile
git commit -m "Add Railway deployment configuration"
git push origin main
```

---

### Step 2: Sign Up for Railway

1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway to access your GitHub account

---

### Step 3: Create New Project

1. Click "New Project" in Railway dashboard
2. Select "Deploy from GitHub repo"
3. Find and select `gokul77898/omilos-RAG`
4. Click "Add Project"

---

### Step 4: Add PostgreSQL Database

1. In your Railway project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will create a PostgreSQL database automatically
4. Note the database URL (you'll need it for environment variables)

---

### Step 5: Configure Environment Variables

In your Railway project → Settings → Variables, add these:

**Required Variables:**
```bash
# Database (Railway provides DATABASE_URL automatically)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Gemini API
LLM_PROVIDER=gemini
GOOGLE_AI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash-preview-04-1

# Knowledge Graph
OMILOSRAG_KG_LANGUAGE=English
OMILOSRAG_KG_ENTITY_TYPES=["Organization", "Person", "Product", "Location", "Event", "Financial_Metric", "Technology", "Date", "Regulation"]
OMILOSRAG_KG_CHUNK_TOKEN_SIZE=1200
OMILOSRAG_KG_QUERY_TIMEOUT=30.0

# Embedding (using sentence-transformers for free)
KG_EMBEDDING_PROVIDER=sentence_transformers
KG_EMBEDDING_MODEL=BAAI/bge-m3
KG_EMBEDDING_DIMENSION=1024

# Neo4j (optional - set to NetworkXStorage for free)
OMILOSRAG_KG_GRAPH_STORAGE=NetworkXStorage
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=Smile@123
NEO4J_DATABASE=neo4j

# Storage
CHROMA_PATH=./data/chroma
LIGHTRAG_WORKING_DIR=./data/lightrag
```

**To get Gemini API Key:**
1. Go to https://aistudio.google.com/app/apikey
2. Create new API key
3. Copy and paste into Railway environment variables

---

### Step 6: Deploy

1. Click "Deploy" button in Railway
2. Railway will build and deploy your app
3. Wait for deployment to complete (2-5 minutes)
4. You'll see a URL like: `https://omilosrag-production.up.railway.app`

---

### Step 7: Access Your App

1. Click the deployed URL
2. Backend API: `https://your-app.up.railway.app`
3. API Docs: `https://your-app.up.railway.app/docs`
4. Health Check: `https://your-app.up.railway.app/health`

---

### Step 8: Deploy Frontend (Optional)

For full deployment, deploy frontend separately:

**Option A: Use Vercel (Free)**
1. https://vercel.com
2. Import GitHub repo
3. Set root directory: `frontend`
4. Add environment variable: `VITE_API_URL=https://your-railway-app.up.railway.app`
5. Deploy

**Option B: Use Railway (Same as backend)**
Add a second service in Railway for the frontend:
1. New Service → Deploy from GitHub
2. Same repo, but set root directory to `frontend`
3. Add environment variable: `VITE_API_URL=${{Backend.URL}}`

---

### Step 9: Test Your Deployment

**Test Backend:**
```bash
curl https://your-app.up.railway.app/health
```

**Test Frontend:**
- Open your frontend URL
- Upload a document
- Process it
- Ask a question

---

## Troubleshooting

**Build fails?**
- Check Railway logs
- Ensure `backend/requirements.txt` exists
- Verify Python version compatibility

**Database connection error?**
- Ensure PostgreSQL service is added
- Check `DATABASE_URL` environment variable
- Verify Railway PostgreSQL is running

**API errors?**
- Check `GOOGLE_AI_API_KEY` is valid
- Verify `GEMINI_MODEL` is correct
- Check Railway logs for errors

---

## Cost

- **Free Tier**: $5/month credit (sufficient for demo)
- **Production**: ~$20-50/month depending on usage

---

## Next Steps

1. Push deployment files: `git push origin main`
2. Deploy to Railway
3. Add PostgreSQL database
4. Configure environment variables
4. Test the deployed app

**Your app will be live and shareable!** 🎉
