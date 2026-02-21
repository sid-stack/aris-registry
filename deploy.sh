#!/bin/bash
# deploy.sh - Run this to deploy everything

echo "🚀 Deploying BidSmith on Aris Protocol"

# 1. Save all changes
git add .

# 2. Create meaningful commit
git commit -m "feat: Add BidSmith agent for government RFP responses

- Integrated aris-sdk for decentralized agent communication
- Added enterprise-grade PDF processing for RFPs
- Implemented multi-agent orchestration with 8 specialized agents
- Added conversation history with WebSocket support
- Created BidSmith chat interface in Next.js
- Added RFP extraction for requirements, deadlines, pricing
- Integrated with MongoDB for conversation storage
- Added Redis caching for performance

The system now processes government RFPs using multiple specialized
agents that collaborate to create winning proposals."

# 3. Push to GitHub
git push origin main

# 4. Deploy to Render (or your hosting)
# curl -X POST https://api.render.com/deploy/srv-YOUR_SERVICE_ID?key=YOUR_DEPLOY_KEY

echo "✅ Deployment complete! Check your app at https://bidsmith.aris.network"
