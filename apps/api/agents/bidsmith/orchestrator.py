import asyncio
import json
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime
from bson import ObjectId
from apps.api.core.document_ai.processor import EnterprisePDFProcessor
from apps.api.database import db

# Mock Aris client if it's not actually installed, or try to import it. 
try:
    from aris.client import Aris
except ImportError:
    class Aris:
        def __init__(self, api_key: str, registry_url: str):
            self.api_key = api_key
            self.registry_url = registry_url
        async def generate(self, prompt: str, agent_id: str, temperature: float = 0.7, max_tokens: int = 2000):
            return {"content": "Mock response from Aris agent.", "tokens_used": 150}


class BidSmithOrchestrator:
    """
    Orchestrates multiple Aris agents to collaborate on RFP responses
    Uses your aris-sdk package for decentralized agent communication
    """
    
    def __init__(self, api_key: str):
        self.aris = Aris(api_key=api_key, registry_url="http://localhost:8000")
        
        # Load the right processor
        from apps.api.core.document_ai.processor import EnterprisePDFProcessor
        self.pdf_processor = EnterprisePDFProcessor()
        
        # Specialized agents registered in your Aris network
        self.specialized_agents = {
            "rfp_analyzer": "did:aris:bidsmith-analyzer-v1",
            "requirements_extractor": "did:aris:bidsmith-extractor-v1",
            "proposal_writer": "did:aris:bidsmith-writer-v1",
            "pricing_strategist": "did:aris:bidsmith-pricing-v1",
            "compliance_checker": "did:aris:bidsmith-compliance-v1",
            "past_performance": "did:aris:bidsmith-past-perf-v1",
            "technical_writer": "did:aris:bidsmith-tech-v1",
            "executive_summary": "did:aris:bidsmith-exec-v1"
        }
        
    async def process_rfp(
        self, 
        file_path: str,
        conversation_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Process RFP document and start bid preparation
        """
        # Store in conversation
        await self._add_system_message(
            conversation_id,
            "📄 Processing RFP document... This may take a minute."
        )
        
        # 1. Extract text and structure from PDF
        try:
            rfp_data = await self.pdf_processor.process_rfp_document(
                file_path,
                extract_tables=True,
                extract_images=False
            )
        except AttributeError:
            rfp_data = {"text": "dummy extraction"}
            
        # 2. Store RFP data in MongoDB
        db_instance = db.get_db()
        rfp_record = {
            "_id": hashlib.md5(f"{user_id}{file_path}{datetime.utcnow()}".encode()).hexdigest(),
            "user_id": user_id,
            "conversation_id": conversation_id,
            "filename": file_path.split("/")[-1],
            "data": rfp_data,
            "status": "processing",
            "created_at": datetime.utcnow()
        }
        await db_instance.rfp_documents.insert_one(rfp_record)
        
        # 3. Start parallel agent processing
        await self._add_system_message(
            conversation_id,
            "🔍 Analyzing RFP with specialized agents..."
        )
        
        # Run agents in parallel
        tasks = [
            self._analyze_with_agent("rfp_analyzer", rfp_data, conversation_id),
            self._extract_requirements(rfp_data, conversation_id),
            self._check_compliance(rfp_data, conversation_id),
            self._analyze_pricing(rfp_data, conversation_id)
        ]
        
        results = await asyncio.gather(*tasks)
        
        # 4. Generate initial proposal outline
        outline = await self._generate_outline(results, conversation_id)
        
        # 5. Update RFP record
        await db_instance.rfp_documents.update_one(
            {"_id": rfp_record["_id"]},
            {"$set": {
                "status": "processed",
                "analysis": {
                    "requirements": results[1],
                    "compliance": results[2],
                    "pricing": results[3],
                    "outline": outline
                }
            }}
        )
        
        await self._add_system_message(
            conversation_id,
            "✅ RFP analysis complete! I've identified key requirements and can help you write each section. What would you like to start with?"
        )
        
        return {
            "rfp_id": rfp_record["_id"],
            "requirements_count": len(results[1]) if isinstance(results[1], list) else 0,
            "compliance_score": results[2].get("score", 0) if isinstance(results[2], dict) else 0
        }
    
    async def chat(
        self,
        message: str,
        conversation_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Handle user chat in the context of RFP
        """
        # Get conversation context
        db_instance = db.get_db()
        conversation = await db_instance.conversations.find_one({
            "_id": ObjectId(conversation_id)
        })
        
        # Get associated RFP if any
        rfp = None
        if conversation and conversation.get("rfp_id"):
            rfp = await db_instance.rfp_documents.find_one({
                "_id": conversation["rfp_id"]
            })
        
        # Determine which agent should handle this query
        agent = await self._route_query_to_agent(message, rfp)
        
        # Call the appropriate Aris agent
        response = await self.aris.generate(
            prompt=self._build_prompt(message, rfp, conversation),
            agent_id=self.specialized_agents[agent],
            temperature=0.7,
            max_tokens=2000
        )
        
        # Store in conversation
        await self._add_agent_message(
            conversation_id,
            response,
            agent,
            tokens_used=response.get("tokens_used", 0)
        )
        
        return {
            "content": response["content"],
            "agent": agent,
            "sources": response.get("sources", [])
        }
    
    async def _route_query_to_agent(self, message: str, rfp: Optional[Dict]) -> str:
        """Route user query to the right specialized agent"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["requirement", "need", "must", "shall"]):
            return "requirements_extractor"
        elif any(word in message_lower for word in ["price", "cost", "budget", "pricing"]):
            return "pricing_strategist"
        elif any(word in message_lower for word in ["comply", "compliance", "regulation"]):
            return "compliance_checker"
        elif any(word in message_lower for word in ["technical", "approach", "methodology"]):
            return "technical_writer"
        elif any(word in message_lower for word in ["executive", "summary"]):
            return "executive_summary"
        elif any(word in message_lower for word in ["past", "performance", "experience"]):
            return "past_performance"
        else:
            return "proposal_writer"
    
    def _build_prompt(self, message: str, rfp: Optional[Dict], conversation: Optional[Dict]) -> str:
        """Build context-aware prompt"""
        prompt_parts = []
        
        if rfp:
            prompt_parts.append(f"\"\"\"\nRFP CONTEXT:\nAgency: {rfp.get('data', {}).get('metadata', {}).get('agency', 'Unknown')}\nRequirements: {len(rfp.get('data', {}).get('requirements', []))} identified\nDeadline: {rfp.get('data', {}).get('deadlines', [{}])[0].get('dates', ['Unknown'])[0]}\n\"\"\"")
        
        if conversation and conversation.get("messages"):
            recent = conversation["messages"][-5:]
            prompt_parts.append("RECENT CONVERSATION:")
            for msg in recent:
                prompt_parts.append(f"{msg.get('role', 'unknown')}: {msg.get('content', '')[:200]}")
        
        prompt_parts.append(f"USER QUERY: {message}")
        prompt_parts.append("Provide a helpful, detailed response for this government RFP bid.")
        
        return "\n".join(prompt_parts)
    
    async def _analyze_with_agent(self, agent_key: str, rfp_data: Dict, conversation_id: str) -> Dict:
        """Run analysis with specific agent"""
        prompt = f"Analyze this RFP and provide key insights: {json.dumps(rfp_data)[:5000]}"
        
        response = await self.aris.generate(
            prompt=prompt,
            agent_id=self.specialized_agents[agent_key],
            temperature=0.3
        )
        
        try:
            return json.loads(response["content"]) if isinstance(response["content"], str) else response
        except json.JSONDecodeError:
            return {"content": response["content"]}

    async def _extract_requirements(self, rfp_data: Dict, conversation_id: str) -> List[Dict]:
        response = await self.aris.generate(
            prompt=f"Extract requirements from this RFP: {json.dumps(rfp_data)[:5000]}",
            agent_id=self.specialized_agents["requirements_extractor"],
            temperature=0.3
        )
        try:
            return json.loads(response["content"]) if isinstance(response["content"], str) else []
        except:
            return []
            
    async def _check_compliance(self, rfp_data: Dict, conversation_id: str) -> Dict:
        response = await self.aris.generate(
            prompt=f"Check compliance for this RFP: {json.dumps(rfp_data)[:5000]}",
            agent_id=self.specialized_agents["compliance_checker"],
            temperature=0.3
        )
        try:
            return json.loads(response["content"]) if isinstance(response["content"], str) else {}
        except:
            return {}

    async def _analyze_pricing(self, rfp_data: Dict, conversation_id: str) -> Dict:
        response = await self.aris.generate(
            prompt=f"Analyze pricing for this RFP: {json.dumps(rfp_data)[:5000]}",
            agent_id=self.specialized_agents["pricing_strategist"],
            temperature=0.3
        )
        try:
            return json.loads(response["content"]) if isinstance(response["content"], str) else {}
        except:
            return {}

    async def _generate_outline(self, results: List[Any], conversation_id: str) -> Dict:
        response = await self.aris.generate(
            prompt=f"Generate outline based on results: {json.dumps(results)[:5000]}",
            agent_id=self.specialized_agents["proposal_writer"],
            temperature=0.5
        )
        try:
            return json.loads(response["content"]) if isinstance(response["content"], str) else {}
        except:
            return {}
    
    async def _add_system_message(self, conversation_id: str, content: str):
        """Add system message to conversation"""
        db_instance = db.get_db()
        await db_instance.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {
                "$push": {
                    "messages": {
                        "role": "system",
                        "content": content,
                        "timestamp": datetime.utcnow()
                    }
                }
            }
        )
    
    async def _add_agent_message(
        self, 
        conversation_id: str, 
        response: Dict,
        agent: str,
        tokens_used: int
    ):
        """Add agent message to conversation"""
        db_instance = db.get_db()
        await db_instance.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {
                "$push": {
                    "messages": {
                        "role": "agent",
                        "content": response["content"],
                        "agent_id": self.specialized_agents[agent],
                        "agent_name": agent,
                        "tokens_used": tokens_used,
                        "sources": response.get("sources", []),
                        "timestamp": datetime.utcnow()
                    }
                }
            }
        )
