import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app.db import get_db
from app.integrations import instagram, twitter, linkedin, whatsapp

log = logging.getLogger(__name__)

PLATFORM_MAP = {
    "INSTAGRAM": instagram.post,
    "TWITTER": twitter.post,
    "LINKEDIN": linkedin.post,
    "WHATSAPP": whatsapp.post,
}

def process_scheduled_posts():
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, platform, content, "mediaUrls"
                    FROM scheduled_posts
                    WHERE status = 'PENDING'
                      AND ("scheduledAt" IS NULL OR "scheduledAt" <= %s)
                    FOR UPDATE SKIP LOCKED
                    """,
                    (datetime.now(timezone.utc),),
                )
                rows = cur.fetchall()

            for row in rows:
                post_id = row["id"]
                platform = row["platform"]
                content = row["content"]
                media_urls = row["mediaUrls"] or []

                handler = PLATFORM_MAP.get(platform)
                if handler is None:
                    _update_status(conn, post_id, "FAILED", error="Unknown platform")
                    continue

                result = handler(content, media_urls)
                if result.get("success"):
                    _update_status(
                        conn,
                        post_id,
                        "POSTED",
                        platform_post_id=result.get("post_id", ""),
                    )
                else:
                    _update_status(conn, post_id, "FAILED", error=result.get("error", "Unknown error"))

    except Exception:
        log.exception("Scheduler job failed")


def _update_status(conn, post_id: str, status: str, platform_post_id: str = "", error: str = ""):
    with conn.cursor() as cur:
        if status == "POSTED":
            cur.execute(
                """
                UPDATE scheduled_posts
                SET status = %s, "platformPostId" = %s, "postedAt" = %s
                WHERE id = %s
                """,
                (status, platform_post_id, datetime.now(timezone.utc), post_id),
            )
        else:
            cur.execute(
                """
                UPDATE scheduled_posts
                SET status = %s, "errorMessage" = %s
                WHERE id = %s
                """,
                (status, error, post_id),
            )


def start_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()
    scheduler.add_job(process_scheduled_posts, "interval", seconds=60, id="process_posts", max_instances=1)
    scheduler.start()
    log.info("APScheduler started — polling every 60s")
    return scheduler
