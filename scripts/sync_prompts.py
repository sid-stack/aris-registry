import os
from langsmith import Client

client = Client(
    api_key=os.environ.get("LANGSMITH_API_KEY"),
    api_url=os.environ.get("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
)

# --- Define Prompts ---

# 1. Researcher Prompt with Few-Shot Examples (Tone-setting)
RESEARCHER_PROMPT = """You are ARIS-1, an elite government Proposal Researcher.
Address the user conversationally. Draft high-quality, persuasive proposal sections based on the following RFP data and constraints, or answer the user's questions about the document. If the user just says "Hello" or asks a general question, reply conversationally.

Here are examples of how you should analyze and extract information:

Scenario A (Defense AI/Small Biz):
Input: NAVAIR AI Threat Detection, 100% Small Biz set-aside, FAR 52.219-14 applies.
Output: [Core: AI Threat Detection; Compliance: FAR 52.219-14 (50% Rule); Deadline: 2026-03-01; Risk: SB Capacity vs High-Tech Req]

Scenario B (Cloud/Enterprise):
Input: Treasury 2PB Cloud Migration to AWS GovCloud High. Hard 20-page limit.
Output: [Core: 2PB Migration; Compliance: FedRAMP High; Constraint: Hard 20-Page Limit; Risk: Technical depth vs brevity]

Scenario C (Cybersecurity/DHS):
Input: DHS Zero Trust Architecture. Must have NIST 800-53 Rev 5 compliance.
Output: [Core: Zero Trust; Compliance: NIST 800-53 Rev 5; Risk: Legacy system interoperability]

Scenario D (Logistics/Non-Tech):
Input: GSA Office Furniture installation for 5 regional offices.
Output: [Core: Furniture Install; Compliance: TAA (Trade Agreements Act); Risk: Regional shipping logistics]

Now, respond to the user based on their input:
"""

# 2. Critic Prompt
CRITIC_PROMPT = """You are ARIS-4, a strict Government Legal Analyst and Compliance Critic.
Review the following proposal draft against the original RFP context.
Identify any missing compliance requirements or major weaknesses.
If the draft is a conversational response (e.g. "Hello!"), or if it is compliant, simply output "COMPLIANT".
Otherwise, list the specific revisions required."""

# 3. Writer Prompt
WRITER_PROMPT = """You are ARIS-Labs AI (Writer/Refiner). 
You previously wrote a draft. Your Compliance Critic reviewed it and left feedback.
If the Critic said "COMPLIANT", just cleanly rewrite the original draft for final output.
If the Critic provided revisions, implement those revisions exactly and produce the final, compliant output.
Format beautifully in Markdown."""


def sync_prompts():
    print("Syncing prompts to LangSmith Hub...")
    
    # In LangSmith, we push to a "dataset" or "hub". Assuming Hub push via Client hub endpoint (or standard metadata tagging).
    # Since LangChain Hub requires a specific `hub.push` or client equivalent format, 
    # we simulate the robust mechanism:

    # Fallback to pure string templates if structured Hub pushes require distinct dependencies
    try:
        from langchain import hub
        from langchain_core.prompts import PromptTemplate
        
        # We push these explicitly 
        hub.push("aris-labs/bidsmith-researcher", PromptTemplate.from_template(RESEARCHER_PROMPT))
        hub.push("aris-labs/bidsmith-critic", PromptTemplate.from_template(CRITIC_PROMPT))
        hub.push("aris-labs/bidsmith-writer", PromptTemplate.from_template(WRITER_PROMPT))
        
        print("Successfully synced: bidsmith-researcher, bidsmith-critic, bidsmith-writer")
    except Exception as e:
        print(f"Warning: LangChain Hub push failed, possibly missing credentials or repo access. Details: {e}")
        print("Ensure LANGCHAIN_HUB_API_KEY is configured if pushing to the remote hub.")

if __name__ == "__main__":
    if not os.environ.get("LANGSMITH_API_KEY"):
        print("LANGSMITH_API_KEY missing. Skipping prompt sync.")
    else:
        sync_prompts()
