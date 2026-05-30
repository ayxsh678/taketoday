import asyncio
import logging
import json
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class Publisher:
    def __init__(self, db_pool):
        self.db_pool = db_pool
    
    async def post_article_to_platform(self, article_id: str, platform: str, copy: str, media_ids: List[str] = None) -> Dict[str, Any]:
        """
        Post an article to a specific social media platform
        Returns the created social post record
        """
        try:
            # Validate platform against SocialPlatform enum
            valid_platforms = ["X", "INSTAGRAM", "WHATSAPP", "TELEGRAM", "FACEBOOK", "LINKEDIN", "YOUTUBE", "THREADS"]
            if platform not in valid_platforms:
                raise ValueError(f"Invalid platform: {platform}. Must be one of {valid_platforms}")
            
            # In a real implementation, we would call the respective platform's API
            # For now, we'll simulate the post and create a social post record
            
            social_post = await self._create_social_post({
                "articleId": article_id,
                "platform": platform,  # This should match the SocialPlatform enum
                "copy": copy,
                "mediaIds": media_ids or [],
                "status": "SUCCEEDED",  # Assuming immediate success for simulation
                "publishedAt": datetime.utcnow()
            })
            
            logger.info(f"Posted article {article_id} to {platform}")
            return {
                "id": social_post["id"],
                "platform": platform,
                "status": social_post["status"],
                "publishedAt": social_post["publishedAt"].isoformat() if social_post["publishedAt"] else None
            }
        except Exception as e:
            logger.error(f"Error posting to {platform}: {str(e)}")
            # Create a failed record
            social_post = await self._create_social_post({
                "articleId": article_id,
                "platform": platform,
                "copy": copy,
                "mediaIds": media_ids or [],
                "status": "FAILED",
                "lastError": str(e)
            })
            return {
                "id": social_post["id"],
                "platform": platform,
                "status": social_post["status"],
                "error": str(e),
                "publishedAt": None
            }
    
    async def _create_social_post(self, social_post_data: dict) -> dict:
        """Create a new social post in the database"""
        async with self.db_pool.acquire() as connection:
            row = await connection.fetchrow("""
                INSERT INTO "SocialPost" (
                    "articleId", "platform", "copy", "mediaIds", "status", 
                    "scheduledAt", "publishedAt", "retryCount", "lastError", 
                    "createdAt", "updatedAt"
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
                ) RETURNING *
            """, 
                social_post_data.get("articleId"),
                social_post_data.get("platform"),
                social_post_data.get("copy"),
                social_post_data.get("mediaIds", []),
                social_post_data.get("status", "QUEUED"),
                social_post_data.get("scheduledAt"),
                social_post_data.get("publishedAt"),
                social_post_data.get("retryCount", 0),
                social_post_data.get("lastError"),
                datetime.utcnow(),
                datetime.utcnow()
            )
            return dict(row)
    
    async def post_everywhere(self, article_id: str) -> List[Dict[str, Any]]:
        """
        Post an article to all connected platforms
        Returns list of results for each platform
        """
        try:
            # Get the article to ensure it exists and get its details
            article = await self._get_article_by_id(article_id)
            
            if not article:
                raise ValueError(f"Article {article_id} not found")
            
            # Get active social platform integrations from database
            # Map IntegrationProvider to SocialPlatform
            provider_to_platform = {
                "X": "X",
                "INSTAGRAM": "INSTAGRAM",
                "WHATSAPP": "WHATSAPP",
                "TELEGRAM": "TELEGRAM",
                "FACEBOOK": "FACEBOOK",
                "LINKEDIN": "LINKEDIN",
                "YOUTUBE": "YOUTUBE",
                "THREADS": "THREADS",
            }
            
            try:
                integrations = await self._get_integrations()
                
                platforms = []
                for integration in integrations:
                    platform = provider_to_platform.get(integration)
                    if platform:
                        platforms.append(platform)
                
                # If no integrations found, use default platforms
                if not platforms:
                    platforms = ["X", "INSTAGRAM", "FACEBOOK", "LINKEDIN", "THREADS"]  # Default platforms
                    
            except Exception as e:
                logger.warning(f"Could not fetch integrations from database: {e}")
                # Fallback to default platforms
                platforms = ["X", "INSTAGRAM", "FACEBOOK", "LINKEDIN"]
            
            # Generate copy for the article (in a real implementation, this might use AI)
            copy = f"Check out our latest article: {article['headline']}"
            if article.get("sourceLink"):
                copy += f" {article['sourceLink']}"
            
            # Post to each platform
            tasks = []
            for platform in platforms:
                task = self.post_article_to_platform(article_id, platform, copy)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle any exceptions
            handled_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Error posting to {platforms[i]}: {str(result)}")
                    handled_results.append({
                        "platform": platforms[i],
                        "status": "FAILED",
                        "error": str(result),
                        "publishedAt": None
                    })
                else:
                    handled_results.append(result)
            
            return handled_results
            
        except Exception as e:
            logger.error(f"Error in post_everywhere for article {article_id}: {str(e)}")
            raise
    
    async def _get_article_by_id(self, article_id: str) -> dict:
        """Get an article by its ID"""
        async with self.db_pool.acquire() as connection:
            row = await connection.fetchrow("""
                SELECT * from "Article" where id = $1
            """, article_id)
            return dict(row) if row else None
    
    async def _get_integrations(self) -> List[str]:
        """Get enabled integrations from the database"""
        async with self.db_pool.acquire() as connection:
            rows = await connection.fetch("""
                SELECT "provider" from "Integration"
                where enabled = true
            """)
            return [row["provider"] for row in rows]