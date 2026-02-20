import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Agent } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await connectDB();

        // Fetch active agents from MongoDB
        const agents = await Agent.find({ status: 'active' });

        // Map DB _id to standard 'id' for the frontend grid
        const mappedAgents = agents.map((agent: any) => {
            const obj = typeof agent.toObject === 'function' ? agent.toObject() : agent;
            return {
                ...obj,
                id: obj._id ? obj._id.toString() : obj.id
            };
        });

        // If DB is empty, return a fallback mock showcasing our core fleet
        if (!mappedAgents || mappedAgents.length === 0) {
            return NextResponse.json([
                {
                    id: "did:aris:agt:compliance01",
                    name: "Compliance Analyst",
                    description: "Cross-references RFPs against FAR/DFARS clauses.",
                    price: 1.50,
                    category: "compliance",
                    status: "active"
                },
                {
                    id: "did:aris:agt:writer02",
                    name: "Strategic Tech Writer",
                    description: "Drafts evaluation-ready technical narratives.",
                    price: 2.00,
                    category: "gov",
                    status: "active"
                },
                {
                    id: "did:aris:agt:pricing03",
                    name: "Price-to-Win Estimator",
                    description: "Calculates competitive pricing thresholds from SAM.gov awards.",
                    price: 1.25,
                    category: "finance",
                    status: "active"
                },
                {
                    id: "did:aris:agt:legal04",
                    name: "Legal Review Bot",
                    description: "Flags indemnification and liability risks in federal contracts.",
                    price: 1.00,
                    category: "legal",
                    status: "active"
                }
            ]);
        }

        return NextResponse.json(mappedAgents);

    } catch (error) {
        console.error('Error fetching registry:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
