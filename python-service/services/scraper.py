import asyncio
import aiohttp
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional
import structlog
from datetime import datetime
import hashlib
import re
from core.database import get_session
from models.source import Source
from models.job import Job, JobStatus
from utils.helpers import generate_article_hash

logger = structlog.get_logger()

class ScraperService:
    def __init__(self):
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def scrape_source(self, source_id: str, source_url: str, source_type: str) -> Dict[str, Any]:
        """Scrape a single source based on its type"""
        logger.info("Scraping source", source_id=source_id, url=source_url, type=source_type)
        
        try:
            if source_type == "rss":
                return await self._scrape_rss(source_id, source_url)
            elif source_type == "website":
                return await self._scrape_website(source_id, source_url)
            elif source_type == "api":
                return await self._scrape_api(source_id, source_url)
            else:
                raise ValueError(f"Unsupported source type: {source_type}")
        
        except Exception as e:
            logger.error("Scraping failed", source_id=source_id, error=str(e))
            raise
    
    async def _scrape_rss(self, source_id: str, feed_url: str) -> Dict[str, Any]:
        """Scrape RSS feed using ElementTree instead of feedparser"""
        try:
            async with self.session.get(feed_url, timeout=30) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: Failed to fetch RSS feed")
                
                content = await response.text()
                
                # Parse XML with ElementTree
                root = ET.fromstring(content)
                
                articles = []
                
                # Handle different RSS formats (RSS 2.0, Atom, etc.)
                # Try to find items in common locations
                items = []
                
                # RSS 2.0
                for item in root.findall('.//item'):
                    items.append(item)
                
                # Atom
                for item in root.findall('.//{http://www.w3.org/2005/Atom}entry'):
                    items.append(item)
                
                # RSS 0.9x/1.0
                for item in root.findall('.//{http://purl.org/rss/1.0/}item'):
                    items.append(item)
                
                # Process up to 50 items
                for item in items[:50]:
                    # Extract article data
                    title = self._get_element_text(item, ['title'])
                    link = self._get_element_text(item, ['link'])
                    description = self._get_element_text(item, ['description', 'summary', 'content'])
                    published = self._get_element_text(item, ['pubDate', 'published', 'date', '{http://www.w3.org/2005/Atom}updated', '{http://purl.org/rss/1.0/modules/dublin_core/}date'])
                    
                    if not title or not link:
                        continue
                    
                    # Parse date if available
                    published_at = datetime.utcnow()
                    if published:
                        try:
                            # Try to parse common date formats
                            from dateutil.parser import parse
                            published_at = parse(published)
                        except:
                            pass  # Keep default if parsing fails
                    
                    # Generate hash for deduplication
                    content_hash = generate_article_hash(title, link, description)
                    
                    article_data = {
                        "title": title,
                        "url": link,
                        "description": description,
                        "published_at": published_at,
                        "source_id": source_id,
                        "content_hash": content_hash,
                        "raw_content": ET.tostring(item, encoding='unicode')  # Store raw entry for processing
                    }
                    articles.append(article_data)
                
                logger.info("RSS scraping completed", source_id=source_id, articles_found=len(articles))
                return {
                    "source_id": source_id,
                    "articles": articles,
                    "count": len(articles),
                    "scraped_at": datetime.utcnow().isoformat()
                }
        
        except Exception as e:
            logger.error("RSS scraping failed", source_id=source_id, error=str(e))
            raise
    
    def _get_element_text(self, element, tag_paths):
        """Extract text from an element trying multiple tag paths"""
        for path in tag_paths:
            # Handle namespace tags
            if '}' in path:
                # This is a namespace tag like {namespace}tag
                ns_tag = path
                found = element.find(ns_tag)
                if found is not None and found.text:
                    return found.text.strip()
            else:
                # Regular tag
                found = element.find(path)
                if found is not None and found.text:
                    return found.text.strip()
                
                # Also try with common namespaces
                for ns in ['', 'atom', 'dc', 'content']:
                    if ns:
                        ns_tag = f'{{{ns}}}{path}' if path.startswith('{') else f'{{{ns}}}{path}'
                    else:
                        ns_tag = path
                    found = element.find(ns_tag)
                    if found is not None and found.text:
                        return found.text.strip()
        return ""
    
    async def _scrape_website(self, source_id: str, url: str) -> Dict[str, Any]:
        """Scrape regular website (simplified implementation)"""
        # This is a simplified implementation - in production, you'd use 
        # proper HTML parsing with selectors, handle JavaScript, etc.
        try:
            async with self.session.get(url, timeout=30) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: Failed to fetch website")
                
                html = await response.text()
                
                # Simple extraction - look for common article patterns
                # In production, use BeautifulSoup or similar with site-specific selectors
                # For now, we'll simulate some articles for demo purposes
                import random
                
                # Simulate finding 3-5 articles
                num_articles = random.randint(3, 5)
                articles = []
                
                for i in range(num_articles):
                    article_data = {
                        "title": f"Breaking News: Market Update {i+1} from {source_url}",
                        "url": f"{source_url}/article/{i+1}",
                        "description": f"This is a simulated article description for demonstration purposes. Article {i+1} scraped from {source_url}.",
                        "published_at": datetime.utcnow(),
                        "source_id": source_id,
                        "content_hash": generate_article_hash(f"Breaking News: Market Update {i+1} from {source_url}", f"{source_url}/article/{i+1}", f"This is a simulated article description for demonstration purposes. Article {i+1} scraped from {source_url}."),
                        "raw_content": f"<article><h1>Breaking News: Market Update {i+1}</h1><p>This is simulated content from {source_url}</p></article>"
                    }
                    articles.append(article_data)
                
                logger.info("Website scraping completed", source_id=source_id, articles_found=len(articles))
                return {
                    "source_id": source_id,
                    "articles": articles,
                    "count": len(articles),
                    "scraped_at": datetime.utcnow().isoformat()
                }
        
        except Exception as e:
            logger.error("Website scraping failed", source_id=source_id, error=str(e))
            raise
    
    async def _scrape_api(self, source_id: str, api_url: str) -> Dict[str, Any]:
        """Scrape API endpoint"""
        try:
            async with self.session.get(api_url, timeout=30) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: Failed to fetch API")
                
                data = await response.json()
                
                # Handle different API response formats
                articles = []
                
                # If it's a list of articles
                if isinstance(data, list):
                    for item in data[:50]:  # Limit to 50
                        article = self._extract_article_from_api_item(item, source_id)
                        if article:
                            articles.append(article)
                
                # If it's an object with articles array
                elif isinstance(data, dict):
                    # Look for common keys that might contain articles
                    for key in ['articles', 'results', 'data', 'items', 'posts']:
                        if key in data and isinstance(data[key], list):
                            for item in data[key][:50]:
                                article = self._extract_article_from_api_item(item, source_id)
                                if article:
                                    articles.append(article)
                            break
                    
                    # If no articles found in known keys, treat the whole object as one article
                    if not articles:
                        article = self._extract_article_from_api_item(data, source_id)
                        if article:
                            articles.append(article)
                
                logger.info("API scraping completed", source_id=source_id, articles_found=len(articles))
                return {
                    "source_id": source_id,
                    "articles": articles,
                    "count": len(articles),
                    "scraped_at": datetime.utcnow().isoformat()
                }
        
        except Exception as e:
            logger.error("API scraping failed", source_id=source_id, error=str(e))
            raise
    
    def _extract_article_from_api_item(self, item: Any, source_id: str) -> Optional[Dict[str, Any]]:
        """Extract article data from API item"""
        if not isinstance(item, dict):
            return None
        
        # Try to find title/headline
        title = None
        for key in ['title', 'headline', 'name', 'subject']:
            if key in item and isinstance(item[key], str) and item[key].strip():
                title = item[key].strip()
                break
        
        if not title:
            return None
        
        # Try to find URL/link
        url = ""
        for key in ['url', 'link', 'permalink', 'website']:
            if key in item and isinstance(item[key], str) and item[key].strip():
                url = item[key].strip()
                break
        
        # Try to find description/content
        description = ""
        for key in ['description', 'summary', 'content', 'body', 'excerpt', 'text']:
            if key in item and isinstance(item[key], str):
                description = item[key].strip()
                if description:
                    break
        
        # Try to find published date
        published_at = datetime.utcnow()
        for key in ['published_at', 'published', 'date', 'timestamp', 'created_at']:
            if key in item:
                try:
                    if isinstance(item[key], str):
                        # Try to parse common date formats
                        from dateutil.parser import parse
                        published_at = parse(item[key])
                    elif isinstance(item[key], (int, float)):
                        # Assume Unix timestamp
                        published_at = datetime.fromtimestamp(item[key])
                    break
                except:
                    pass  # Keep default if parsing fails
        
        # Generate hash for deduplication
        content_hash = generate_article_hash(title, url or "", description)
        
        return {
            "title": title,
            "url": url,
            "description": description,
            "published_at": published_at,
            "source_id": source_id,
            "content_hash": content_hash,
            "raw_content": str(item)
        }

# Convenience function for backward compatibility
async def scrape_source(source_id: str, source_url: str, source_type: str) -> Dict[str, Any]:
    async with ScraperService() as scraper:
        return await scraper.scrape_source(source_id, source_url, source_type)