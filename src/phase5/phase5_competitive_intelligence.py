#!/usr/bin/env python3
"""
Phase 5: Competitive Intelligence
Takes a set of requirements (from Phase 1) and generates a competitive intelligence brief:
predicts incumbents, likelihood of win, and pricing strategies.
"""

import json
import os
import sys
import argparse
from typing import Dict

try:
    from openai import OpenAI
except ImportError:
    print("❌ Missing dependencies. Install with: pip install openai")
    sys.exit(1)

class CompetitiveIntelligence:
    def __init__(self, api_key: str = None):
        key = api_key or os.getenv("OPENROUTER_KEY")
        if not key:
            print(json.dumps({"error": "No OpenRouter API key provided"}))
            sys.exit(1)
        
        self.client = OpenAI(
            api_key=key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "ARIS Labs Competitive Intelligence"
            }
        )
        self.model = "google/gemini-2.5-flash"

    def analyze(self, rfp_summary: str, reqs_data: list) -> Dict:
        system_prompt = """You are an expert Government Contracting Competitive Intelligence Analyst.
Given a summary of an RFP and its requirements, generate a competitive intelligence brief.
Your output MUST be a pure, strictly valid JSON object exactly matching this format:
{
  "win_probability": "High|Medium|Low",
  "estimated_incumbent_advantage": "Strong|Moderate|Weak|None",
  "pricing_strategy": "Aggressive|Standard|Premium",
  "likely_competitor_profiles": [
    {"type": "Large System Integrator", "threat_level": "High"},
    {"type": "Small Business Specialist", "threat_level": "Medium"}
  ],
  "strategic_recommendation": "Brief paragraph recommending bid/no-bid and primary theme."
}

Return ONLY pure valid JSON. No markdown formatting, no code blocks."""

        user_content = f"RFP CONTEXT:\n{rfp_summary}\n\nREQUIREMENTS/SCOPE:\n{json.dumps(reqs_data, indent=2)}"

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.3,
                max_tokens=2048
            )
            raw = response.choices[0].message.content.strip()
            
            if raw.startswith("```json"):
                raw = raw[7:-3]
            elif raw.startswith("```"):
                raw = raw[3:-3]
                
            return json.loads(raw.strip())
        except Exception as e:
            return {"error": str(e), "message": "Failed to analyze competitive intelligence"}

def main():
    parser = argparse.ArgumentParser(description="Phase 5: Competitive Intelligence")
    parser.add_argument("requirements_json", help="Path to Phase 1 output JSON")
    parser.add_argument("-o", "--output", help="Output JSON file path")
    args = parser.parse_args()

    try:
        with open(args.requirements_json, 'r', encoding='utf-8') as f:
            reqs = json.load(f)
    except Exception as e:
        print(json.dumps({"error": f"Failed to load requirements: {e}"}))
        sys.exit(1)

    ci = CompetitiveIntelligence()
    
    # Simple summary extraction context
    rfp_sum = "Federal IT / Professional Services Solicitation"
    if isinstance(reqs, dict) and "company_info" in reqs:
        rfp_sum = json.dumps(reqs.get("company_info", {}))
        req_list = reqs.get("requirements", [])
    elif isinstance(reqs, list):
        req_list = reqs[:20]  # Cap to fit context window
    else:
        req_list = []

    result = ci.analyze(rfp_sum, req_list)

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)
    else:
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
