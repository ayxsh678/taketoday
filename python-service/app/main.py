import os
import json
import logging
import asyncpg
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator

import google.generativeai as genai
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks

# Use the verified-JWT dependency from core.security — NOT an inline
# string-compare. [SEC-08]
from core.security import verify_token  # noqa: F401 (re-exported for routes)
from app.tasks.scraper import Scraper
from app.tasks.pipeline import Pipeline
from app.tasks.publisher import Publisher

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Globals ──────────────────────────────────────────────────────────────────
db_pool: asyncpg.Pool | None = None
publisher: Publisher | None = None
scraper = Scraper()
scheduler = BackgroundScheduler()

# ─── Lifespan (replaces deprecated @app.on_event) [BUG-15] ───────────────────

@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    global db_pool, publisher

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is not set")

    db_pool = await asyncpg.create_pool(database_url)
    logger.info("Database connection pool created")

    publisher = Publisher(db_pool)

    scheduler.add_job(
        func=scheduled_scraping,
        trigger=IntervalTrigger(hours=2),
        id="scraping_job",
        name="Scrape all active sources",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Services started (scheduler running)")

    yield  # ← server runs here

    scheduler.shutdown()
    if db_pool:
        await db_pool.close()
    await scraper.close()
    logger.info("Services shut down cleanly")


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="TakeToday Automation Service",
    description="Python automation service for scraping, AI processing, and social publishing",
    version="1.0.0",
    lifespan=lifespan,
)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "automation"}


@app.post("/trigger-pipeline")
async def trigger_pipeline(
    background_tasks: BackgroundTasks,
    _token: dict = Depends(verify_token),
):
    background_tasks.add_task(run_full_pipeline)
    return {"message": "Pipeline triggered successfully in background"}


@app.post("/post-everywhere/{article_id}")
async def post_everywhere(
    article_id: str,
    background_tasks: BackgroundTasks,
    _token: dict = Depends(verify_token),
):
    if publisher is None:
        raise HTTPException(status_code=503, detail="Publisher is not initialized")
    background_tasks.add_task(publisher.post_everywhere, article_id)
    return {"message": f"Post everywhere triggered for article {article_id} in background"}


@app.post("/scrape-now")
async def scrape_now(
    background_tasks: BackgroundTasks,
    _token: dict = Depends(verify_token),
):
    background_tasks.add_task(scheduled_scraping)
    return {"message": "Manual scraping triggered"}


# ─── DB helpers ───────────────────────────────────────────────────────────────

async def get_ingestion_sources():
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            'SELECT id, name, type, url, active, "trustScore", "trustedCategories" '
            'FROM "IngestionSource" WHERE active = true'
        )
        return [dict(row) for row in rows]


async def create_article(article_data: dict):
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO "Article" (
                headline, subheadline, slug, body,
                "featuredImageId", "sourceLink", "authorId",
                status, language, location, breaking, "priorityScore",
                "seoTitle", "seoDescription", "metaKeywords", "canonicalUrl",
                "scheduledAt", "publishedAt", captions, "publishLogs",
                "createdAt", "updatedAt", "sourceId"
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
                $13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
            ) RETURNING *
            """,
            article_data.get("headline"),
            article_data.get("subheadline", ""),
            article_data.get("slug"),
            article_data.get("body", ""),
            article_data.get("featuredImageId"),
            article_data.get("sourceLink"),
            article_data.get("authorId"),
            article_data.get("status", "DRAFT"),
            article_data.get("language", "en"),
            article_data.get("location"),
            article_data.get("breaking", False),
            article_data.get("priorityScore", 50),
            article_data.get("seoTitle"),
            article_data.get("seoDescription"),
            article_data.get("metaKeywords", []),
            article_data.get("canonicalUrl"),
            article_data.get("scheduledAt"),
            article_data.get("publishedAt"),
            article_data.get("captions"),
            article_data.get("publishLogs"),
            datetime.now(timezone.utc),
            datetime.now(timezone.utc),
            article_data.get("sourceId"),
        )
        return dict(row)


async def create_ingestion_job_record(source_id: str) -> str:
    """
    Insert an IngestionJob row at RUNNING state so the job is visible in the
    DB even before completion.  Returns the new job's id.

    NOTE: The job queue here is still in-memory (BackgroundTasks +
    BackgroundScheduler). Jobs are NOT durable across restarts — a restart
    drops in-flight work.  For a multi-worker-safe queue, replace with
    Celery + Redis or a DB-backed polling loop consuming IngestionJob rows.
    [BUG-15]
    """
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO "IngestionJob" (id, "sourceId", status, "createdAt", "updatedAt")
            VALUES (gen_random_uuid()::text, $1, 'RUNNING', now(), now())
            RETURNING id
            """,
            source_id,
        )
        return row["id"]


async def complete_ingestion_job(job_id: str, succeeded: bool, error: str | None = None):
    status = "SUCCEEDED" if succeeded else "FAILED"
    async with db_pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE "IngestionJob"
            SET status = $1, "completedAt" = now(), "updatedAt" = now(),
                error = $2
            WHERE id = $3
            """,
            status,
            error,
            job_id,
        )


# ─── Background jobs ──────────────────────────────────────────────────────────

async def scheduled_scraping():
    logger.info("Starting scheduled scraping job")
    sources = await get_ingestion_sources()
    if not sources:
        logger.info("No active sources found")
        return

    logger.info(f"Scraping {len(sources)} active sources")

    scraped_data = await scraper.scrape_all_sources([
        {
            "id": s["id"],
            "url": s["url"],
            "type": s["type"],
            "active": s["active"],
            "trustedCategories": s["trustedCategories"] or [],
            "trustScore": s["trustScore"],
        }
        for s in sources
    ])

    total = 0
    for source_id, articles in scraped_data.items():
        source = next((s for s in sources if s["id"] == source_id), None)
        if not source:
            continue

        job_id = await create_ingestion_job_record(source_id)
        try:
            for article_data in articles:
                total += 1
                pipeline = Pipeline(db_pool, genai)
                result = await pipeline.process_article(
                    article_data,
                    {
                        "id": source["id"],
                        "name": source["name"],
                        "trustedCategories": source["trustedCategories"] or [],
                        "type": source["type"],
                    },
                )
                logger.info(f"Processed article {result['id']} status={result['status']}")
            await complete_ingestion_job(job_id, succeeded=True)
        except Exception as exc:
            logger.error(f"Error processing source {source_id}: {exc}")
            await complete_ingestion_job(job_id, succeeded=False, error=str(exc))

    logger.info(f"Scheduled scraping done — {total} articles processed")


async def run_full_pipeline():
    logger.info("Starting full pipeline")
    try:
        await scheduled_scraping()
        logger.info("Full pipeline completed")
    except Exception as exc:
        logger.error(f"Full pipeline error: {exc}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
