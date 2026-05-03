#!/usr/bin/env python3
"""
OmilosRAG Bulk Document Upload Script
Upload all files from a directory, process them, and build the knowledge graph.

Usage:
    python bulk_upload.py /path/to/data/folder [--workspace-id 1] [--workspace-name "My Data"]

Examples:
    # Upload to existing workspace
    python bulk_upload.py ~/Documents/pdfs --workspace-id 1

    # Create new workspace and upload
    python bulk_upload.py ~/Documents/pdfs --workspace-name "Legal Docs"

    # Upload with auto-process
    python bulk_upload.py ~/Documents/pdfs --workspace-id 1 --process
"""

import os
import sys
import time
import argparse
import requests
from pathlib import Path

API_BASE = "http://localhost:8000/api/v1"

# Supported file extensions
SUPPORTED_EXTS = {".pdf", ".txt", ".md", ".docx", ".doc", ".pptx", ".xlsx", ".html", ".htm", ".csv"}


def create_workspace(name: str, description: str = "") -> int:
    """Create a new workspace and return its ID."""
    resp = requests.post(
        f"{API_BASE}/workspaces",
        json={"name": name, "description": description},
    )
    resp.raise_for_status()
    data = resp.json()
    print(f"  ✅ Created workspace: {data['name']} (ID: {data['id']})")
    return data["id"]


def get_or_create_workspace(workspace_id: int | None, workspace_name: str | None) -> int:
    """Get existing workspace ID or create a new one."""
    if workspace_id:
        resp = requests.get(f"{API_BASE}/workspaces/{workspace_id}")
        if resp.ok:
            print(f"  📁 Using existing workspace ID: {workspace_id}")
            return workspace_id
        else:
            print(f"  ❌ Workspace {workspace_id} not found")
            sys.exit(1)

    if workspace_name:
        # Check if workspace with this name exists
        resp = requests.get(f"{API_BASE}/workspaces")
        if resp.ok:
            for ws in resp.json():
                if ws["name"] == workspace_name:
                    print(f"  📁 Found existing workspace: {ws['name']} (ID: {ws['id']})")
                    return ws["id"]
        # Create new
        return create_workspace(workspace_name, f"Bulk uploaded data")

    # Default: create with timestamp name
    name = f"Bulk Data {time.strftime('%Y-%m-%d %H:%M')}"
    return create_workspace(name, "Auto-created by bulk_upload.py")


def upload_file(workspace_id: int, file_path: Path) -> int | None:
    """Upload a single file and return document ID."""
    with open(file_path, "rb") as f:
        resp = requests.post(
            f"{API_BASE}/documents/upload/{workspace_id}",
            files={"file": (file_path.name, f)},
        )
    if resp.ok:
        data = resp.json()
        return data["id"]
    else:
        print(f"  ❌ Upload failed: {file_path.name} — {resp.text[:100]}")
        return None


def process_document(document_id: int) -> bool:
    """Trigger processing for a single document."""
    resp = requests.post(f"{API_BASE}/rag/process/{document_id}")
    return resp.ok


def process_batch(document_ids: list[int]) -> bool:
    """Trigger batch processing for multiple documents."""
    resp = requests.post(
        f"{API_BASE}/rag/process-batch",
        json={"document_ids": document_ids},
    )
    return resp.ok


def collect_files(data_dir: str) -> list[Path]:
    """Recursively collect all supported files from directory."""
    files = []
    for root, _, filenames in os.walk(data_dir):
        for fname in filenames:
            fpath = Path(root) / fname
            if fpath.suffix.lower() in SUPPORTED_EXTS:
                files.append(fpath)
    return sorted(files)


def format_size(size_bytes: int) -> str:
    """Format bytes to human-readable size."""
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


