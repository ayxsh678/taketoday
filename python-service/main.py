import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from app.routers import studio
from app.scheduler import start_scheduler

logging.basicConfig(level=logging.INFO)

_scheduler = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _scheduler
    _scheduler = start_scheduler()
    yield
    if _scheduler:
        _scheduler.shutdown(wait=False)

app = FastAPI(title="TakeToday Studio Service", lifespan=lifespan)
app.include_router(studio.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
