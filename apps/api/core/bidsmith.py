from typing import List, Dict

# Mock Compliance Rules (In production, fetch from Aris Registry/Vector DB)
COMPLIANCE_RULES = {
    "FAR 52.219-6": "Total Small Business Set-Aside",
    "FAR 52.222-26": "Equal Opportunity",
    "FAR 52.204-21": "Basic Safeguarding of Covered Contractor Information Systems"
}

def verify_compliance(proposal_text: str, requirement_ids: List[str] = None):
    """
    Grades the generated proposal against a list of extracted RFP requirements.
    Returns a compliance score and a list of 'Missing' or 'Weak' points.
    """
    if not requirement_ids:
        requirement_ids = list(COMPLIANCE_RULES.keys())
    
    audit_results = []
    
    # 1. Simple Keyword Check (Mock Semantic Analysis)
    for rule_id in requirement_ids:
        clause = COMPLIANCE_RULES.get(rule_id, rule_id)
        if clause.lower() in proposal_text.lower() or rule_id.lower() in proposal_text.lower():
            audit_results.append({"rule": rule_id, "status": "FULLY_COMPLIANT", "finding": "Clause found in text."})
        else:
            audit_results.append({"rule": rule_id, "status": "NON_COMPLIANT", "finding": "Clause missing from proposal."})
    
    # 2. Calculate Grade
    compliant_count = sum(1 for r in audit_results if r["status"] == "FULLY_COMPLIANT")
    total = len(audit_results)
    score = (compliant_count / total) * 100 if total > 0 else 0
    
    status = "GREEN" if score > 90 else "YELLOW" if score > 70 else "RED"
    
    findings_summary = "\n".join([f"- {r['rule']}: {r['status']}" for r in audit_results])
    
    return {
        "compliance_score": f"{int(score)}%",
        "status": status,
        "findings": findings_summary,
        "details": audit_results
    }
