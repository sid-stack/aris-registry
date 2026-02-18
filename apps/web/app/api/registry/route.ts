import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Agent } from '@/models';

export async function GET() {
    try {
        await connectDB();

        // Fetch active agents from MongoDB
        const agents = await Agent.find({ status: 'active' });

        // If DB is empty, return a fallback mock (matching Python implementation)
        if (!agents || agents.length === 0) {
            return NextResponse.json([
                {
                    id: "agent_1",
                    name: "Legal Review Bot",
                    description: "Analyzes contracts for risks.",
                    price: 1.00,
                    category: "legal",
                    status: "active"
                },
                {
                    id: "agent_2",
                    name: "RFP Analyzer",
                    description: "Extracts requirements from RFPs.",
                    price: 1.50,
                    category: "procurement",
                    status: "active"
                }
            ]);
        }

        return NextResponse.json(agents);

    } catch (error) {
        console.error('Error fetching registry:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
