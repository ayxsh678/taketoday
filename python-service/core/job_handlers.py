import asyncio
import structlog
from typing import Dict, Any
from ..services.scraper import scrape_source
from ..services.ai_processor import process_articles, generate_headlines
from ..services.deliverable_generator import generate_deliverable
from ..models.job import JobType
from ..utils.job_queue import job_queue
from ..core.database import get_session
from ..models.source import Source
from ..models.job import Job, JobStatus
from sqlmodel import Session, select
from datetime import datetime

logger = structlog.get_logger()

async def handle_scrape_job(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle a scraping job"""
    source_id = payload.get("source_id")
    source_url = payload.get("source_url")
    
    if not source_id or not source_url:
        raise ValueError("Missing source_id or source_url in job payload")
    
    # Get source details from database
    with next(get_session()) as session:
        source = session.get(Source, source_id)
        if not source:
            raise ValueError(f"Source not found: {source_id}")
        
        # Update source last_scraped timestamp
        source.last_scraped = datetime.utcnow()
        session.add(source)
        session.commit()
    
    # Perform scraping
    result = await scrape_source(source_id, source_url, source.type)
    
    # In a real implementation, we would save the articles to database here
    # For now, we'll just return the result
    return {
        "source_id": source_id,
        "articles_found": len(result.get("articles", [])),
        "scraped_at": result.get("scraped_at")
    }

async def handle_pipeline_job(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle a full pipeline job"""
    source_ids = payload.get("source_ids", [])
    
    if not source_ids:
        # Get all active sources
        with next(get_session()) as session:
            sources = session.exec(select(Source).where(Source.active == True)).all()
            source_ids = [s.id for s in sources]
    
    logger.info("Starting pipeline job", source_count=len(source_ids))
    
    total_articles = 0
    processed_sources = 0
    
    # Process each source
    for source_id in source_ids:
        with next(get_session()) as session:
            source = session.get(Source, source_id)
            if not source or not source.active:
                continue
            
            try:
                # Scrape source
                scrape_result = await scrape_source(source.id, source.url, source.type)
                articles = scrape_result.get("articles", [])
                
                if articles:
                    # Process articles with AI
                    processed_articles = await process_articles(articles)
                    
                    # In a real implementation, we would:
                    # 1. Save articles to database
                    # 2. Generate social media captions
                    # 3. Create newsletter content
                    # 4. etc.
                    
                    total_articles += len(processed_articles)
                    processed_sources += 1
                    
                    logger.info("Source processed", 
                              source_id=source.id, 
                              articles_found=len(articles),
                              articles_processed=len(processed_articles))
                
                # Update source last_scraped
                source.last_scraped = datetime.utcnow()
                session.add(source)
                session.commit()
                
            except Exception as e:
                logger.error("Failed to process source in pipeline", 
                           source_id=source_id, error=str(e))
                continue
    
    return {
        "sources_processed": processed_sources,
        "total_articles": total_articles,
        "completed_at": datetime.utcnow().isoformat()
    }

async def handle_generate_headlines_job(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle a headline generation job"""
    count = payload.get("count", 10)
    
    # Get recent articles from database (in a real implementation)
    # For now, we'll simulate with some dummy data
    dummy_articles = [
        {
            "title": "Market Update: Tech Stocks Rally on Earnings",
            "description": "Technology stocks showed strong performance today as major companies reported better-than-expected quarterly earnings.",
            "source_id": "dummy1"
        },
        {
            "title": "Global Trade Tensions Ease After Diplomatic Talks",
            "description": "Recent negotiations between major economies have led to a reduction in trade tensions, boosting market confidence.",
            "source_id": "dummy2"
        },
        {
            "title": "New Study Shows Benefits of Remote Work Productivity",
            "description": "Research indicates that remote work arrangements can increase productivity when properly implemented with the right tools and communication protocols.",
            "source_id": "dummy3"
        }
    ]
    
    # Generate headlines
    headlines = await generate_headlines(dummy_articles, count)
    
    return {
        "headlines_generated": len(headlines),
        "headlines": headlines,
        "generated_at": datetime.utcnow().isoformat()
    }

async def handle_generate_deliverable_job(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle a deliverable generation job"""
    template = payload.get("template")
    data = payload.get("data", {})
    format = payload.get("format", "html")
    
    if not template:
        raise ValueError("Missing template in job payload")
    
    # Generate deliverable
    result = await generate_deliverable(template, data, format)
    
    return {
        "template": template,
        "format": format,
        "size_bytes": result.get("size_bytes", 0),
        "generated_at": result.get("generated_at")
    }

# Register all job handlers
def register_job_handlers():
    """Register all job handlers with the job queue"""
    job_queue.register_handler(JobType.SCRAPE, handle_scrape_job)
    job_queue.register_handler(JobType.PIPELINE, handle_pipeline_job)
    job_queue.register_handler(JobType.GENERATE_HEADLINES, handle_generate_headlines_job)
    job_queue.register_handler(JobType.GENERATE_DELIVERABLE, handle_generate_deliverable_job)
    logger.info("All job handlers registered")

# Initialize handlers when module is imported
register_job_handlers()