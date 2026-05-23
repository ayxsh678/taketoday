import os
from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
import logging
import asyncpg
import json
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import google.generativeai as genai
from app.tasks.scraper import Scraper
from app.tasks.pipeline import Pipeline
from app.tasks.publisher import Publisher

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="TakeToday Automation Service",
    description="Python automation service for scraping, AI processing, and social publishing",
    version="1.0.0"
)

# Database connection pool
db_pool = None

# Initialize Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Security
security = HTTPBearer()

# JWT verification (simplified - in production, use proper JWT validation)
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    # In a real implementation, you would verify the JWT here
    # For now, we'll just check if it matches our expected secret
    expected_token = os.getenv("INTERNAL_SERVICE_TOKEN")
    if token != expected_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAuthorized,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token

# Initialize scheduler
scheduler = BackgroundScheduler()

# Initialize services (will be updated with db_pool after connection)
scraper = Scraper()
publisher = None  # Will be initialized after db pool connects

@app.on_event("startup")
async def startup():
    """Initialize services on startup"""
    global db_pool, publisher
    
    # Create database connection pool
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is not set")
    
    db_pool = await asyncpg.create_pool(database_url)
    logger.info("Database connection pool created")
    
    # Update publisher with connected db pool
    publisher = Publisher(db_pool)
    
    # Start scheduler
    scheduler.start()
    logger.info("Services started successfully")
    
    # Add scheduled scraping job (every 2 hours)
    scheduler.add_job(
        func=scheduled_scraping,
        trigger=IntervalTrigger(hours=2),
        id='scraping_job',
        name='Scrape all active sources',
        replace_existing=True
    )
    logger.info("Added scheduled scraping job (every 2 hours)")

@app.on_event("shutdown")
async def shutdown():
    """Clean up on shutdown"""
    scheduler.shutdown()
    if db_pool:
        await db_pool.close()
    logger.info("Services shut down")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "automation"}

# Trigger pipeline endpoint
@app.post("/trigger-pipeline")
async def trigger_pipeline(background_tasks: BackgroundTasks, token: str = Depends(verify_token)):
    # This would trigger the full pipeline in background
    background_tasks.add_task(run_full_pipeline)
    return {"message": "Pipeline triggered successfully in background"}

# Post everywhere endpoint
@app.post("/post-everywhere/{article_id}")
async def post_everywhere(article_id: str, background_tasks: BackgroundTasks, token: str = Depends(verify_token)):
    # This would trigger posting to all connected platforms in background
    background_tasks.add_task(publisher.post_everywhere, article_id)
    return {"message": f"Post everywhere triggered for article {article_id} in background"}

# Manual scraping endpoint (for testing)
@app.post("/scrape-now")
async def scrape_now(background_tasks: BackgroundTasks, token: str = Depends(verify_token)):
    background_tasks.add_task(scheduled_scraping)
    return {"message": "Manual scraping triggered"}

async def get_ingestion_sources():
    """Get all active ingestion sources from the database"""
    async with db_pool.acquire() as connection:
        rows = await connection.fetch("""
            SELECT id, name, type, url, active, trustScore, trustedCategories
            from "IngestionSource"
            where active = true
        """)
        return [dict(row) for row in rows]

async def get_source_by_id(source_id: str):
    """Get a source by its ID"""
    async with db_pool.acquire() as connection:
        row = await connection.fetchrow("""
            SELECT id, name, type, url, active, trustScore, trustedCategories
            from "IngestionSource"
            where id = $1
        """, source_id)
        return dict(row) if row else None

