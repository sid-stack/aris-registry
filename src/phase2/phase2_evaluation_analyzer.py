#!/usr/bin/env python3
"""ARIS Labs - Phase 2: Evaluation Criteria Analysis Engine"""

import json
import re
import sys
import os
from pathlib import Path
from typing import List, Dict, Tuple
from datetime import datetime

try:
    import PyPDF2
    from openai import OpenAI
except ImportError:
    print("❌ Missing dependencies. Install with: pip install PyPDF2 openai")
    sys.exit(1)

class EvaluationAnalyzer:
    def __init__(self, api_key: str = None):
        key = api_key or os.getenv("OPENROUTER_KEY")
        if not key:
            print("❌ No OpenRouter API key provided")
            sys.exit(1)
        
        self.client = OpenAI(
            api_key=key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={"HTTP-Referer": "http://localhost:8000", "X-Title": "ARIS Labs Phase 2"}
        )
        self.criteria = []
    
    def extract_pdf_text(self, pdf_path: str) -> Tuple[str, Dict]:
        try:
            if pdf_path.endswith('.txt'):
                with open(pdf_path, 'r', encoding='utf-8') as f:
                    text = f.read()
                return text, {"filename": Path(pdf_path).name, "total_pages": 1}
                
            with open(pdf_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                text = ""
                for page_num, page in enumerate(reader.pages, 1):
                    text += f"\n[PAGE {page_num}]\n{page.extract_text()}\n"
                
                return text, {"filename": Path(pdf_path).name, "total_pages": len(reader.pages)}
        except Exception as e:
            print(f"❌ Error reading PDF: {e}")
            sys.exit(1)
    
    def extract_evaluation_criteria(self, pdf_text: str) -> List[Dict]:
        print("\n📊 Analyzing evaluation criteria...")
        
        system_prompt = """You are an expert government contracts analyst specializing in evaluation criteria.
Extract ALL evaluation criteria from the RFP text.

For each criterion, identify:
1. Criterion name (e.g., "Technical Approach")
2. Max points or percentage
3. Description of what's being evaluated
4. Mandatory or optional
5. Scoring method (points, pass/fail, color-coded, etc.)

Return ONLY valid JSON array."""
        
        user_prompt = f"""Extract all evaluation criteria from this RFP:

{pdf_text[:10000]}

Return JSON array with: criteria_name, max_points, description, mandatory, scoring_method"""
        
        try:
            response = self.client.chat.completions.create(
                model="openrouter/auto",
                max_tokens=2000,
                temperature=0.3,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            response_text = response.choices[0].message.content
            
            try:
                json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
                if json_match:
                    criteria = json.loads(json_match.group())
                    return criteria if isinstance(criteria, list) else []
            except:
                print("⚠️  Could not parse criteria response")
                return []
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return []
    
    def calculate_weights(self, criteria: List[Dict]) -> Dict:
        print("📈 Calculating scoring weights...")
        
        total_points = 0
        weights = {}
        
        for criterion in criteria:
            points = criterion.get('max_points', 0)
            if isinstance(points, str):
                match = re.search(r'(\d+)', points)
                points = int(match.group(1)) if match else 0
            
            if points > 0:
                total_points += points
                name = criterion.get('criteria_name', 'Unknown')
                weights[name] = {'points': points, 'percentage': 0}
        
        if total_points > 0:
            for name in weights:
                percentage = (weights[name]['points'] / total_points) * 100
                weights[name]['percentage'] = round(percentage, 1)
        
        return {'total_points': total_points, 'weights': weights}
    
    def generate_report(self, pdf_path: str) -> Dict:
        print(f"📄 Analyzing: {pdf_path}\n")
        
        pdf_text, metadata = self.extract_pdf_text(pdf_path)
        print(f"   ✓ {metadata['total_pages']} pages extracted")
        
        criteria = self.extract_evaluation_criteria(pdf_text)
        print(f"   ✓ Found {len(criteria)} evaluation criteria")
        
        weights = self.calculate_weights(criteria)
        print(f"   ✓ Total evaluation points: {weights['total_points']}")
        
        report = {
            'metadata': {
                'source_file': metadata['filename'],
                'extraction_date': datetime.now().isoformat(),
                'total_pages': metadata['total_pages'],
                'total_criteria': len(criteria),
                'total_points': weights['total_points']
            },
            'evaluation_criteria': criteria,
            'scoring_summary': weights['weights']
        }
        
        return report
    
    def save_report(self, report: Dict, output_path: str = 'evaluation_criteria.json'):
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"\n✅ Report saved to: {output_path}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Analyze evaluation criteria from RFP")
    parser.add_argument('pdf_file', help='Path to RFP PDF')
    parser.add_argument('-o', '--output', default='evaluation_criteria.json', help='Output JSON file')
    parser.add_argument('-k', '--api-key', help='OpenRouter API key')
    
    args = parser.parse_args()
    
    if not Path(args.pdf_file).exists():
        print(f"❌ File not found: {args.pdf_file}")
        sys.exit(1)
    
    analyzer = EvaluationAnalyzer(api_key=args.api_key)
    report = analyzer.generate_report(args.pdf_file)
    analyzer.save_report(report, args.output)
    
    print(f"✨ Analysis complete!")

if __name__ == '__main__':
    main()
