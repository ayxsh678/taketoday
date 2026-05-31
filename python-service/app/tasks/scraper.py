import asyncio
import logging
import aiohttp
import feedparser
from typing import List, Dict, Any
from datetime import datetime
import hashlib
import re
from bs4 import BeautifulSoup
from core.ssrf import validate_url

logger = logging.getLogger(__name__)

# Per-request limits [SEC-09]
_REQUEST_TIMEOUT = aiohttp.ClientTimeout(total=10, connect=5)
_MAX_RESPONSE_BYTES = 10 * 1024 * 1024  # 10 MB

class Scraper:
    def __init__(self):
        self.session = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        if self.session is None or self.session.closed:
            # ttl_dns_cache=0: disable DNS caching to reduce DNS-rebinding window
            connector = aiohttp.TCPConnector(ttl_dns_cache=0)
            self.session = aiohttp.ClientSession(
                connector=connector,
                timeout=_REQUEST_TIMEOUT,
            )
        return self.session
    
    async def close(self):
        if self.session:
            await self.session.close()
    
    async def scrape_source(self, source_url: str, source_type: str) -> List[Dict[str, Any]]:
        """
        Scrape articles from a source based on its type.
        Returns list of article dictionaries.
        """
        # SSRF guard: validate URL before any network access [SEC-09]
        ssrf_error = validate_url(source_url)
        if ssrf_error:
            logger.warning(f"Blocked fetch of '{source_url}': {ssrf_error}")
            return []

        try:
            if source_type == "rss":
                return await self._scrape_rss(source_url)
            elif source_type == "website":
                return await self._scrape_website(source_url)
            elif source_type == "api":
                return await self._scrape_api(source_url)
            else:
                logger.warning(f"Unknown source type: {source_type}")
                return []
        except aiohttp.ServerTimeoutError:
            logger.error(f"Timeout scraping {source_url}")
            return []
        except Exception as e:
            logger.error(f"Error scraping {source_url}: {str(e)}")
            return []
    
    async def _read_bounded(self, response: aiohttp.ClientResponse) -> bytes:
        """Read a response body up to _MAX_RESPONSE_BYTES; raise if exceeded."""
        data = await response.content.read(_MAX_RESPONSE_BYTES + 1)
        if len(data) > _MAX_RESPONSE_BYTES:
            raise ValueError(
                f"Response exceeds size limit ({_MAX_RESPONSE_BYTES // (1024 * 1024)} MB)"
            )
        return data

    async def _scrape_rss(self, url: str) -> List[Dict[str, Any]]:
        """Scrape articles from RSS feed"""
        try:
            session = await self._get_session()
            async with session.get(url) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch RSS feed {url}: {response.status}")
                    return []

                raw = await self._read_bounded(response)
                content = raw.decode(errors="replace")
                feed = feedparser.parse(content)
                
                articles = []
                for entry in feed.entries[:10]:  # Limit to 10 articles per feed
                    article = {
                        "title": entry.get("title", ""),
                        "content": entry.get("summary", entry.get("description", "")),
                        "url": entry.get("link", ""),
                        "published_at": entry.get("published", datetime.utcnow().isoformat()),
                        "hash": self._generate_hash(f"{url}_{entry.get('id', entry.get('link', ''))}")
                    }
                    articles.append(article)
                
                logger.info(f"Scraped {len(articles)} articles from RSS feed {url}")
                return articles
        except Exception as e:
            logger.error(f"Error scraping RSS {url}: {str(e)}")
            return []
    
    async def _scrape_website(self, url: str) -> List[Dict[str, Any]]:
        """Scrape articles from website (simplified)"""
        try:
            session = await self._get_session()
            async with session.get(url) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch website {url}: {response.status}")
                    return []

                raw = await self._read_bounded(response)
                html = raw.decode(errors="replace")
                soup = BeautifulSoup(html, 'html.parser')
                
                # Look for common article patterns
                articles = []
                
                # Try to find article elements
                article_selectors = [
                    'article',
                    '.article',
                    '.post',
                    '.entry',
                    '[role="article"]'
                ]
                
                for selector in article_selectors:
                    elements = soup.select(selector)
                    for element in elements[:5]:  # Limit to 5 per selector
                        title_elem = element.find(['h1', 'h2', 'h3', 'h4']) or element.find(class_=re.compile('title|headline'))
                        content_elem = element.find(class_=re.compile('content|summary|body|entry-content'))
                        
                        title = title_elem.get_text(strip=True) if title_elem else "Untitled"
                        content = content_elem.get_text(strip=True) if content_elem else ""
                        
                        if title and len(title) > 5:  # Basic validation
                            article = {
                                "title": title,
                                "content": content[:500],  # Limit content length
                                "url": url,
                                "published_at": datetime.utcnow().isoformat(),
                                "hash": self._generate_hash(f"{url}_{title}_{datetime.utcnow().date()}")
                            }
                            articles.append(article)
                
                # If no articles found with selectors, try a fallback
                if not articles:
                    # Look for heading elements that might be article titles
                    headings = soup.find_all(['h1', 'h2', 'h3'])
                    for heading in headings[:5]:
                        title = heading.get_text(strip=True)
                        if title and len(title) > 10:
                            # Try to find associated content
                            content_elem = heading.find_next(['p', 'div'])
                            content = content_elem.get_text(strip=True) if content_elem else ""
                            
                            article = {
                                "title": title,
                                "content": content[:500],
                                "url": url,
                                "published_at": datetime.utcnow().isoformat(),
                                "hash": self._generate_hash(f"{url}_{title}_{datetime.utcnow().date()}")
                            }
                            articles.append(article)
                
                logger.info(f"Scraped {len(articles)} articles from website {url}")
                return articles
        except Exception as e:
            logger.error(f"Error scraping website {url}: {str(e)}")
            return []
    
    async def _scrape_api(self, url: str) -> List[Dict[str, Any]]:
        """Scrape articles from API endpoint"""
        try:
            session = await self._get_session()
            async with session.get(url) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch API {url}: {response.status}")
                    return []

                import json as _json
                raw = await self._read_bounded(response)
                data = _json.loads(raw)
                
                # Handle common API response formats
                articles = []
                
                # If data is a list
                if isinstance(data, list):
                    for item in data[:10]:  # Limit to 10
                        article = self._extract_article_from_api_item(item)
                        if article:
                            articles.append(article)
                # If data is an object with articles list
                elif isinstance(data, dict):
                    # Look for common keys that might contain articles
                    article_keys = ['articles', 'results', 'data', 'items', 'posts']
                    for key in article_keys:
                        if key in data and isinstance(data[key], list):
                            for item in data[key][:10]:
                                article = self._extract_article_from_api_item(item)
                                if article:
                                    articles.append(article)
                            break
                    # If no articles found in known keys, try the root object
                    if not articles:
                        article = self._extract_article_from_api_item(data)
                        if article:
                            articles.append(article)
                
                logger.info(f"Scraped {len(articles)} articles from API {url}")
                return articles
        except Exception as e:
            logger.error(f"Error scraping API {url}: {str(e)}")
            return []
    
    def _extract_article_from_api_item(self, item: Any) -> Dict[str, Any]:
        """Extract article data from API item"""
        if not isinstance(item, dict):
            return None
        
        # Try to find title and content fields
        title_keys = ['title', 'headline', 'name', 'subject']
        content_keys = ['content', 'body', 'description', 'summary', 'text']
        url_keys = ['url', 'link', 'permalink', 'uri']
        
        title = ""
        content = ""
        article_url = ""
        
        for key in title_keys:
            if key in item and isinstance(item[key], str) and item[key].strip():
                title = item[key].strip()
                break
        
        for key in content_keys:
            if key in item and isinstance(item[key], str) and item[key].strip():
                content = item[key].strip()
                break
        
        for key in url_keys:
            if key in item and isinstance(item[key], str) and item[key].strip():
                article_url = item[key].strip()
                break
        
        if not title:
            return None
        
        # Use provided URL or fall back to a hash-based identifier
        if not article_url:
            article_url = f"api://item/{hash(str(item))}"
        
        return {
            "title": title,
            "content": content,
            "url": article_url,
            "published_at": item.get('published_at', item.get('published', item.get('date', datetime.utcnow().isoformat()))),
            "hash": self._generate_hash(f"{article_url}_{title}_{datetime.utcnow().date()}")
        }
    
    def _generate_hash(self, content: str) -> str:
        """Generate a hash for deduplication"""
        return hashlib.md5(content.encode()).hexdigest()
    
    async def scrape_all_sources(self, sources: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Scrape all active sources
        Returns dictionary mapping source_id to list of articles
        """
        results = {}
        tasks = []
        
        for source in sources:
            if source.get("active", False):
                task = self.scrape_source(source["url"], source["type"])
                tasks.append((source["id"], task))
        
        # Execute scraping tasks concurrently
        for source_id, task in tasks:
            try:
                articles = await task
                results[source_id] = articles
            except Exception as e:
                logger.error(f"Failed to scrape source {source_id}: {str(e)}")
                results[source_id] = []
        
        return results