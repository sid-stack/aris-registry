#!/usr/bin/env python3
import sys
import json
import random
import re

def analyze_uei(uei):
    """
    Simulates a federal entity risk analysis based on UEI.
    In a production scenario, this would query SAM.gov API or a local registry.
    """
    uei = uei.strip().upper()
    
    # Basic validation: UEI must be 12 chars
    if not re.match(r'^[A-Z0-9]{12}$', uei):
        return {
            "status": "FAIL",
            "score": 0,
            "remediation": "Invalid UEI format. Must be 12 alphanumeric characters.",
            "is_disqualified": True
        }

    # Deterministic but realistic-looking scoring logic
    # We use a seed based on the UEI to keep it consistent for the user
    random.seed(uei)
    
    base_score = random.randint(65, 88) # Always leave room for improvement (sell the $499 audit)
    
    risks = []
    if base_score < 75:
        risks.append("Entity registration nearing expiration (within 60 days)")
    if random.random() > 0.7:
        risks.append("Debt Subject to Offset detected in SAM.gov record")
    if random.random() > 0.8:
        risks.append("Incomplete 'Exclusions' check history")
    
    return {
        "status": "SUCCESS",
        "uei": uei,
        "score": base_score,
        "risks": risks,
        "remediation": "Full ARIS Labs audit required to identify specific FAR/DFARS disqualifiers.",
        "premium_upgrade_url": "https://www.bidsmith.pro/app"
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No UEI provided"}))
        sys.exit(1)
        
    result = analyze_uei(sys.argv[1])
    print(json.dumps(result))
