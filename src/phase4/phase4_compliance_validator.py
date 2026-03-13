#!/usr/bin/env python3
"""
Phase 4: Live Compliance Validator
Takes a set of requirements (from Phase 1) and a vendor capability statement,
then evaluates how well the vendor meets the requirements.
"""

import json
import os
import sys
import argparse
from typing import Dict, List

try:
    from openai import OpenAI
except ImportError:
    print("❌ Missing dependencies. Install with: pip install openai")
    sys.exit(1)

def chunk_text(text: str, chunk_size: int = 20000) -> List[str]:
    chunks = []
    words = text.split()
    current = []
    size = 0
    for w in words:
        current.append(w)
        size += len(w) + 1
        if size >= chunk_size:
            chunks.append(" ".join(current))
            current = []
            size = 0
    if current:
        chunks.append(" ".join(current))
    return chunks

class ComplianceValidator:
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
                "X-Title": "ARIS Labs Compliance Validator"
            }
        )
        self.model = "google/gemini-2.5-flash"

    def validate(self, reqs_data: List[Dict], capability_text: str) -> Dict:
        # Simplify requirements for prompt to fit context window
        simplified_reqs = []
        for r in reqs_data:
            simplified_reqs.append({
                "id": r.get('id', 'UNK'),
                "text": r.get('text', ''),
                "type": r.get('type', 'General')
            })

        system_prompt = """You are an expert Government Contracting Compliance Auditor.
You will be provided with:
1. A list of REQUIREMENTS for a federal solicitation.
2. A vendor's CAPABILITY STATEMENT.

Your job is to cross-reference the capability statement against each requirement.
Output a JSON object with:
- "overall_match_score": A number between 0 and 100 representing how well the vendor matches.
- "gaps": A list of requirement IDs that the vendor fails to meet.
- "strengths": A list of requirement IDs that the vendor strongly meets.
- "assessment_summary": A brief 2-3 sentence summary of your findings.

Return ONLY pure valid JSON. No markdown formatting, no code blocks."""

        user_content = f"REQUIREMENTS:\n{json.dumps(simplified_reqs, indent=2)}\n\nCAPABILITY STATEMENT:\n{capability_text}"

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.1,
                max_tokens=2048
            )
            raw = response.choices[0].message.content.strip()
            
            # Extract JSON block if surrounded by markdown
            if raw.startswith("```json"):
                raw = raw[7:-3]
            elif raw.startswith("```"):
                raw = raw[3:-3]
            
            return json.loads(raw.strip())
        except Exception as e:
            return {"error": str(e), "overall_match_score": 0, "gaps": [], "strengths": [], "assessment_summary": "Validation failed."}

def main():
    parser = argparse.ArgumentParser(description="Phase 4: Live Compliance Validator")
    parser.add_argument("requirements_json", help="Path to Phase 1 output JSON")
    parser.add_argument("capability_txt", help="Path to Vendor Capability Statement TXT")
    parser.add_argument("-o", "--output", help="Output JSON file path")
    args = parser.parse_args()

    try:
        with open(args.requirements_json, 'r', encoding='utf-8') as f:
            reqs = json.load(f)
    except Exception as e:
        print(json.dumps({"error": f"Failed to load requirements: {e}"}))
        sys.exit(1)

    try:
        with open(args.capability_txt, 'r', encoding='utf-8') as f:
            caps = f.read()
    except Exception as e:
        print(json.dumps({"error": f"Failed to load capability statement: {e}"}))
        sys.exit(1)

    validator = ComplianceValidator()
    result = validator.validate(reqs.get("requirements", reqs) if isinstance(reqs, dict) else reqs, caps)

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)
    else:
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
