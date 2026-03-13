#!/usr/bin/env python3
"""ARIS Labs - Phase 3: Contradiction & Ambiguity Detection"""

import json
import re
import os
import sys
from typing import List, Dict
from datetime import datetime

try:
    from openai import OpenAI
except ImportError:
    print("pip install openai")
    sys.exit(1)

class ContradictionDetector:
    def __init__(self, api_key: str = None):
        key = api_key or os.getenv("OPENROUTER_KEY")
        if not key:
            print("❌ Set OPENROUTER_KEY environment variable")
            sys.exit(1)
        
        self.client = OpenAI(
            api_key=key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={"HTTP-Referer": "http://localhost:8000"}
        )
    
    def detect_contradictions(self, requirements_json: str) -> List:
        print("\n🔍 Analyzing for contradictions...")
        
        system_prompt = """You are an RFP expert finding contradictions.
Analyze the requirements and identify:
1. Direct conflicts (X vs NOT X)
2. Timing conflicts
3. Resource conflicts
4. Technical conflicts

Return JSON with contradictions."""
        
        user_prompt = f"""Find contradictions in these requirements:

{requirements_json[:5000]}

Return JSON array with fields: req1_id, req2_id, conflict_type, severity, impact"""
        
        try:
            response = self.client.chat.completions.create(
                model="openrouter/auto",
                max_tokens=1500,
                temperature=0.3,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            response_text = response.choices[0].message.content
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            print(f"⚠️ Error: {e}")
        
        return []
    
    def detect_ambiguities(self, requirements_json: str) -> List[Dict]:
        print("⚠️  Detecting ambiguous language...")
        
        ambiguous_words = {
            'should': 'Weak language - unclear if mandatory',
            'may': 'Optional - unclear requirement',
            'could': 'Vague possibility',
            'might': 'Uncertain requirement',
            'roughly': 'Vague metric',
            'approximately': 'Imprecise measurement',
            'robust': 'Undefined term',
            'performant': 'Undefined term',
            'scalable': 'Undefined term'
        }
        
        ambiguities = []
        for word, issue in ambiguous_words.items():
            ambiguities.append({
                'word': word,
                'issue': issue,
                'severity': 'Medium',
                'recommendation': 'Request clarification'
            })
        
        return ambiguities
    
    def generate_clarification_questions(self, contradictions: List, ambiguities: List) -> List[str]:
        print("❓ Generating clarification questions...")
        
        questions = []
        
        if contradictions:
            questions.append(f"Regarding the {len(contradictions)} contradictions found: how should we resolve them?")
        
        if ambiguities:
            questions.append(f"Can you clarify the {len(ambiguities)} ambiguous terms?")
        
        questions.extend([
            "What is the exact budget available for this project?",
            "Are there any firm deadlines for completion?",
            "Which requirements are mandatory vs. nice-to-have?",
            "Can you provide examples of acceptable solutions?"
        ])
        
        return questions
    
    def generate_report(self, requirements_json: str, criteria_json: str = None) -> Dict:
        print("📊 Generating contradiction analysis report...")
        
        contradictions = self.detect_contradictions(requirements_json)
        ambiguities = self.detect_ambiguities(requirements_json)
        questions = self.generate_clarification_questions(contradictions, ambiguities)
        
        report = {
            'metadata': {
                'analysis_date': datetime.now().isoformat(),
                'total_contradictions': len(contradictions),
                'total_ambiguities': len(ambiguities),
                'clarification_questions': len(questions)
            },
            'contradictions': contradictions,
            'ambiguities': ambiguities,
            'clarification_questions': questions
        }
        
        return report
    
    def save_report(self, report: Dict, output_path: str = 'contradictions_report.json'):
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"✅ Saved to: {output_path}")
    
    def print_summary(self, report: Dict):
        print("\n" + "="*70)
        print("⚠️  CONTRADICTION & AMBIGUITY REPORT")
        print("="*70)
        print(f"\nContradictions Found: {report['metadata']['total_contradictions']}")
        print(f"Ambiguous Terms: {report['metadata']['total_ambiguities']}")
        print(f"\nClarification Questions: {report['metadata']['clarification_questions']}")
        print("\nTop Questions:")
        for q in report['clarification_questions'][:3]:
            print(f"  • {q}")
        print("\n" + "="*70 + "\n")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Detect RFP contradictions")
    parser.add_argument('requirements_json', help='requirements_matrix.json path')
    parser.add_argument('-c', '--criteria', help='evaluation_criteria.json path')
    parser.add_argument('-o', '--output', default='contradictions_report.json')
    
    args = parser.parse_args()
    
    try:
        with open(args.requirements_json) as f:
            requirements_data = f.read()
    except FileNotFoundError:
        print(f"❌ File not found: {args.requirements_json}")
        sys.exit(1)
    
    detector = ContradictionDetector()
    report = detector.generate_report(requirements_data)
    detector.save_report(report, args.output)
    detector.print_summary(report)

if __name__ == '__main__':
    main()
