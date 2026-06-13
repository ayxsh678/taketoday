import os
import requests

WA_API = "https://graph.facebook.com/v21.0"

def _cfg():
    phone_id = os.environ.get("WHATSAPP_PHONE_ID", "")
    token = os.environ.get("WHATSAPP_TOKEN", "")
    recipients_raw = os.environ.get("WHATSAPP_RECIPIENT", "")
    recipients = [r.strip() for r in recipients_raw.split(",") if r.strip()]
    return phone_id, token, recipients

def post(content: str, media_urls: list[str]) -> dict:
    phone_id, token, recipients = _cfg()
    if not phone_id or not token or not recipients:
        return {"success": False, "error": "Platform not configured"}

    results = []
    try:
        for number in recipients:
            if media_urls:
                body = {
                    "messaging_product": "whatsapp",
                    "to": number,
                    "type": "image",
                    "image": {"link": media_urls[0], "caption": content[:1024]},
                }
            else:
                body = {
                    "messaging_product": "whatsapp",
                    "to": number,
                    "type": "text",
                    "text": {"body": content[:4096]},
                }

            r = requests.post(
                f"{WA_API}/{phone_id}/messages",
                headers={"Authorization": f"Bearer {token}"},
                json=body,
            )
            r.raise_for_status()
            results.append({"number": number, "message_id": r.json().get("messages", [{}])[0].get("id", "")})

        return {"success": True, "results": results}
    except Exception as e:
        return {"success": False, "error": str(e)}
