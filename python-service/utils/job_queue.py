import heapq
import threading
import time
import uuid
from typing import Dict, Any, Callable, Optional
from dataclasses import dataclass, field
from enum import IntEnum
import structlog
from models.job import JobType

logger = structlog.get_logger()

class Priority(IntEnum):
    CRITICAL = 0
    HIGH = 1
    MEDIUM = 2
    LOW = 3

@dataclass
class QueuedJob:
    id: str
    job_type: JobType
    payload: Dict[str, Any]
    priority: Priority
    timestamp: float = field(default_factory=time.time)
    
    def __lt__(self, other):
        # Lower priority number = higher priority
        if self.priority != other.priority:
            return self.priority < other.priority
        # Earlier timestamp = higher priority
        return self.timestamp < other.timestamp

class JobQueue:
    def __init__(self):
        self._queue: list[QueuedJob] = []
        self._lock = threading.Lock()
        self._processing = False
        self._worker_thread: Optional[threading.Thread] = None
        self._job_handlers: Dict[JobType, Callable] = {}
        
        # In-memory storage for job status (in production, use database)
        self._job_status: Dict[str, Dict[str, Any]] = {}
    
    def register_handler(self, job_type: JobType, handler: Callable):
        """Register a handler function for a job type"""
        self._job_handlers[job_type] = handler
        logger.info("Job handler registered", job_type=job_type.value)
    
    def add_job(self, job_id: str, job_type: JobType, payload: Dict[str, Any], priority: Priority = Priority.MEDIUM):
        """Add a job to the queue"""
        with self._lock:
            queued_job = QueuedJob(
                id=job_id,
                job_type=job_type,
                payload=payload,
                priority=priority
            )
            heapq.heappush(self._queue, queued_job)
            
            # Store initial job status
            self._job_status[job_id] = {
                "id": job_id,
                "type": job_type.value,
                "status": "queued",
                "payload": payload,
                "created_at": time.time(),
                "updated_at": time.time()
            }
            
            logger.info("Job added to queue", job_id=job_id, job_type=job_type.value, priority=priority.name)
            
            # Start worker thread if not already running
            if not self._processing:
                self._start_worker()
    
    def remove_job(self, job_id: str):
        """Remove a job from the queue (for cancellation)"""
        with self._lock:
            # Find and remove the job
            self._queue = [job for job in self._queue if job.id != job_id]
            heapq.heapify(self._queue)  # Restore heap property
            
            # Update job status
            if job_id in self._job_status:
                self._job_status[job_id]["status"] = "cancelled"
                self._job_status[job_id]["updated_at"] = time.time()
            
            logger.info("Job removed from queue", job_id=job_id)
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get the current status of a job"""
        with self._lock:
            return self._job_status.get(job_id)
    
    def _start_worker(self):
        """Start the background worker thread"""
        if self._processing:
            return
        
        self._processing = True
        self._worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
        self._worker_thread.start()
        logger.info("Job queue worker started")
    
    def _stop_worker(self):
        """Stop the background worker thread"""
        self._processing = False
        if self._worker_thread:
            self._worker_thread.join(timeout=5)
        logger.info("Job queue worker stopped")
    
    def _worker_loop(self):
        """Main worker loop that processes jobs from the queue"""
        logger.info("Worker loop started")
        
        while self._processing:
            try:
                # Get the next job from the queue (with timeout to allow checking _processing flag)
                job_to_process = None
                with self._lock:
                    if self._queue:
                        job_to_process = heapq.heappop(self._queue)
                
                if job_to_process is None:
                    # No jobs in queue, sleep briefly
                    time.sleep(0.1)
                    continue
                
                # Process the job
                self._process_job(job_to_process)
                
            except Exception as e:
                logger.error("Error in worker loop", error=str(e))
                time.sleep(1)  # Avoid tight loop on error
        
        logger.info("Worker loop ended")
    
    def _process_job(self, queued_job: QueuedJob):
        """Process a single job"""
        job_id = queued_job.id
        job_type = queued_job.job_type
        payload = queued_job.payload
        
        logger.info("Processing job", job_id=job_id, job_type=job_type.value)
        
        # Update job status to running
        with self._lock:
            if job_id in self._job_status:
                self._job_status[job_id]["status"] = "running"
                self._job_status[job_id]["started_at"] = time.time()
                self._job_status[job_id]["updated_at"] = time.time()
        
        try:
            # Get the handler for this job type
            handler = self._job_handlers.get(job_type)
            if not handler:
                raise ValueError(f"No handler registered for job type: {job_type.value}")
            
            # Execute the handler
            result = handler(payload)
            
            # Update job status to succeeded
            with self._lock:
                if job_id in self._job_status:
                    self._job_status[job_id]["status"] = "succeeded"
                    self._job_status[job_id]["result"] = result
                    self._job_status[job_id]["completed_at"] = time.time()
                    self._job_status[job_id]["updated_at"] = time.time()
            
            logger.info("Job completed successfully", job_id=job_id, job_type=job_type.value)
        
        except Exception as e:
            # Update job status to failed
            error_msg = str(e)
            logger.error("Job processing failed", job_id=job_id, job_type=job_type.value, error=error_msg)
            
            with self._lock:
                if job_id in self._job_status:
                    self._job_status[job_id]["status"] = "failed"
                    self._job_status[job_id]["error"] = error_msg
                    self._job_status[job_id]["completed_at"] = time.time()
                    self._job_status[job_id]["updated_at"] = time.time()

# Global job queue instance
job_queue = JobQueue()