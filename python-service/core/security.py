from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict
import os
from dotenv import load_dotenv
import jwt
from jwt import InvalidTokenError

load_dotenv()

# Security
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, str]:
    """
    Verify JWT token
    In production, validate the token properly using:
    - PyJWT library
    - Shared secret or public key from environment
    - Token expiration, issuer, audience checks
    """
    token = credentials.credentials
    
    service_token = os.getenv("INTERNAL_SERVICE_TOKEN")
    if service_token and token == service_token:
        return {"username": "internal-service", "role": "admin"}

    jwt_secret = os.getenv("JWT_SECRET")
    if jwt_secret:
        try:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                audience=os.getenv("JWT_AUDIENCE") or None,
                options={"verify_aud": bool(os.getenv("JWT_AUDIENCE"))},
            )
            return {
                "username": str(payload.get("sub") or payload.get("email") or "admin"),
                "role": str(payload.get("role") or "admin"),
            }
        except InvalidTokenError:
            pass
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
