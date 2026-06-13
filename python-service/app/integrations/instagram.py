import os
import requests

META_API = "https://graph.facebook.com/v21.0"

def _cfg():
    token = os.environ.get("META_ACCESS_TOKEN", "")
    user_id = os.environ.get("META_IG_USER_ID", "")
    return token, user_id

def post(content: str, media_urls: list[str]) -> dict:
    token, user_id = _cfg()
    if not token or not user_id:
        return {"success": False, "error": "Platform not configured"}

    try:
        if len(media_urls) > 1:
            return _post_carousel(token, user_id, content, media_urls)
        elif len(media_urls) == 1:
            return _post_single_image(token, user_id, content, media_urls[0])
        else:
            return _post_text(token, user_id, content)
    except Exception as e:
        return {"success": False, "error": str(e)}

def _post_single_image(token: str, user_id: str, caption: str, image_url: str) -> dict:
    r = requests.post(
        f"{META_API}/{user_id}/media",
        params={"access_token": token},
        json={"image_url": image_url, "caption": caption},
    )
    r.raise_for_status()
    container_id = r.json()["id"]

    pub = requests.post(
        f"{META_API}/{user_id}/media_publish",
        params={"access_token": token},
        json={"creation_id": container_id},
    )
    pub.raise_for_status()
    return {"success": True, "post_id": pub.json()["id"]}

def _post_carousel(token: str, user_id: str, caption: str, image_urls: list[str]) -> dict:
    child_ids = []
    for url in image_urls:
        r = requests.post(
            f"{META_API}/{user_id}/media",
            params={"access_token": token},
            json={"image_url": url, "is_carousel_item": True},
        )
        r.raise_for_status()
        child_ids.append(r.json()["id"])

    r = requests.post(
        f"{META_API}/{user_id}/media",
        params={"access_token": token},
        json={"media_type": "CAROUSEL", "caption": caption, "children": child_ids},
    )
    r.raise_for_status()
    container_id = r.json()["id"]

    pub = requests.post(
        f"{META_API}/{user_id}/media_publish",
        params={"access_token": token},
        json={"creation_id": container_id},
    )
    pub.raise_for_status()
    return {"success": True, "post_id": pub.json()["id"]}

def _post_text(token: str, user_id: str, caption: str) -> dict:
    r = requests.post(
        f"{META_API}/{user_id}/media",
        params={"access_token": token},
        json={"media_type": "REELS", "caption": caption},
    )
    if r.status_code != 200:
        return {"success": False, "error": "Text-only posts not supported on Instagram"}
    return {"success": False, "error": "Instagram requires at least one image"}
