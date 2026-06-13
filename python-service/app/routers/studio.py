import os
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from app.integrations import instagram, twitter, linkedin, whatsapp

router = APIRouter(prefix="/api/v1/studio", tags=["studio"])

PLATFORM_MAP = {
    "INSTAGRAM": instagram.post,
    "TWITTER": twitter.post,
    "LINKEDIN": linkedin.post,
    "WHATSAPP": whatsapp.post,
}


def verify_token(authorization: Annotated[str | None, Header()] = None):
    expected = os.environ.get("INTERNAL_SERVICE_TOKEN", "")
    if not expected:
        return  # token check disabled when not configured
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    if authorization.removeprefix("Bearer ") != expected:
        raise HTTPException(status_code=401, detail="Invalid token")


class PostRequest(BaseModel):
    platforms: list[str]
    content: str
    media_urls: list[str] = []


@router.post("/post")
async def post_now(body: PostRequest, _: None = Depends(verify_token)):
    results = {}
    for platform in body.platforms:
        handler = PLATFORM_MAP.get(platform.upper())
        if handler is None:
            results[platform] = {"success": False, "error": "Unknown platform"}
            continue
        results[platform] = handler(body.content, body.media_urls)
    return {"ok": True, "results": results}


@router.get("/health")
async def health():
    return {"ok": True}
