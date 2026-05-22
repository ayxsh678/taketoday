import jinja2
import os
import json
from typing import Dict, Any, Optional
import structlog
from datetime import datetime
from core.database import get_session
from models.job import Job

logger = structlog.get_logger()

class DeliverableGeneratorService:
    def __init__(self):
        # Set up Jinja2 environment
        template_dir = os.path.join(os.path.dirname(__file__), "..", "templates")
        self.template_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(template_dir),
            autoescape=jinja2.select_autoescape(['html', 'xml'])
        )
        
        # Add custom filters
        self.template_env.filters['date'] = lambda fmt: lambda dt: dt.strftime(fmt) if dt else ''
        self.template_env.filters['currency'] = lambda value: f"${value:,.2f}"
    
    async def generate_deliverable(self, template_name: str, data: Dict[str, Any], format: str = "html") -> Dict[str, Any]:
        """Generate a deliverable using Jinja2 templates"""
        logger.info("Generating deliverable", template=template_name, format=format)
        
        # For now, only support HTML format due to WeasyPrint dependencies
        if format.lower() not in ["html", "txt", "json"]:
            # Default to HTML for unsupported formats
            format = "html"
        
        try:
            # Get template
            template = self.template_env.get_template(f"{template_name}.{format}")
            
            # Prepare data for template
            template_data = {
                "generated_at": datetime.utcnow(),
                "data": data,
                **data  # Also make data properties directly accessible
            }
            
            # Render template
            rendered_content = template.render(**template_data)
            
            result = {
                "content": rendered_content,
                "format": format,
                "template": template_name,
                "generated_at": datetime.utcnow().isoformat(),
                "size_bytes": len(rendered_content.encode('utf-8'))
            }
            
            # Set content type
            if format == "html":
                result["content_type"] = "text/html"
            elif format == "json":
                result["content_type"] = "application/json"
            else:
                result["content_type"] = "text/plain"
            
            logger.info("Deliverable generated successfully", size=result["size_bytes"])
            return result
        
        except jinja2.TemplateNotFound:
            logger.error("Template not found", template=template_name)
            raise Exception(f"Template '{template_name}' not found")
        except Exception as e:
            logger.error("Failed to generate deliverable", error=str(e))
            raise

# Convenience function for backward compatibility
async def generate_deliverable(template_name: str, data: Dict[str, Any], format: str = "html") -> Dict[str, Any]:
    generator = DeliverableGeneratorService()
    return await generator.generate_deliverable(template_name, data, format)