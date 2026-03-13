#!/usr/bin/env python3
"""
RFP Requirement Extraction Engine - OpenRouter Version
"""

import json
import re
import sys
import os
from pathlib import Path
from typing import List, Dict, Tuple
import hashlib
from datetime import datetime

try:
    import PyPDF2
    from openai import OpenAI
except ImportError:
    print("❌ Missing dependencies. Install with: pip install PyPDF2 openai")
    sys.exit(1)

class RequirementExtractor:
    def __init__(self, api_key: str = None):
        key = api_key or os.getenv("OPENROUTER_KEY")
        if not key:
            print("❌ No OpenRouter API key provided")
            sys.exit(1)
        
        self.client = OpenAI(
            api_key=key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "ARIS Labs RFP Extractor"
            }
        )
        self.requirements = []
    
    def extract_pdf_text(self, pdf_path: str) -> Tuple[str, Dict]:
        try:
            if pdf_path.endswith('.txt'):
                with open(pdf_path, 'r', encoding='utf-8') as f:
                    text = f.read()
                metadata = {
                    "filename": Path(pdf_path).name,
                    "total_pages": 1,
                    "extraction_date": datetime.now().isoformat(),
                }
                return text, metadata
                
            with open(pdf_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                text = ""
                metadata = {
                    "filename": Path(pdf_path).name,
                    "total_pages": len(reader.pages),
                    "extraction_date": datetime.now().isoformat(),
                }
                
                for page_num, page in enumerate(reader.pages, 1):
                    page_text = page.extract_text()
                    text += f"\n[PAGE {page_num}]\n{page_text}\n"
                
                return text, metadata
        except FileNotFoundError:
            print(f"❌ File not found: {pdf_path}")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Error reading PDF: {e}")
            sys.exit(1)
    
    def extract_requirements(self, pdf_text: str, pdf_name: str = "RFP") -> List[Dict]:
        print(f"\n📋 Extracting requirements from {pdf_name}...")
        
        chunks = self._chunk_text(pdf_text, chunk_size=50000)
        all_requirements = []
        
        for chunk_idx, chunk in enumerate(chunks, 1):
            print(f"   Processing chunk {chunk_idx}/{len(chunks)}...", end=" ", flush=True)
            requirements = self._extract_from_chunk(chunk)
            all_requirements.extend(requirements)
            print(f"✓ Found {len(requirements)} requirements")
        
        all_requirements = self._deduplicate_requirements(all_requirements)
        self.requirements = all_requirements
        return all_requirements
    
    def _chunk_text(self, text: str, chunk_size: int = 50000) -> List[str]:
        chunks = []
        words = text.split()
        current_chunk = []
        current_size = 0
        
        for word in words:
            current_chunk.append(word)
            current_size += len(word) + 1
            
            if current_size >= chunk_size:
                chunks.append(' '.join(current_chunk))
                current_chunk = []
                current_size = 0
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
    
    def _extract_from_chunk(self, chunk: str) -> List[Dict]:
        system_prompt = """You are an expert government contracts analyst. Extract ALL requirements from the provided RFP text.

For each requirement, identify:
1. The exact requirement text (from the document)
2. Type: one of [Functional, Technical, Security, Performance, Cost, Compliance, Operational, Documentation]
3. Severity: Critical, High, Medium, Low
4. Keywords: ["shall", "must", "required", "should", "will", "may"]

Return ONLY valid JSON array, no preamble."""
        
        user_prompt = f"""Extract all requirements from this RFP excerpt:

{chunk}

Return complete JSON array only."""
        
        try:
            response = self.client.chat.completions.create(
                model="openrouter/auto",
                max_tokens=4000,
                temperature=0.3,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            full_response = response.choices[0].message.content
            
            try:
                json_match = re.search(r'\[.*\]', full_response, re.DOTALL)
                if json_match:
                    requirements = json.loads(json_match.group())
                    return requirements if isinstance(requirements, list) else []
            except json.JSONDecodeError:
                print(f"⚠️  Could not parse JSON response")
                return []
            
        except Exception as e:
            print(f"❌ Error in extraction: {e}")
            return []
    
    def _deduplicate_requirements(self, requirements: List[Dict]) -> List[Dict]:
        seen = set()
        unique_reqs = []
        
        for req in requirements:
            text_hash = hashlib.md5(req.get('text', '').lower().encode()).hexdigest()
            
            if text_hash not in seen:
                seen.add(text_hash)
                req['id'] = f"REQ-{len(unique_reqs) + 1:04d}"
                unique_reqs.append(req)
        
        return unique_reqs
    
    def generate_compliance_matrix(self) -> Dict:
        print("\n📊 Generating compliance matrix...")
        
        matrix = {
            'metadata': {
                'total_requirements': len(self.requirements),
                'extraction_date': datetime.now().isoformat(),
            },
            'requirements': self.requirements
        }
        
        return matrix
    
    def save_to_json(self, output_path: str, matrix: Dict):
        with open(output_path, 'w') as f:
            json.dump(matrix, f, indent=2)
        print(f"\n✅ Saved to: {output_path}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Extract requirements from government RFPs")
    parser.add_argument('pdf_file', help='Path to RFP PDF file')
    parser.add_argument('-o', '--output', default='requirements_matrix.json', help='Output JSON file')
    parser.add_argument('-k', '--api-key', help='OpenRouter API key')
    
    args = parser.parse_args()
    
    if not Path(args.pdf_file).exists():
        print(f"❌ File not found: {args.pdf_file}")
        sys.exit(1)
    
    extractor = RequirementExtractor(api_key=args.api_key)
    
    print(f"📄 Reading: {args.pdf_file}")
    pdf_text, metadata = extractor.extract_pdf_text(args.pdf_file)
    print(f"   ✓ {metadata['total_pages']} pages extracted")
    
    requirements = extractor.extract_requirements(pdf_text, Path(args.pdf_file).name)
    
    matrix = extractor.generate_compliance_matrix()
    
    extractor.save_to_json(args.output, matrix)
    
    print(f"✨ Extraction complete!")

if __name__ == '__main__':
    main()
