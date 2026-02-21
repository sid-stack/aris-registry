import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.RENDER_API_URL || 'https://aris-registry.onrender.com';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const body = await req.json();

        const response = await fetch(`${API_BASE}/api/documents/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify(body),
        });

        const text = await response.text();
        try {
            return NextResponse.json(JSON.parse(text), { status: response.status });
        } catch {
            return NextResponse.json({ error: text }, { status: response.status });
        }
    } catch (error) {
        console.error('Document search proxy failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
