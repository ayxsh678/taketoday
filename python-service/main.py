import os
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="TakeToday Automation Service",
    description="Python automation service for scraping, AI processing, and deliverable generation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Mock user database for demo (in production, use proper user management)
USERS_DB = {
    "admin": {
        "username": "admin",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # password: secret
        "role": "admin"
    }
}

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token"""
    token = credentials.credentials
    # In production, validate JWT properly
    # For demo, we'll accept any token that starts with "valid-token-"
    if token.startswith("valid-token-"):
        return {"username": "admin", "role": "admin"}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

@app.get("/")
async def root():
    return {"message": "TakeToday Automation Service is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "python-automation"}

@app.post("/auth/login")
async def login(username: str, password: str):
    """Login endpoint"""
    # In production, validate credentials properly
    if username == "admin" and password == "secret":
        return {"access_token": "valid-token-12345", "token_type": "bearer"}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
    )

# Include routers
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.v1 import router as api_v1_router
app.include_router(api_v1_router, prefix="/api/v1")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)