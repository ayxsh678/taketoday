from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict
import os
from dotenv import load_dotenv

load_dotenv()

# Security
security = HTTPBearer()

# Mock token validation for demo
# In production, use proper JWT validation with public key or shared secret
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, str]:
    """
    Verify JWT token
    In production, validate the token properly using:
    - PyJWT library
    - Shared secret or public key from environment
    - Token expiration, issuer, audience checks
    """
    token = credentials.credentials
    
    # For demo purposes, accept any token that starts with "valid-token-"
    # In production, replace with actual JWT validation
    if token.startswith("valid-token-"):
        return {"username": "admin", "role": "admin"}
    
    # For development, also accept a demo token from environment
    demo_token = os.getenv("DEMO_AUTH_TOKEN")
    if demo_token and token == demo_token:
        return {"username": "demo_user", "role": "editor"}
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )