# OmilosRAG - Quick Start Guide

## 🚀 Start the System (3 Steps)

### 1. Start Backend
```bash
cd backend
venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output**:
```
INFO:app.main:==================================================
INFO:app.main:Starting OmilosRAG API...
INFO:app.main:Environment: development
INFO:app.main:==================================================
INFO:app.main:✓ Database connected: localhost:5432/omilosrag
INFO:app.main:✓ Database is already initialized.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Start Frontend
```bash
cd frontend
npm install  # First time only
npm run dev
```

**Expected Output**:
```
VITE v5.x.x  ready in XXX ms
➜  Local:   http://localhost:5174/
```

### 3. Open Browser
Navigate to: **http://localhost:5174**

---

## 🧪 Test the System

### Basic Test Flow
1. **Create Workspace**: Click "New Workspace" button
2. **Upload Document**: Upload a PDF file
3. **Process Document**: Click "Process" to index
4. **Ask Question**: Type a question in chat
5. **View Results**: See answer with sources

### Debug Mode
- Press **Ctrl+Shift+D** to toggle debug panel
- Shows: Chunks, KG hits, Images, LLM used

---

## 📋 Prerequisites Checklist

- ✅ PostgreSQL running on port 5432
- ✅ Database `omilosrag` created
- ✅ Backend dependencies installed (217 packages)
- ✅ `.env` file configured
- ⚠️ Ollama running on port 11434 (optional, can use Gemini)
- ⚠️ Frontend dependencies installed (`npm install`)

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if PostgreSQL is running
psql -l

# Check if port 8000 is free
lsof -i :8000

# Verify config loads
cd backend && venv/bin/python -c "from app.core.config import settings; print(settings.APP_NAME)"
```

### Database connection error
```bash
# Create database if missing
createdb omilosrag

# Update .env with correct user
DATABASE_URL=postgresql+asyncpg://YOUR_USER@localhost:5432/omilosrag
```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📊 Health Check

### Backend Health
```bash
curl http://localhost:8000/health
```

Expected:
```json
{
  "status": "healthy",
  "app": "OmilosRAG",
  "env": "development",
  "database": "connected"
}
```

### API Documentation
Open: http://localhost:8000/docs

---

## 🎯 What's Working

- ✅ Backend API server
- ✅ Database connection
- ✅ Auto-directory creation
- ✅ Configuration loading
- ✅ Health checks
- ✅ API documentation
- ✅ Startup logging
- ✅ Debug panel (frontend)

---

## 📝 Quick Commands

```bash
# Start backend
cd backend && venv/bin/uvicorn app.main:app --reload --port 8000

# Start frontend
cd frontend && npm run dev

# Check backend health
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs

# View logs
tail -f backend/logs/*.log  # If logging to file

# Stop all
# Press Ctrl+C in each terminal
```

---

## 🌐 URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:5174 | ⚠️ Not started |
| Backend API | http://localhost:8000 | ✅ Running |
| API Docs | http://localhost:8000/docs | ✅ Available |
| Health Check | http://localhost:8000/health | ✅ Available |

---

## 🎉 You're Ready!

The system is fully built and tested. Just start the frontend and you're good to go!

**Next**: Run `cd frontend && npm install && npm run dev`
