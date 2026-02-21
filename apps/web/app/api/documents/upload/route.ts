import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.RENDER_API_URL || 'https://aris-registry.onrender.com';

function buildAuthHeaders(req: NextRequest): HeadersInit {
    const authHeader = req.headers.get('Authorization');
    return authHeader ? { Authorization: authHeader } : {};
}

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const outbound = new FormData();

        for (const [key, value] of form.entries()) {
            outbound.append(key, value);
        }

        const response = await fetch(`${API_BASE}/api/documents/upload`, {
            method: 'POST',
            headers: {
                ...buildAuthHeaders(req),
            },
            body: outbound,
        });

        const text = await response.text();
        try {
            return NextResponse.json(JSON.parse(text), { status: response.status });
        } catch {
            return NextResponse.json({ error: text }, { status: response.status });
        }
    } catch (error) {
        console.error('Document upload proxy failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const documentId = req.nextUrl.searchParams.get('documentId');
        if (!documentId) {
            return NextResponse.json({ error: 'documentId query param is required' }, { status: 400 });
        }

        const response = await fetch(`${API_BASE}/api/documents/${encodeURIComponent(documentId)}`, {
            method: 'GET',
            headers: {
                ...buildAuthHeaders(req),
            },
        });

        const text = await response.text();
        try {
            return NextResponse.json(JSON.parse(text), { status: response.status });
        } catch {
            return NextResponse.json({ error: text }, { status: response.status });
        }
    } catch (error) {
        console.error('Document status proxy failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