async def create_article(article_data: dict):
    """Create a new article in the database"""
    async with db_pool.acquire() as connection:
        row = await connection.fetchrow("""
            INSERT INTO "Article" (
                "headline", "subheadline", "slug", "body", "featuredImageId", 
                "sourceLink", "authorId", "status", "language", "location", 
                "breaking", "priorityScore", "seoTitle", "seoDescription", 
                "metaKeywords", "canonicalUrl", "scheduledAt", "publishedAt", 
                "captions", "publishLogs", "createdAt", "updatedAt", "sourceId"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
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
            datetime.utcnow(),
            datetime.utcnow(),
            article_data.get("sourceId")
        )
        return dict(row)

async def get_article_by_id(article_id: str):
    """Get an article by its ID"""
    async with db_pool.acquire() as connection:
        row = await connection.fetchrow("""
            SELECT * from "Article" where id = $1
        """, article_id)
        return dict(row) if row else None

async def create_social_post(social_post_data: dict):
    """Create a new social post in the database"""
    async with db_pool.acquire() as connection:
        row = await connection.fetchrow("""
            INSERT INTO "SocialPost" (
                "articleId", "platform", "copy", "mediaIds", "status", 
                "scheduledAt", "publishedAt", "retryCount", "lastError", 
                "createdAt", "updatedAt"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) RETURNING *
        """, 
            social_post_data.get("articleId"),
            social_post_data.get("platform"),
            social_post_data.get("copy"),
            social_post_data.get("mediaIds", []),
            social_post_data.get("status", "QUEUED"),
            social_post_data.get("scheduledAt"),
            social_post_data.get("publishedAt"),
            social_post_data.get("retryCount", 0),
            social_post_data.get("lastError"),
            datetime.utcnow(),
            datetime.utcnow()
        )
        return dict(row)

async def get_integrations():
    """Get enabled integrations from the database"""
    async with db_pool.acquire() as connection:
        rows = await connection.fetch("""
            SELECT "provider" from "Integration"
            where enabled = true
        """)
        return [row["provider"] for row in rows]

async def scheduled_scraping():
    """Job function for scheduled scraping"""
    logger.info("Starting scheduled scraping job")
    try:
        # Get all active sources from database
        sources = await get_ingestion_sources()
        
        if not sources:
            logger.info("No active sources found for scraping")
            return
        
        logger.info(f"Found {len(sources)} active sources to scrape")
        
        # Scrape all sources
        scraped_data = await scraper.scrape_all_sources([{
            "id": s["id"],
            "url": s["url"],
            "type": s["type"],
            "active": s["active"],
            "trustedCategories": s["trustedCategories"] or [],
            "trustScore": s["trustScore"]
        } for s in sources])
        
        # Process scraped articles
        total_articles = 0
        for source_id, articles in scraped_data.items():
            source = next((s for s in sources if s["id"] == source_id), None)
            if source:
                for article_data in articles:
                    # Check if we already processed this article (by hash)
                    # In a real implementation, we'd check against a cache or database
                    total_articles += 1
                    logger.info(f"Processing article from {source['name']}: {article_data.get('title', 'Untitled')}")
                    
                    # Process through pipeline
                    pipeline = Pipeline(db_pool, genai)
                    try:
                        result = await pipeline.process_article(article_data, {
                            "id": source["id"],
                            "name": source["name"],
                            "trustedCategories": source["trustedCategories"] or [],
                            "type": source["type"]
                        })
                        logger.info(f"Processed article: {result['id']} with status {result['status']}")
                    except Exception as e:
                        logger.error(f"Error processing article: {str(e)}")
        
        logger.info(f"Scheduled scraping completed. Processed {total_articles} articles.")
        
    except Exception as e:
        logger.error(f"Error in scheduled scraping: {str(e)}")

async def run_full_pipeline():
    """Run the full pipeline: scrape, process, and prepare for publishing"""
    logger.info("Starting full pipeline")
    try:
        # First, run scraping
        await scheduled_scraping()
        
        # In a full implementation, we would then:
        # 1. Review articles that are in UNDER_REVIEW status
        # 2. For trusted sources, they might already be ready for publishing
        # 3. Generate social media copy
        # 4. Schedule posts
        
        logger.info("Full pipeline completed")
    except Exception as e:
        logger.error(f"Error in full pipeline: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)