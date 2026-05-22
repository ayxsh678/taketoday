import hashlib
import re
from typing import List
import structlog

logger = structlog.get_logger()

def generate_article_hash(title: str, url: str, description: str) -> str:
    """
    Generate a unique hash for an article based on title, URL, and description.
    This helps in deduplication.
    """
    # Combine the fields
    combined = f"{title.strip()}{url.strip()}{description.strip()}"
    # Create a SHA256 hash
    return hashlib.sha256(combined.encode('utf-8')).hexdigest()

def clean_text(text: str) -> str:
    """Clean text by removing extra whitespace and normalizing."""
    if not text:
        return ""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
    """
    Simple keyword extraction by removing common words and sorting by frequency.
    In production, you might want to use more sophisticated NLP techniques.
    """
    if not text:
        return []
    
    # Convert to lowercase and split into words
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    
    # Common stop words to remove
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
        'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    }
    
    # Filter out stop words
    words = [word for word in words if word not in stop_words]
    
    # Count word frequency
    word_freq = {}
    for word in words:
        word_freq[word] = word_freq.get(word, 0) + 1
    
    # Sort by frequency and return top keywords
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    return [word for word, freq in sorted_words[:max_keywords]]

def truncate_text(text: str, max_length: int) -> str:
    """Truncate text to max_length and add ellipsis if needed."""
    if not text or len(text) <= max_length:
        return text
    return text[:max_length].rstrip() + "..."

# Convenience function for backward compatibility
def clean_text_backward(text: str) -> str:
    return clean_text(text)