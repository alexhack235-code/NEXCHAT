"""
NEXIUM Web Studio API Router.
Exposes endpoints to generate, preview, and download complete modern websites and web apps.
"""

from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

try:
    from ..web_factory import web_factory, COLOR_THEMES
except ImportError:
    from web_factory import web_factory, COLOR_THEMES

router = APIRouter(prefix="/web", tags=["web_studio"])

class GenerateSiteRequest(BaseModel):
    title: str = Field(default="NEXIUM AI", description="Title or brand name of the website")
    template: str = Field(default="saas_landing", description="Website blueprint archetype")
    theme: str = Field(default="cyber_violet", description="Color palette key")
    tagline: Optional[str] = Field(default=None, description="Custom subtitle or brand pitch")

@router.get("/templates")
async def get_templates() -> Dict[str, Any]:
    """
    Returns available website design archetypes and descriptions.
    """
    return {
        "status": "online",
        "templates": web_factory.get_templates()
    }

@router.get("/themes")
async def get_themes() -> Dict[str, Any]:
    """
    Returns supported modern color palettes.
    """
    return {
        "status": "online",
        "themes": COLOR_THEMES
    }

@router.post("/generate")
async def generate_website(req: GenerateSiteRequest) -> Dict[str, Any]:
    """
    Synthesizes and packages a complete, responsive modern website.
    """
    try:
        site_meta = web_factory.generate_website(
            title=req.title,
            template_key=req.template,
            theme_key=req.theme,
            custom_tagline=req.tagline
        )
        return {
            "status": "success",
            "site": site_meta
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preview/{site_id}", response_class=HTMLResponse)
async def preview_website(site_id: str):
    """
    Renders raw HTML of the synthesized website for direct browser viewing or <iframe> embedding.
    """
    html_content = web_factory.get_site_html(site_id)
    if not html_content:
        raise HTTPException(status_code=404, detail="Website not found")
    return HTMLResponse(content=html_content, status_code=200)

@router.get("/sites")
async def list_generated_sites() -> Dict[str, Any]:
    """
    Lists recently generated websites.
    """
    sites = [
        {
            "id": s["id"],
            "title": s["title"],
            "template": s["template"],
            "theme": s["theme"],
            "preview_url": s["preview_url"],
            "created_at": s["created_at"]
        }
        for s in web_factory.generated_sites.values()
    ]
    return {
        "status": "online",
        "total": len(sites),
        "sites": sites
    }
