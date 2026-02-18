
import logging
import os
from typing import Dict, Any, Optional, List

# Try importing firecrawl, handle if not installed yet (e.g. during CI or before pip install)
try:
    from firecrawl import FirecrawlApp
except ImportError:
    FirecrawlApp = None

logger = logging.getLogger("aris.agent.firecrawl")

class FirecrawlTool:
    """
    A tool wrapper for Firecrawl to perform web scraping and crawling.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("FIRECRAWL_API_KEY")
        if not self.api_key:
            logger.warning("⚠️  FIRECRAWL_API_KEY not found. Firecrawl tool will not work.")
            self.app = None
        elif not FirecrawlApp:
             logger.warning("⚠️  firecrawl-py not installed. Firecrawl tool will not work.")
             self.app = None
        else:
            self.app = FirecrawlApp(api_key=self.api_key)
            logger.info("✅ Firecrawl initialized")

    def scrape_url(self, url: str) -> Dict[str, Any]:
        """
        Scrape a single URL.
        """
        if not self.app:
            return {"error": "Firecrawl is not configured."}
        
        try:
            logger.info(f"🕷️  Scraping URL: {url}")
            scrape_result = self.app.scrape_url(url, params={'formats': ['markdown']})
            return scrape_result
        except Exception as e:
            logger.error(f"❌ Scrape failed: {e}")
            return {"error": str(e)}

    def crawl_url(self, url: str, limit: int = 5, depth: int = 1) -> Dict[str, Any]:
        """
        Crawl a URL and its sub-pages.
        """
        if not self.app:
            return {"error": "Firecrawl is not configured."}

        try:
            logger.info(f"🕸️  Crawling URL: {url} (limit={limit}, depth={depth})")
            crawl_status = self.app.crawl_url(
                url, 
                params={
                    'limit': limit, 
                    'scrapeOptions': {'formats': ['markdown']}
                },
                poll_interval=30
            )
            return crawl_status
        except Exception as e:
            logger.error(f"❌ Crawl failed: {e}")
            return {"error": str(e)}

    def check_crawl_status(self, job_id: str) -> Dict[str, Any]:
         if not self.app:
            return {"error": "Firecrawl is not configured."}
         
         try:
             status = self.app.check_crawl_status(job_id)
             return status
         except Exception as e:
             logger.error(f"❌ Check status failed: {e}")
             return {"error": str(e)}

    def map_site(self, url: str) -> List[str]:
        """
        Map a website to find all URLs.
        """
        if not self.app:
            return []
            
        try:
             logger.info(f"🗺️  Mapping URL: {url}")
             map_result = self.app.map_url(url)
             return map_result
        except Exception as e:
             logger.error(f"❌ Map failed: {e}")
             return []
