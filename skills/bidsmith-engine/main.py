from aris_sdk import ArisClient
from typing import List, Dict, Any
import os
import httpx

client = ArisClient(api_key=os.getenv("ARIS_API_KEY"))

class SimpleClerkClient:
    """Lightweight Clerk API client using httpx to avoid dependency hell with clerk-sdk-python."""
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.clerk.com/v1"
        self.headers = {"Authorization": f"Bearer {api_key}"}

    def get_user(self, user_id: str) -> Dict[str, Any]:
        with httpx.Client() as client:
            resp = client.get(f"{self.base_url}/users/{user_id}", headers=self.headers)
            resp.raise_for_status()
            return resp.json()

clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
clerk_client = SimpleClerkClient(clerk_secret_key) if clerk_secret_key else None

def analyze_rfp(document_path: str, extract_compliance_matrix: bool = True):
    """Bridge to your existing Aris-Core logic"""
    with open(document_path, "rb") as f:
        analysis = client.analyze(f)
    
    if extract_compliance_matrix:
        return analysis.get_matrix()
    return analysis.summary

def analyze_with_auth(clerk_user_id: str, document_path: str):
    """
    The Agent calls this to ensure only paying users 
    can run the expensive Gemini analysis.
    """
    if not clerk_client:
        return "Error: Clerk API key not configured."

    try:
        # 1. Verification via Clerk API
        user = clerk_client.get_user(clerk_user_id)
        
        # 2. Credit Check (Your Pivot Logic)
        public_metadata = user.get("public_metadata", {})
        credits = public_metadata.get("credits", 0)
        
        if credits < 0.99:
            return "Error: Insufficient credits. Please top up in the Billing tab."

        # 3. Proceed to Aris-SDK Analysis
        return analyze_rfp(document_path)

    except Exception as e:
        return f"Error during auth check: {str(e)}"

def match_registry_agent(bid_metadata: dict):
    """Queries the Aris Registry for the best fit"""
    return client.registry.find_match(bid_metadata)

def verify_compliance(proposal_text: str, requirement_ids: List[str] = None):
    """
    Grades the generated proposal against a list of extracted RFP requirements.
    Returns a compliance score and a list of 'Missing' or 'Weak' points.
    """
    # 1. Fetch the actual requirement text from your Aris Registry/DB
    # If requirement_ids is None, fetch default or all relevant ones? Or handle empty gracefully.
    requirements = []
    if requirement_ids:
        requirements = client.db.get_requirements(requirement_ids)
    
    # 2. Perform a 'Semantic Check' using the Aris-SDK Logic
    # If no requirements, we might skip or use generic rules.
    if not requirements:
       # Fallback to generic compliance check if available or return warning
       return {"compliance_score": "0%", "status": "YELLOW", "findings": "No specific requirements provided for verification."}

    audit_results = client.audit.check_alignment(
        source_content=proposal_text,
        targets=requirements
    )
    
    # 3. Calculate a "Pass/Fail" Grade
    passed = [r for r in audit_results if r.status == "FULLY_COMPLIANT"]
    if not audit_results:
        score = 0
    else:
        score = (len(passed) / len(audit_results)) * 100
    
    return {
        "compliance_score": f"{int(score)}%",
        "status": "GREEN" if score > 90 else "YELLOW" if score > 70 else "RED",
        "findings": audit_results.get_summary() if hasattr(audit_results, 'get_summary') else str(audit_results)
    }
