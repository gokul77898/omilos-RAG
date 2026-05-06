# 🧪 Testing OmilosRAG - Quick Guide

## ✅ Setup Complete

Your Gemini API key is configured:
- **API Key**: `AIzaSyA06Sv7M2bAzoyND3TebFFyPWUyOV9HHTk`
- **Model**: `gemini-2.5-flash-preview-04-1`
- **Provider**: Gemini (cloud)

---

## 🚀 How to Test the RAG System

### Step 1: Start the Servers

**Backend** (if not running):
```bash
cd "/Users/gokul/Documents/Omilos RAG/OmilosRAG/backend"
venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Frontend** (if not running):
```bash
cd "/Users/gokul/Documents/Omilos RAG/OmilosRAG/frontend"
npm run dev
```

---

### Step 2: Access the UI

Open in browser: **http://localhost:5173**

---

### Step 3: Create a Workspace

1. Click **"+ New Knowledge Base"**
2. Name it: `Test Workspace`
3. Click **"Create"**

---

### Step 4: Upload a Document

1. Click **"Upload Documents"** button
2. Select a PDF, DOCX, or TXT file
3. Wait for upload to complete
4. Click **"Process"** button on the document
5. Wait for processing (status changes to "Indexed")

---

### Step 5: Ask Questions

1. In the chat panel (right side), type a question about your document
2. Example: "What is this document about?"
3. Press Enter
4. Watch the RAG system work:
   - **Analyzing** - Understanding your question
   - **Retrieving** - Finding relevant chunks
   - **Generating** - Creating answer with Gemini

---

### Step 6: View Knowledge Graph

1. Click the processed document in the left panel
2. Right panel → Click **"Knowledge Graph"** tab
3. See the animated graph with entities and relationships
4. Hover over nodes to see connections
5. Click nodes to see details

---

## 🎯 What to Test

### Test 1: Simple Fact Extraction
**Question**: "What are the key points in this document?"
**Expected**: Gemini extracts main facts with citations

### Test 2: Specific Information
**Question**: "What is mentioned about [specific topic]?"
**Expected**: RAG retrieves relevant chunks and answers

### Test 3: Multi-turn Conversation
**Question 1**: "What is this document about?"
**Question 2**: "Tell me more about that"
**Expected**: Gemini remembers context

### Test 4: Knowledge Graph
**Action**: View the Knowledge Graph tab
**Expected**: See entities (people, orgs, locations) connected by relationships

### Test 5: Citations
**Check**: Every answer should have source citations
**Expected**: Click citation numbers to see source chunks

---

## 🔍 How RAG Works (What You'll See)

### 1. **Document Processing**
- **Docling Parser** extracts text, preserving structure
- **bge-m3** creates embeddings (1024-dim vectors)
- **LightRAG** builds knowledge graph (entities + relationships)
- **ChromaDB** stores vector embeddings

### 2. **Question Answering**
- **Gemini** analyzes your question
- **Hybrid Retriever** searches:
  - Vector search (semantic similarity)
  - Knowledge Graph (entity relationships)
- **bge-reranker-v2-m3** ranks results
- **Gemini** generates answer with citations

### 3. **Knowledge Graph**
- Extracts entities (people, organizations, locations, etc.)
- Identifies relationships (CEO, produces, located in, etc.)
- Visualizes as interactive graph with animations

---

## 📊 Expected Results

**Processing Speed**:
- Small doc (1-5 pages): 10-30 seconds
- Medium doc (10-20 pages): 30-60 seconds
- Large doc (50+ pages): 2-5 minutes

**Answer Quality**:
- ✅ Accurate facts from document
- ✅ Citations for every claim
- ✅ Contextual understanding
- ✅ Multi-turn conversation memory

**Knowledge Graph**:
- ✅ Entities extracted automatically
- ✅ Relationships identified
- ✅ Interactive visualization
- ✅ Animated particles and pulsing nodes

---

## 🐛 Troubleshooting

**Backend not starting?**
```bash
cd backend
venv/bin/python -m pip install -r requirements.txt
```

**Frontend not loading?**
```bash
cd frontend
npm install
npm run dev
```

**No answers generated?**
- Check Gemini API key is valid
- Check backend logs for errors
- Verify document is processed (status: "Indexed")

**Knowledge Graph empty?**
- Process document first
- Wait for indexing to complete
- Check if document has extractable entities

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Documents upload and process successfully
- ✅ Chat answers with citations appear
- ✅ Knowledge Graph shows entities and relationships
- ✅ Animated graph UI works (particles, pulsing nodes)
- ✅ Multi-turn conversations maintain context

---

## 📝 Sample Questions to Try

**For a technical document**:
- "Summarize the main technical approach"
- "What are the key innovations?"
- "What results were achieved?"

**For a business document**:
- "What are the financial highlights?"
- "Who are the key people mentioned?"
- "What are the main business activities?"

**For any document**:
- "What is this document about?"
- "List the main topics covered"
- "What are the key takeaways?"

---

**Your RAG system is ready to test!** 🚀

Start with a simple document and ask questions to see the magic happen!
