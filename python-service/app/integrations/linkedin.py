import os
import requests

def _cfg():
    token = os.environ.get("LINKEDIN_ACCESS_TOKEN", "")
    person_urn = os.environ.get("LINKEDIN_PERSON_URN", "")
    return token, person_urn

def post(content: str, media_urls: list[str]) -> dict:
    token, person_urn = _cfg()
    if not token or not person_urn:
        return {"success": False, "error": "Platform not configured"}

    try:
        media_content = []
        for url in media_urls[:20]:
            media_content.append({
                "status": "READY",
                "description": {"text": ""},
                "media": url,
                "title": {"text": ""},
            })

        body: dict = {
            "author": person_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": content[:3000]},
                    "shareMediaCategory": "IMAGE" if media_urls else "NONE",
                    "media": media_content,
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
        }

        r = requests.post(
            "https://api.linkedin.com/v2/ugcPosts",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
            },
            json=body,
        )
        r.raise_for_status()
        return {"success": True, "post_id": r.headers.get("x-restli-id", "")}
    except Exception as e:
        return {"success": False, "error": str(e)}
