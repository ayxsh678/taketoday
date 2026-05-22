import google.generativeai as genai
import structlog
import os
from typing import List, Dict, Any
import json
import re
from datetime import datetime
from core.database import get_session
from models.job import Job
from utils.helpers import clean_text, extract_keywords

logger = structlog.get_logger()

class AIProcessorService:
    def __init__(self):
        # Initialize Gemini API
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        # Use gemini-2.5-flash for fast tasks (headlines, classification, summarization)
        self.fast_model = genai.GenerativeModel('gemini-2.5-flash')
        # Use gemini-2.5-pro for heavy reasoning
        self.pro_model = genai.GenerativeModel('gemini-2.5-pro')
    
    async def process_articles(self, articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process articles with AI: generate summaries, extract keywords, categorize"""
        logger.info("Processing articles with AI", count=len(articles))
        
        processed_articles = []
        for article in articles:
            try:
                processed_article = await self._process_single_article(article)
                processed_articles.append(processed_article)
            except Exception as e:
                logger.error("Failed to process article", article_id=article.get("id"), error=str(e))
                # Keep original article if processing fails
                processed_articles.append(article)
        
        return processed_articles
    
    async def _process_single_article(self, article: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single article with AI enhancements"""
        # Start with original article data
        processed = article.copy()
        
        # Generate summary if we have content
        if article.get("description") or article.get("raw_content"):
            processed["summary"] = await self._generate_summary(article)
        
        # Extract keywords
        processed["keywords"] = await self._extract_keywords(article)
        
        # Categorize content
        processed["category"] = await self._categorize_content(article)
        
        # Detect sentiment
        processed["sentiment"] = await self._detect_sentiment(article)
        
        # Generate hashtags for social media
        processed["hashtags"] = await self._generate_hashtags(article)
        
        processed["processed_at"] = datetime.utcnow().isoformat()
        
        return processed
    
    async def _generate_summary(self, article: Dict[str, Any]) -> str:
        """Generate a concise summary of the article"""
        try:
            # Prepare content for summarization
            content = article.get("description", "")
            if not content and article.get("raw_content"):
                # Extract text from raw content if needed
                content = self._extract_text_from_raw(article["raw_content"])[:1000]
            
            if not content or len(content.strip()) < 50:
                return article.get("description", "No summary available")
            
            prompt = f"""
            Please provide a concise 2-3 sentence summary of the following news article:
            
            Title: {article.get('title', '')}
            Content: {content[:1500]}
            
            Summary should be informative, neutral, and capture the key points.
            """
            
            # Use fast model for summarization
            model = self.fast_model
            response = model.generate_content(prompt)
            return response.text.strip()
        
        except Exception as e:
            logger.warning("Failed to generate summary", error=str(e))
            return article.get("description", "Summary generation failed")
    
    async def _extract_keywords(self, article: Dict[str, Any]) -> List[str]:
        """Extract key keywords from the article"""
        try:
            # Combine title and content for keyword extraction
            text = f"{article.get('title', '')} {article.get('description', '')}"
            
            if not text.strip():
                return []
            
            prompt = f"""
            Extract 5-10 relevant keywords or key phrases from the following text.
            Return only the keywords as a comma-separated list, no explanations.
            
            Text: {text[:1000]}
            """
            
            model = self.fast_model
            response = model.generate_content(prompt)
            
            # Parse comma-separated keywords
            keywords_text = response.text.strip()
            keywords = [k.strip() for k in keywords_text.split(",") if k.strip()]
            return keywords[:10]  # Limit to 10 keywords
        
        except Exception as e:
            logger.warning("Failed to extract keywords", error=str(e))
            return []
    
    async def _categorize_content(self, article: Dict[str, Any]) -> str:
        """Categorize the article into predefined categories"""
        try:
            text = f"{article.get('title', '')} {article.get('description', '')}"
            
            if not text.strip():
                return "general"
            
            prompt = f"""
            Categorize the following news article into ONE of these categories:
            - politics
            - business
            - technology
            - entertainment
            - sports
            - health
            - science
            - world
            - technology
            
            Return only the category name, no explanations.
            
            Title: {article.get('title', '')}
            Content: {text[:1000]}
            """
            
            model = self.fast_model
            response = model.generate_content(prompt)
            
            category = response.text.strip().lower()
            
            # Validate category
            valid_categories = ["politics", "business", "technology", "entertainment", "sports", "health", "science", "world"]
            if category in valid_categories:
                return category
            else:
                return "general"
        
        except Exception as e:
            logger.warning("Failed to categorize content", error=str(e))
            return "general"
    
    async def _detect_sentiment(self, article: Dict[str, Any]) -> str:
        """Detect sentiment of the article"""
        try:
            text = f"{article.get('title', '')} {article.get('description', '')}"
            
            if not text.strip():
                return "neutral"
            
            prompt = f"""
            Analyze the sentiment of the following text and return ONLY one of:
            - positive
            - negative
            - neutral
            
            Text: {text[:500]}
            """
            
            model = self.fast_model
            response = model.generate_content(prompt)
            
            sentiment = response.text.strip().lower()
            
            if sentiment in ["positive", "negative", "neutral"]:
                return sentiment
            else:
                return "neutral"
        
        except Exception as e:
            logger.warning("Failed to detect sentiment", error=str(e))
            return "neutral"
    
    async def _generate_hashtags(self, article: Dict[str, Any]) -> List[str]:
        """Generate hashtags for social media sharing"""
        try:
            text = f"{article.get('title', '')} {article.get('description', '')}"
            
            if not text.strip():
                return ["#News"]
            
            prompt = f"""
            Generate 3-5 relevant hashtags for social media sharing of this news article.
            Return only the hashtags as a space-separated list, each starting with #.
            
            Title: {article.get('title', '')}
            Content: {text[:800]}
            """
            
            model = self.fast_model
            response = model.generate_content(prompt)
            
            # Extract hashtags
            hashtags_text = response.text.strip()
            hashtags = []
            for tag in hashtags_text.split():
                tag = tag.strip()
                if tag.startswith('#'):
                    hashtags.append(tag)
                elif tag:  # If it doesn't start with #, add it
                    hashtags.append(f'#{tag}')
            
            return hashtags[:5]  # Limit to 5 hashtags
        
        except Exception as e:
            logger.warning("Failed to generate hashtags", error=str(e))
            return ["#News"]
    
    def _extract_text_from_raw(self, raw_content: str) -> str:
        """Extract plain text from raw HTML/content"""
        # Simple text extraction - in production use BeautifulSoup
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', raw_content)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    async def generate_headlines(self, articles: List[Dict[str, Any]], count: int = 10) -> List[str]:
        """Generate headline variations for articles"""
        logger.info("Generating headline variations", count=count, articles=len(articles))
        
        if not articles:
            return []
        
        try:
            # Prepare article summaries for headline generation
            article_summaries = []
            for article in articles[:count]:  # Limit to requested count
                summary = f"{article.get('title', '')}: {article.get('description', '')[:100]}"
                article_summaries.append(summary)
            
            prompt = f"""
            Based on the following news article summaries, generate {count} engaging, 
            news-style headlines that would be suitable for publication.
            
            Make them:
            - Clear and informative
            - Engaging but not clickbait
            - Suitable for a professional news outlet
            - Vary in style and focus
            
            Articles:
            {chr(10).join([f"- {summary}" for summary in article_summaries])}
            
            Generate exactly {count} headlines, one per line.
            """
            
            # Use fast model for headline generation
            model = self.fast_model
            response = model.generate_content(prompt)
            
            # Parse headlines (one per line)
            headlines = [line.strip() for line in response.text.split('\n') if line.strip()]
            
            # Ensure we have the requested number
            if len(headlines) < count:
                # Pad with original titles if needed
                for i in range(len(headlines), count):
                    idx = i % len(articles)
                    headlines.append(articles[idx].get('title', f'Headline {i+1}'))
            elif len(headlines) > count:
                headlines = headlines[:count]
            
            return headlines
        
        except Exception as e:
            logger.error("Failed to generate headlines", error=str(e))
            # Fallback to original titles
            return [article.get('title', f'Headline {i+1}') for i, article in enumerate(articles[:count])]

# Convenience function for backward compatibility
async def process_articles(articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    processor = AIProcessorService()
    return await processor.process_articles(articles)

async def generate_headlines(articles: List[Dict[str, Any]], count: int = 10) -> List[str]:
    processor = AIProcessorService()
    return await processor.generate_headlines(articles, count)