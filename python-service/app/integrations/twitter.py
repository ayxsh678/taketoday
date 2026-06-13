import os
import tweepy

def _client() -> tweepy.Client | None:
    api_key = os.environ.get("TWITTER_API_KEY", "")
    api_secret = os.environ.get("TWITTER_API_SECRET", "")
    access_token = os.environ.get("TWITTER_ACCESS_TOKEN", "")
    access_secret = os.environ.get("TWITTER_ACCESS_TOKEN_SECRET", "")
    if not all([api_key, api_secret, access_token, access_secret]):
        return None
    return tweepy.Client(
        consumer_key=api_key,
        consumer_secret=api_secret,
        access_token=access_token,
        access_token_secret=access_secret,
    )

def post(content: str, media_urls: list[str]) -> dict:
    client = _client()
    if client is None:
        return {"success": False, "error": "Platform not configured"}

    try:
        media_ids = None
        if media_urls:
            auth = tweepy.OAuth1UserHandler(
                os.environ.get("TWITTER_API_KEY"),
                os.environ.get("TWITTER_API_SECRET"),
                os.environ.get("TWITTER_ACCESS_TOKEN"),
                os.environ.get("TWITTER_ACCESS_TOKEN_SECRET"),
            )
            v1 = tweepy.API(auth)
            ids = []
            for url in media_urls[:4]:
                import requests, tempfile, os as _os
                r = requests.get(url, timeout=30)
                with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
                    f.write(r.content)
                    tmp = f.name
                m = v1.media_upload(tmp)
                ids.append(str(m.media_id))
                _os.unlink(tmp)
            media_ids = ids

        resp = client.create_tweet(text=content[:280], media_ids=media_ids)
        return {"success": True, "post_id": str(resp.data["id"])}
    except Exception as e:
        return {"success": False, "error": str(e)}
