import logging
import json
from jinja2 import Environment, FileSystemLoader, select_autoescape
from typing import Dict, Any, Optional
from datetime import datetime
import os

logger = logging.getLogger(__name__)

class TemplateGenerator:
    def __init__(self, template_dir: str = None):
        if template_dir is None:
            # Default to templates directory relative to this file
            template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
        
        # Ensure template directory exists
        os.makedirs(template_dir, exist_ok=True)
        
        # Set up Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml']),
            trim_blocks=True,
            lstrip_blocks=True
        )
        
        # Create default templates if they don't exist
        self._create_default_templates(template_dir)
    
    def _create_default_templates(self, template_dir: str):
        """Create default deliverable templates if they don't exist"""
        # Article template
        article_template_path = os.path.join(template_dir, 'article.html')
        if not os.path.exists(article_template_path):
            with open(article_template_path, 'w') as f:
                f.write("""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ headline }}</title>
    <meta name="description" content="{{ seo_description }}">
    <meta property="og:title" content="{{ headline }}">
    <meta property="og:description" content="{{ seo_description }}">
    <meta property="og:image" content="{{ featured_image_url or '' }}">
    <meta property="og:type" content="article">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ headline }}">
    <meta name="twitter:description" content="{{ seo_description }}">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        .meta { color: #7f8c8d; font-size: 0.9em; margin-bottom: 20px; }
        .content { font-size: 1.1em; }
        img { max-width: 100%; height: auto; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #95a5a6; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>{{ headline }}</h1>
    <div class="meta">
        Published on {{ published_at.strftime('%B %d, %Y at %I:%M %p') }} 
        {% if source_name %} | Source: {{ source_name }}{% endif %}
        {% if author_name %} | By: {{ author_name }}{% endif %}
    </div>
    
    {% if featured_image_url %}
    <div>
        <img src="{{ featured_image_url }}" alt="{{ headline }}">
    </div>
    {% endif %}
    
    <div class="content">
        {{ body|safe }}
    </div>
    
    <div class="footer">
        © {{ published_at.year }} TakeToday. All rights reserved.
    </div>
</body>
</html>""")
        
        # Social media post template
        social_template_path = os.path.join(template_dir, 'social_post.txt')
        if not os.path.exists(social_template_path):
            with open(social_template_path, 'w') as f:
                f.write("""{{ headline }}

{{ caption }}

{{ source_link }}

#{{ categories|join(' #') }}""")
        
        # Newsletter template
        newsletter_template_path = os.path.join(template_dir, 'newsletter.html')
        if not os.path.exists(newsletter_template_path):
            with open(newsletter_template_path, 'w') as f:
                f.write("""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ newsletter_title }}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #ecf0f1; }
        .header h1 { color: #2c3e50; margin: 0; }
        .article { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        .article h2 { color: #3498db; margin-top: 0; }
        .article .meta { color: #7f8c8d; font-size: 0.9em; margin-bottom: 15px; }
        .article .content { font-size: 1.05em; }
        .article img { max-width: 100%; height: auto; border-radius: 4px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #95a5a6; font-size: 0.9em; }
        .button { display: inline-block; background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ newsletter_title }}</h1>
            <p>{{ newsletter_subtitle }}</p>
        </div>
        
        {% for article in articles %}
        <div class="article">
            {% if article.featured_image_url %}
            <div>
                <img src="{{ article.featured_image_url }}" alt="{{ article.headline }}">
            </div>
            {% endif %}
            
            <h2>{{ article.headline }}</h2>
            <div class="meta">
                {{ article.published_at.strftime('%B %d, %Y') }} 
                {% if article.source_name %} | {{ article.source_name }}{% endif %}
            </div>
            
            <div class="content">
                {{ article.summary|safe }}
            </div>
            
            {% if article.source_link %}
            <a href="{{ article.source_link }}" class="button">Read Full Article</a>
            {% endif %}
        </div>
        {% endfor %}
        
        <div class="footer">
            <p>You're receiving this email because you subscribed to TakeToday updates.</p>
            <p><a href="{{ unsubscribe_url }}">Unsubscribe</a></p>
            <p>© {{ current_year }} TakeToday. All rights reserved.</p>
        </div>
    </div>
</body>
</html>""")
    
    def generate_article_deliverable(self, article_data: Dict[str, Any]) -> str:
        """Generate HTML deliverable for an article"""
        try:
            template = self.env.get_template('article.html')
            
            # Prepare template data
            template_data = {
                'headline': article_data.get('headline', ''),
                'body': article_data.get('body', ''),
                'seo_description': article_data.get('seoDescription', ''),
                'featured_image_url': article_data.get('featuredImageUrl', ''),
                'published_at': article_data.get('publishedAt', datetime.utcnow()),
                'source_name': article_data.get('sourceName', ''),
                'author_name': article_data.get('authorName', '')
            }
            
            return template.render(**template_data)
        except Exception as e:
            logger.error(f"Error generating article deliverable: {str(e)}")
            raise
    
    def generate_social_post(self, article_data: Dict[str, Any], platform: str = None) -> str:
        """Generate social media post copy"""
        try:
            template = self.env.get_template('social_post.txt')
            
            # Prepare template data
            template_data = {
                'headline': article_data.get('headline', ''),
                'caption': article_data.get('caption', ''),
                'source_link': article_data.get('sourceLink', ''),
                'categories': article_data.get('categories', []),
                'platform': platform
            }
            
            return template.render(**template_data)
        except Exception as e:
            logger.error(f"Error generating social post: {str(e)}")
            raise
    
    def generate_newsletter(self, articles_data: list, newsletter_title: str = "TakeToday Daily", 
                          newsletter_subtitle: str = "Your daily briefing", 
                          unsubscribe_url: str = "#") -> str:
        """Generate HTML newsletter"""
        try:
            template = self.env.get_template('newsletter.html')
            
            # Prepare template data
            template_data = {
                'newsletter_title': newsletter_title,
                'newsletter_subtitle': newsletter_subtitle,
                'articles': articles_data,
                'unsubscribe_url': unsubscribe_url,
                'current_year': datetime.utcnow().year
            }
            
            return template.render(**template_data)
        except Exception as e:
            logger.error(f"Error generating newsletter: {str(e)}")
            raise
    
    def generate_deliverable(self, template_name: str, data: Dict[str, Any]) -> str:
        """Generic method to generate deliverable from any template"""
        try:
            template = self.env.get_template(template_name)
            return template.render(**data)
        except Exception as e:
            logger.error(f"Error generating deliverable from template {template_name}: {str(e)}")
            raise