def main():
    parser = argparse.ArgumentParser(description="OmilosRAG Bulk Document Upload")
    parser.add_argument("data_dir", help="Directory containing documents to upload")
    parser.add_argument("--workspace-id", type=int, help="Existing workspace ID")
    parser.add_argument("--workspace-name", type=str, help="Create workspace with this name")
    parser.add_argument("--process", action="store_true", help="Auto-process documents after upload")
    parser.add_argument("--batch", action="store_true", help="Process all documents in one batch (faster)")
    parser.add_argument("--max-files", type=int, help="Limit number of files to upload")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    if not data_dir.exists():
        print(f"❌ Directory not found: {data_dir}")
        sys.exit(1)

    # Check backend is running
    try:
        resp = requests.get(f"{API_BASE.replace('/api/v1', '')}/health")
        if not resp.ok:
            raise Exception()
        print(f"✅ Backend connected: {resp.json()['app']}")
    except Exception:
        print("❌ Backend not running! Start it first:")
        print("   cd backend && venv/bin/uvicorn app.main:app --port 8000")
        sys.exit(1)

    # Collect files
    files = collect_files(str(data_dir))
    if args.max_files:
        files = files[: args.max_files]

    if not files:
        print(f"❌ No supported files found in {data_dir}")
        print(f"   Supported: {', '.join(SUPPORTED_EXTS)}")
        sys.exit(1)

    total_size = sum(f.stat().st_size for f in files)
    print(f"\n📂 Found {len(files)} files ({format_size(total_size)}) in {data_dir}")

    # Get or create workspace
    workspace_id = get_or_create_workspace(args.workspace_id, args.workspace_name)

    # Upload files
    print(f"\n📤 Uploading {len(files)} files to workspace {workspace_id}...")
    doc_ids = []
    failed_uploads = []

    for i, fpath in enumerate(files, 1):
        size = format_size(fpath.stat().st_size)
        print(f"  [{i}/{len(files)}] {fpath.name} ({size})...", end=" ", flush=True)

        doc_id = upload_file(workspace_id, fpath)
        if doc_id:
            doc_ids.append(doc_id)
            print("✅")
        else:
            failed_uploads.append(fpath)
            print("❌")

    print(f"\n📊 Upload Summary:")
    print(f"   ✅ Uploaded: {len(doc_ids)}")
    print(f"   ❌ Failed: {len(failed_uploads)}")

    if not doc_ids:
        print("\n❌ No documents uploaded successfully. Exiting.")
        sys.exit(1)

    # Process documents
    if args.process or args.batch:
        print(f"\n⚙️  Processing {len(doc_ids)} documents...")
        print("   This will: Parse → Chunk → Embed → Store in ChromaDB → Build KG")
        print("   (This may take a while for large datasets)\n")

        if args.batch:
            print("  📦 Batch processing all documents...")
            success = process_batch(doc_ids)
            print(f"  {'✅' if success else '❌'} Batch process {'triggered' if success else 'failed'}")
        else:
            for i, doc_id in enumerate(doc_ids, 1):
                print(f"  [{i}/{len(doc_ids)}] Processing doc {doc_id}...", end=" ", flush=True)
                success = process_document(doc_id)
                print("✅" if success else "❌")

        print(f"\n⏳ Documents are being processed in the background.")
        print(f"   Check status via: curl {API_BASE}/documents/workspace/{workspace_id}")
    else:
        print(f"\n💡 To process documents, run:")
        print(f"   curl -X POST {API_BASE}/rag/process-batch \\")
        print(f"     -H 'Content-Type: application/json' \\")
        print(f"     -d '{{\"document_ids\": {doc_ids[:5]}...}}'")
        print(f"\n   Or re-run with --process flag")

    # Final summary
    print(f"\n{'='*50}")
    print(f"✅ Done! Workspace ID: {workspace_id}")
    print(f"   Documents uploaded: {len(doc_ids)}")
    print(f"   Total data: {format_size(total_size)}")
    print(f"   UI: http://localhost:5174")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
