import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.RENDER_API_URL || 'https://aris-registry.onrender.com';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const authHeader = req.headers.get('Authorization');

        const response = await fetch(`${API_BASE}/api/delivery/deliver`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { 'Authorization': authHeader } : {}),
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                return NextResponse.json(errorJson, { status: response.status });
            } catch {
                return NextResponse.json({ error: errorText }, { status: response.status });
            }
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
