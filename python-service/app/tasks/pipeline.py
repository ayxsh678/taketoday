import asyncio
import logging
import json
import os
import time
from typing import List, Dict, Any, Optional
from datetime import datetime
import re

logger = logging.getLogger(__name__)

# Import template generator
from .templates import TemplateGenerator

class Pipeline:
    def __init__(self, db_pool, gemini_client):
        self.db_pool = db_pool
        self.gemini = gemini_client  # This is the configured genai module
        # Initialize Gemini models
        self.fast_model = self.gemini.GenerativeModel('gemini-2.5-flash')
        self.pro_model = self.gemini.GenerativeModel('gemini-2.5-pro')
        
        # Trusted categories for auto-pipeline
        self.TRUSTED_CATEGORIES = {"Finance", "Sports", "Health", "Business", "Technology"}
        
        # Initialize template generator
        template_dir = os.path.join(os.path.dirname(__file__), 'templates')
        self.template_generator = TemplateGenerator(template_dir)
        
        # Retry configuration
        self.max_retries = 3
        self.retry_delay = 1  # seconds
    
    async def process_article(self, article_data: Dict[str, Any], source: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single article through the pipeline:
        1. Generate headline and caption using Gemini
        2. Save to database with appropriate status based on source trust
        3. Generate deliverables (HTML article, social post, newsletter)
        """
        try:
            # Generate headline and caption using Gemini
            headline = await self._generate_headline(article_data)
            caption = await self._generate_caption(article_data)
            
            # Determine if source is trusted
            trusted_categories = source.get("trustedCategories", [])
            if not isinstance(trusted_categories, list):
                trusted_categories = []
            
            source_trusted_cats = set(trusted_categories)
            is_trusted = bool(source_trusted_cats & self.TRUSTED_CATEGORIES)
            
            # Set status based on trust
            if is_trusted:
                status = "READY_FOR_PUBLISHING"
                logger.info(
                    f"Article from trusted source set to READY_FOR_PUBLISHING - Headline: {headline} - Source: {source.get('name')} - Categories: {list(source_trusted_cats & self.TRUSTED_CATEGORIES)}"
                )
            else:
                status = "PENDING"
                logger.info(
                    f"Article from non-trusted source set to PENDING for manual review - Headline: {headline} - Source: {source.get('name')}"
                )
            
            # Prepare article for database
            db_article = {
                "headline": headline,
                "subheadline": article_data.get("subheadline", ""),
                "slug": self._generate_slug(headline),
                "body": article_data.get("content", ""),
                "sourceLink": article_data.get("url"),
                "authorId": await self._get_default_author_id(),
                "captions": json.dumps({"main": caption}),
                "publishLogs": json.dumps([]),
                "status": status
            }
            
            # Save to database
            article = await self._create_article(db_article)
            
            # Generate deliverables for the article
            deliverables = await self.generate_deliverables(article["id"])
            
            return {
                "id": article["id"],
                "headline": article["headline"],
                "status": article["status"],
                "trusted_source": is_trusted,
                "categories_matched": list(source_trusted_cats & self.TRUSTED_CATEGORIES) if is_trusted else [],
                "deliverables_generated": list(deliverables.keys()) if deliverables else []
            }
            
        except Exception as e:
            logger.error("Error processing article: %s - Article: %s - Source: %s", 
                         str(e), 
                         article_data.get('title', 'Unknown'), 
                         source.get('name', 'Unknown'))
            raise
    
    async def _create_article(self, article_data: dict) -> dict:
        """Create a new article in the database"""
        async with self.db_pool.acquire() as connection:
            row = await connection.fetchrow("""
                INSERT INTO "Article" (
                    "headline", "subheadline", "slug", "body", "featuredImageId", 
                    "sourceLink", "authorId", "status", "language", "location", 
                    "breaking", "priorityScore", "seoTitle", "seoDescription", 
                    "metaKeywords", "canonicalUrl", "scheduledAt", "publishedAt", 
                    "captions", "publishLogs", "createdAt", "updatedAt", "sourceId"
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
                ) RETURNING *
            """, 
                article_data.get("headline"),
                article_data.get("subheadline", ""),
                article_data.get("slug"),
                article_data.get("body", ""),
                article_data.get("featuredImageId"),
                article_data.get("sourceLink"),
                article_data.get("authorId"),
                article_data.get("status", "DRAFT"),
                article_data.get("language", "en"),
                article_data.get("location"),
                article_data.get("breaking", False),
                article_data.get("priorityScore", 50),
                article_data.get("seoTitle"),
                article_data.get("seoDescription"),
                article_data.get("metaKeywords", []),
                article_data.get("canonicalUrl"),
                article_data.get("scheduledAt"),
                article_data.get("publishedAt"),
                article_data.get("captions"),
                article_data.get("publishLogs"),
                datetime.utcnow(),
                datetime.utcnow(),
                article_data.get("sourceId")
            )
            return dict(row)
    
    async def _generate_headline(self, article_data: Dict[str, Any]) -> str:
        """Generate headline using Gemini 2.5 Flash with retry logic"""
        # Truncate content to avoid token limits
        content = article_data.get('content', '')[:1000]
        
        prompt = f"""
        Generate a compelling news headline for the following content:
        {content}
        
        Headline should be concise, engaging, and suitable for a news article.
        Maximum 100 characters.
        """
        
        # Retry logic for AI calls
        for attempt in range(self.max_retries):
            try:
                # Use Gemini 2.5 Flash for fast tasks like headline generation
                response = self.fast_model.generate_content(prompt)
                headline = response.text.strip()
                
                # Ensure it's not too long
                if len(headline) > 100:
                    headline = headline[:97] + "..."
                    
                return headline
            except Exception as e:
                logger.warning("Attempt %d failed for headline generation: %s - Article: %s", 
                               attempt + 1, str(e), article_data.get('title', 'Unknown'))
                if attempt < self.max_retries - 1:
                    # Wait before retrying
                    await asyncio.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff
                else:
                    logger.error("All attempts failed for headline generation: %s", str(e))
                    # Fallback to template-based approach
                    title = article_data.get('title', 'News Update')
                    if len(title) > 100:
                        title = title[:97] + "..."
                    
                    # Add some variation to make it more "news-like"
                    prefixes = ["Breaking:", "Update:", "Report:", "Analysis:"]
                    import random
                    prefix = random.choice(prefixes) if random.random() > 0.5 else ""
                    
                    headline = f"{prefix} {title}".strip()
                    if len(headline) > 100:
                        headline = headline[:97] + "..."
                        
                    return headline
    
    async def _generate_caption(self, article_data: Dict[str, Any]) -> str:
        """Generate caption/summary using Gemini 2.5 Flash with retry logic"""
        # Truncate content to avoid token limits
        content = article_data.get('content', '')[:1500]
        
        prompt = f"""
        Generate a concise summary (2-3 sentences) for the following article:
        {content}
        
        The summary should be engaging and suitable for social media.
        Maximum 300 characters.
        """
        
        # Retry logic for AI calls
        for attempt in range(self.max_retries):
            try:
                # Use Gemini 2.5 Flash for caption generation
                response = self.fast_model.generate_content(prompt)
                caption = response.text.strip()
                
                # Ensure it's not too long
                if len(caption) > 300:
                    caption = caption[:297] + '...'
                    
                return caption
            except Exception as e:
                logger.warning("Attempt %d failed for caption generation: %s - Article: %s", 
                               attempt + 1, str(e), article_data.get('title', 'Unknown'))
                if attempt < self.max_retries - 1:
                    # Wait before retrying
                    await asyncio.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff
                else:
                    logger.error("All attempts failed for caption generation: %s", str(e))
                    # Fallback to extractive approach
                    content = article_data.get('content', '')
                    if not content:
                        return "No content available"
                    
                    # Simple extraction of first 2-3 sentences
                    sentences = re.split(r'[.!?]+', content)
                    sentences = [s.strip() for s in sentences if s.strip()]
                    
                    if len(sentences) >= 3:
                        caption = '. '.join(sentences[:3]) + '.'
                    elif len(sentences) == 2:
                        caption = '. '.join(sentences) + '.'
                    elif len(sentences) == 1:
                        caption = sentences[0] + '.'
                    else:
                        caption = content[:200] + '...' if len(content) > 200 else content
                    
                    # Ensure it's not too long
                    if len(caption) > 300:
                        caption = caption[:297] + '...'
                        
                    return caption
    
    def _generate_slug(self, headline: str) -> str:
        """Generate a URL-friendly slug from headline"""
        slug = headline.lower()
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'[\s-]+', '-', slug)
        slug = slug.strip('-')
        return slug[:50]  # Limit length
    
    async def _get_default_author_id(self) -> str:
        """Get a default author ID for automated articles"""
        try:
            # Try to find an admin user to use as default author
            async with self.db_pool.acquire() as connection:
                row = await connection.fetchrow("""
                    SELECT id from "AdminUser"
                    where role = $1
                    limit 1
                """, "EDITOR")
                if row:
                    return row["id"]
                else:
                    # Fallback to first admin user
                    row = await connection.fetchrow("""
                        SELECT id from "AdminUser"
                        limit 1
                    """)
                    if row:
                        return row["id"]
                    else:
                        # Last resort: return a placeholder
                        return "00000000-0000-0000-0000-000000000000"  # Placeholder UUID
        except Exception as e:
            logger.error(f"Error getting default author: {str(e)}")
            return "00000000-0000-0000-0000-000000000000"  # Placeholder UUID

    async def generate_deliverables(self, article_id: str) -> Dict[str, str]:
        """
        Generate deliverables for an article (HTML article, social posts, newsletter)
        Returns a dictionary with deliverable types as keys and content as values
        """
        try:
            # Get the article from database
            article = await self.get_article_by_id(article_id)
            if not article:
                raise ValueError(f"Article not found: {article_id}")
            
            # Prepare article data for templates
            article_data = {
                "headline": article.get("headline", ""),
                "body": article.get("body", ""),
                "seoDescription": article.get("seoDescription", ""),
                "featuredImageUrl": article.get("featuredImageUrl", ""),
                "publishedAt": article.get("publishedAt", datetime.utcnow()),
                "sourceName": article.get("sourceName", ""),
                "authorName": article.get("authorName", ""),
                "sourceLink": article.get("sourceLink", ""),
                "caption": json.loads(article.get("captions", "{}")).get("main", ""),
                "categories": []  # Would need to get from related tables in a real implementation
            }
            
            # Generate different deliverables
            deliverables = {}
            
            # HTML article
            deliverables["article_html"] = self.template_generator.generate_article_deliverable(article_data)
            
            # Social media post
            deliverables["social_post"] = self.template_generator.generate_social_post(article_data)
            
            # For newsletter, we'd need multiple articles - this is just a single article example
            # In a real implementation, you'd pass a list of articles
            deliverables["newsletter_html"] = self.template_generator.generate_newsletter(
                [article_data], 
                newsletter_title="TakeToday Daily",
                newsletter_subtitle="Your daily briefing"
            )
            
            return deliverables
            
        except Exception as e:
            logger.error(f"Error generating deliverables for article {article_id}: {str(e)}")
            # Return empty dict on error, but don't fail the whole pipeline
            return {}

    async def get_article_by_id(self, article_id: str) -> Optional[Dict[str, Any]]:
        """Get an article by its ID"""
        try:
            async with self.db_pool.acquire() as connection:
                row = await connection.fetchrow("""
                    SELECT * from "Article" where id = $1
                """, article_id)
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error getting article by ID {article_id}: {str(e)}")
            return None