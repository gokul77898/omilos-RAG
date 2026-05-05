import os
import logging
from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
from pathlib import Path

logger = logging.getLogger(__name__)

# Find .env file - check project root first, fallback for Docker
_candidate = Path(__file__).resolve().parent.parent.parent.parent / ".env"
ENV_FILE = str(_candidate) if _candidate.exists() else ".env"


def _ensure_directories() -> None:
    """Ensure required data directories exist on startup."""
    base_dir = Path(__file__).resolve().parent.parent.parent.parent
    
    directories = [
        base_dir / "data",
        base_dir / "data" / "chroma",
        base_dir / "data" / "lightrag",
    ]
    
    for directory in directories:
        if not directory.exists():
            directory.mkdir(parents=True, exist_ok=True)
            logger.info(f"Created directory: {directory}")
        else:
            logger.debug(f"Directory exists: {directory}")


class Settings(BaseSettings):
    # App
    APP_NAME: str = "OmilosRAG"
    ENV: str = Field(default="development")
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Base directory (backend folder)
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    
    # Data paths
    CHROMA_PATH: Path = Field(default=Path("./data/chroma"))

    # Database
    DATABASE_URL: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5433/omilosrag")

    # LLM Provider: "gemini" | "ollama"
    LLM_PROVIDER: str = Field(default="gemini")

    # Google AI
    GOOGLE_AI_API_KEY: str = Field(default="")

    # Ollama
    OLLAMA_HOST: str = Field(default="http://localhost:11434")
    OLLAMA_MODEL: str = Field(default="gemma3:12b")
    OLLAMA_ENABLE_THINKING: bool = Field(default=False)

    # LLM (fast model for chat + KG extraction — used when provider=gemini)
    LLM_MODEL_FAST: str = Field(default="gemini-2.5-flash")

    # Thinking level for Gemini 3.x+ models: "minimal" | "low" | "medium" | "high"
    # Gemini 2.5 uses thinking_budget_tokens instead (auto-detected)
    LLM_THINKING_LEVEL: str = Field(default="medium")

    # Max output tokens for LLM chat responses (includes thinking tokens)
    # Gemini 3.1 Flash-Lite supports up to 65536
    LLM_MAX_OUTPUT_TOKENS: int = Field(default=8192)

    # KG Embedding provider (can differ from LLM provider)
    KG_EMBEDDING_PROVIDER: str = Field(default="gemini")
    KG_EMBEDDING_MODEL: str = Field(default="gemini-embedding-001")
    KG_EMBEDDING_DIMENSION: int = Field(default=3072)

    # ChromaDB
    CHROMA_HOST: str = Field(default="localhost")
    CHROMA_PORT: int = Field(default=8002)

    # OmilosRAG Pipeline
    OMILOSRAG_ENABLED: bool = True
    OMILOSRAG_ENABLE_KG: bool = True
    OMILOSRAG_ENABLE_IMAGE_EXTRACTION: bool = True
    OMILOSRAG_ENABLE_IMAGE_CAPTIONING: bool = True
    OMILOSRAG_ENABLE_TABLE_CAPTIONING: bool = True
    OMILOSRAG_MAX_TABLE_MARKDOWN_CHARS: int = 8000
    OMILOSRAG_CHUNK_MAX_TOKENS: int = 400
    OMILOSRAG_CHUNK_OVERLAP_TOKENS: int = 80
    OMILOSRAG_KG_QUERY_TIMEOUT: float = 30.0
    OMILOSRAG_KG_CHUNK_TOKEN_SIZE: int = 1200
    OMILOSRAG_KG_LANGUAGE: str = "English"
    OMILOSRAG_KG_ENTITY_TYPES: list[str] = [
        "Organization", "Person", "Product", "Location", "Event",
        "Financial_Metric", "Technology", "Date", "Regulation",
    ]
    OMILOSRAG_DEFAULT_QUERY_MODE: str = "hybrid"
    OMILOSRAG_DOCLING_IMAGES_SCALE: float = 2.0
    OMILOSRAG_MAX_IMAGES_PER_DOC: int = 50
    OMILOSRAG_ENABLE_FORMULA_ENRICHMENT: bool = True

    # Document Parser provider: "docling" (default) or "marker" (lighter, better math)
    OMILOSRAG_DOCUMENT_PARSER: str = "docling"
    OMILOSRAG_MARKER_USE_LLM: bool = False

    # Processing timeout (minutes) — stale documents auto-recover to FAILED
    OMILOSRAG_PROCESSING_TIMEOUT_MINUTES: int = 10

    # Pre-ingestion Deduplication
    OMILOSRAG_DEDUP_ENABLED: bool = True
    OMILOSRAG_DEDUP_MIN_CHUNK_LENGTH: int = 50       # min meaningful chars
    OMILOSRAG_DEDUP_NEAR_THRESHOLD: float = 0.85     # Jaccard similarity cutoff

    # OmilosRAG Retrieval Quality
    OMILOSRAG_EMBEDDING_MODEL: str = "BAAI/bge-m3"
    OMILOSRAG_RERANKER_MODEL: str = "BAAI/bge-reranker-v2-m3"
    OMILOSRAG_VECTOR_PREFETCH: int = 20
    OMILOSRAG_RERANKER_TOP_K: int = 8
    OMILOSRAG_MIN_RELEVANCE_SCORE: float = 0.15
    OMILOSRAG_QUERY_EXPANSION: bool = True

    # Neo4j Graph Database
    NEO4J_URI: str = Field(default="bolt://localhost:7687")
    NEO4J_USERNAME: str = Field(default="neo4j")
    NEO4J_PASSWORD: str = Field(default="Smile@123")
    NEO4J_DATABASE: str = Field(default="neo4j")

    # KG Graph Storage provider: "NetworkXStorage" (default, file-based) | "Neo4JStorage"
    OMILOSRAG_KG_GRAPH_STORAGE: str = Field(default="Neo4JStorage")

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5174", "http://localhost:3000"]

    model_config = {
        "env_file": str(ENV_FILE),
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


@lru_cache
def get_settings() -> Settings:
    # Ensure data directories exist
    _ensure_directories()
    
    # Log startup info
    s = Settings()
    logger.info(f"=== OmilosRAG Configuration ===")
    logger.info(f"App: {s.APP_NAME} (env: {s.ENV})")
    logger.info(f"Database: {s.DATABASE_URL.split('@')[-1] if '@' in s.DATABASE_URL else s.DATABASE_URL}")
    logger.info(f"Chroma Path: {s.CHROMA_PATH}")
    logger.info(f"LLM Provider: {s.LLM_PROVIDER} | Model: {s.OLLAMA_MODEL if s.LLM_PROVIDER == 'ollama' else s.LLM_MODEL_FAST}")
    logger.info(f"KG Embedding: {s.KG_EMBEDDING_PROVIDER} | {s.KG_EMBEDDING_MODEL}")
    logger.info(f"KG Graph Storage: {s.OMILOSRAG_KG_GRAPH_STORAGE}")
    if s.OMILOSRAG_KG_GRAPH_STORAGE == "Neo4JStorage":
        logger.info(f"Neo4j: {s.NEO4J_URI} (user: {s.NEO4J_USERNAME})")
    logger.info(f"================================")
    
    return s


settings = get_settings()


async def reset_database() -> None:
    """Drop all tables and recreate schema."""
    from sqlalchemy import text
    from app.db import engine, Base
    
    async with engine.begin() as conn:
        # Drop all tables
        await conn.execute(text("DROP SCHEMA public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        logger.info("Database reset complete - all tables dropped and recreated")
    
    # Recreate tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema recreated")
