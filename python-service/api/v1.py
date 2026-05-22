from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
import structlog
from typing import List, Optional
import asyncio
from datetime import datetime

from core.database import get_session
from core.security import verify_token
from models.source import Source
from models.job import Job, JobType, JobStatus
from services.scraper import ScraperService
from services.ai_processor import AIProcessorService
from services.deliverable_generator import DeliverableGeneratorService
from utils.job_queue import JobQueue

logger = structlog.get_logger()
router = APIRouter()

# Initialize services
scraper_service = ScraperService()
ai_processor = AIProcessorService()
deliverable_generator = DeliverableGeneratorService()
job_queue = JobQueue()


@router.post("/scrape")
async def scrape_sources(
    background_tasks: BackgroundTasks,
    source_ids: Optional[List[str]] = None,
    current_user: dict = Depends(verify_token),
    session: Session = Depends(get_session)
):
    """Trigger scraping of news sources"""
    try:
        # Get sources to scrape
        if source_ids:
            sources = session.exec(select(Source).where(Source.id.in_(source_ids))).all()
        else:
            sources = session.exec(select(Source).where(Source.active == True)).all()
        
        if not sources:
            raise HTTPException(status_code=404, detail="No active sources found")
        
        # Create scraping jobs
        jobs_created = []
        for source in sources:
            job = Job(
                type=JobType.SCRAPE,
                status=JobStatus.QUEUED,
                input={"source_id": source.id, "source_url": source.url},
                user_id=current_user.get("username", "unknown")
            )
            session.add(job)
            jobs_created.append(job)
        
        session.commit()
        
        # Queue jobs for background processing
        for job in jobs_created:
            job_queue.add_job(
                job_id=job.id,
                job_type=JobType.SCRAPE,
                payload={"source_id": job.input["source_id"], "source_url": job.input["source_url"]},
                priority=1
            )
        
        logger.info("Scraping jobs created", count=len(jobs_created), user=current_user.get("username"))
        
        return {
            "message": f"Created {len(jobs_created)} scraping jobs",
            "job_ids": [job.id for job in jobs_created]
        }
    
    except Exception as e:
        logger.error("Failed to create scraping jobs", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pipeline/run")
async def run_full_pipeline(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(verify_token),
    session: Session = Depends(get_session)
):
    """Run the full automation pipeline: scrape -> AI process -> generate deliverables"""
    try:
        # Get all active sources
        sources = session.exec(select(Source).where(Source.active == True)).all()
        
        if not sources:
            raise HTTPException(status_code=404, detail="No active sources found")
        
        # Create pipeline job
        pipeline_job = Job(
            type=JobType.PIPELINE,
            status=JobStatus.QUEUED,
            input={"source_count": len(sources)},
            user_id=current_user.get("username", "unknown")
        )
        session.add(pipeline_job)
        session.commit()
        
        # Queue the pipeline job
        job_queue.add_job(
            job_id=pipeline_job.id,
            job_type=JobType.PIPELINE,
            payload={"source_ids": [s.id for s in sources]},
            priority=0  # Highest priority
        )
        
        logger.info("Full pipeline job created", job_id=pipeline_job.id, user=current_user.get("username"))
        
        return {
            "message": "Full pipeline started",
            "job_id": pipeline_job.id
        }
    
    except Exception as e:
        logger.error("Failed to create pipeline job", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/generate-headlines")
async def generate_headlines(
    count: int = 10,
    current_user: dict = Depends(verify_token),
    session: Session = Depends(get_session)
):
    """Generate headlines using AI"""
    try:
        # Create AI job
        ai_job = Job(
            type=JobType.GENERATE_HEADLINES,
            status=JobStatus.QUEUED,
            input={"count": count},
            user_id=current_user.get("username", "unknown")
        )
        session.add(ai_job)
        session.commit()
        
        # Queue the AI job
        job_queue.add_job(
            job_id=ai_job.id,
            job_type=JobType.GENERATE_HEADLINES,
            payload={"count": count},
            priority=2
        )
        
        logger.info("Headline generation job created", job_id=ai_job.id, count=count, user=current_user.get("username"))
        
        return {
            "message": f"Headline generation job created for {count} headlines",
            "job_id": ai_job.id
        }
    
    except Exception as e:
        logger.error("Failed to create headline generation job", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs")
async def get_jobs(
    status: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(verify_token),
    session: Session = Depends(get_session)
):
    """Get recent jobs"""
    try:
        query = select(Job).order_by(Job.created_at.desc()).limit(limit)
        
        if status:
            query = query.where(Job.status == status.upper())
        
        jobs = session.exec(query).all()
        
        return {
            "jobs": [job.dict() for job in jobs],
            "count": len(jobs)
        }
    
    except Exception as e:
        logger.error("Failed to fetch jobs", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/{job_id}")
async def get_job_status(
    job_id: str,
    current_user: dict = Depends(verify_token),
    session: Session = Depends(get_session)
):
    """Get status of a specific job"""
    try:
        job = session.get(Job, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return job.dict()
    
    except Exception as e:
        logger.error("Failed to fetch job status", job_id=job_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(
    job_id: str,
    current_user: dict = Depends(verify_token),
    session: Session = Depends(get_session)
):
    """Cancel a job"""
    try:
        job = session.get(Job, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job.status in [JobStatus.SUCCEEDED, JobStatus.FAILED]:
            raise HTTPException(status_code=400, detail="Cannot completed job")
        
        job.status = JobStatus.FAILED
        job.error = "Cancelled by user"
        job.completed_at = datetime.utcnow()
        session.add(job)
        session.commit()
        
        # Remove from queue if present
        job_queue.remove_job(job_id)
        
        logger.info("Job cancelled", job_id=job_id, user=current_user.get("username"))
        
        return {"message": "Job cancelled successfully"}
    
    except Exception as e:
        logger.error("Failed to cancel job", job_id=job_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sources")
async def get_sources(
    current_user: dict = Depends(verify_token),
    session: Session = Depends(get_session)
):
    """Get all configured sources"""
    try:
        sources = session.exec(select(Source)).all()
        return {
            "sources": [source.dict() for source in sources],
            "count": len(sources)
        }
    
    except Exception as e:
        logger.error("Failed to fetch sources", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sources")
async def create_source(
    source_data: dict,
    current_user: dict = Depends(verify_token),
    session: Session = Depends(get_session)
):
    """Create a new source"""
    try:
        # Check if source with URL already exists
        existing = session.exec(select(Source).where(Source.url == source_data["url"])).first()
        if existing:
            raise HTTPException(status_code=400, detail="Source with this URL already exists")
        
        source = Source(**source_data)
        session.add(source)
        session.commit()
        session.refresh(source)
        
        logger.info("Source created", source_id=source.id, user=current_user.get("username"))
        
        return source.dict()
    
    except Exception as e:
        logger.error("Failed to create source", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/deliverables/generate")
async def generate_deliverable(
    template: str,
    data: dict,
    format: str = "html",
    current_user: dict = Depends(verify_token),
    session: Session = Depends(get_session)
):
    """Generate a deliverable using templates"""
    try:
        # Create deliverable job
        deliverable_job = Job(
            type=JobType.GENERATE_DELIVERABLE,
            status=JobStatus.QUEUED,
            input={"template": template, "format": format, "data": data},
            user_id=current_user.get("username", "unknown")
        )
        session.add(deliverable_job)
        session.commit()
        
        # Queue the deliverable job
        job_queue.add_job(
            job_id=deliverable_job.id,
            job_type=JobType.GENERATE_DELIVERABLE,
            payload={"template": template, "format": format, "data": data},
            priority=3
        )
        
        logger.info("Deliverable generation job created", job_id=deliverable_job.id, template=template, format=format, user=current_user.get("username"))
        
        return {
            "message": "Deliverable generation job created",
            "job_id": deliverable_job.id
        }
    
    except Exception as e:
        logger.error("Failed to create deliverable generation job", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# Health check endpoint
@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "python-automation-api"}