import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { Conversation } from '@/models';
import type { ConversationRole, IConversationMessage } from '@/models';

const MAX_TITLE_LENGTH = 120;
const MAX_MESSAGES = 200;
const MAX_CONTENT_LENGTH = 20000;

type ConversationPayloadMessage = {
    id: string;
    role: ConversationRole;
    content: string;
    createdAt: string;
};

type ConversationPayload = {
    id: string;
    title: string;
    messages: ConversationPayloadMessage[];
    lastMessageAt: string;
    createdAt: string;
    updatedAt: string;
};

function toIsoDate(value: Date | string | undefined): string {
    return new Date(value ?? Date.now()).toISOString();
}

function toPayloadMessage(message: IConversationMessage): ConversationPayloadMessage {
    return {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: toIsoDate(message.createdAt),
    };
}

function toPayload(conversation: {
    _id: unknown;
    title: string;
    messages: IConversationMessage[];
    lastMessageAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}): ConversationPayload {
    return {
        id: String(conversation._id),
        title: conversation.title,
        messages: conversation.messages.map(toPayloadMessage),
        lastMessageAt: toIsoDate(conversation.lastMessageAt),
        createdAt: toIsoDate(conversation.createdAt),
        updatedAt: toIsoDate(conversation.updatedAt),
    };
}

function sanitizeMessages(value: unknown): IConversationMessage[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .slice(-MAX_MESSAGES)
        .map((item, index) => {
            const raw = typeof item === 'object' && item !== null ? item as Record<string, unknown> : null;
            if (!raw) {
                return null;
            }

            const role = raw.role;
            if (role !== 'user' && role !== 'assistant' && role !== 'system') {
                return null;
            }

            const content =
                typeof raw.content === 'string'
                    ? raw.content.slice(0, MAX_CONTENT_LENGTH)
                    : JSON.stringify(raw.content ?? '').slice(0, MAX_CONTENT_LENGTH);

            if (!content.trim()) {
                return null;
            }

            const idValue = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `msg-${Date.now()}-${index}`;
            const createdAtValue = typeof raw.createdAt === 'string' ? raw.createdAt : undefined;

            return {
                id: idValue,
                role,
                content,
                createdAt: new Date(createdAtValue ?? Date.now()),
            };
        })
        .filter((message): message is IConversationMessage => Boolean(message));
}

function clampTitle(input: unknown): string | undefined {
    if (typeof input !== 'string') {
        return undefined;
    }
    const trimmed = input.trim();
    if (!trimmed) {
        return undefined;
    }
    return trimmed.slice(0, MAX_TITLE_LENGTH);
}

type RouteContext = {
    params: Promise<{ conversationId: string }>;
};

export async function GET(_: NextRequest, { params }: RouteContext) {
    const { userId } = await auth();
    const resolvedUserId = userId ?? process.env.LOCAL_DEV_USER_ID ?? null;
    if (!resolvedUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    try {
        await connectDB();
    } catch (e: any) {
        console.error('[Conversations.ID.GET] DB connect error:', e?.message);
        return NextResponse.json({ error: 'DB_UNAVAILABLE', detail: e?.message ?? 'Database not reachable' }, { status: 503 });
    }
    const conversation = await Conversation.findOne({ _id: conversationId, clerkId: resolvedUserId });

    if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ conversation: toPayload(conversation) }, { status: 200 });
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
    const { userId } = await auth();
    const resolvedUserId = userId ?? process.env.LOCAL_DEV_USER_ID ?? null;
    if (!resolvedUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        body = {};
    }

    const title = clampTitle(body.title);
    const hasMessagesField = Object.prototype.hasOwnProperty.call(body, 'messages');
    const messages = hasMessagesField ? sanitizeMessages(body.messages) : undefined;

    if (!title && messages === undefined) {
        return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    try {
        await connectDB();
    } catch (e: any) {
        console.error('[Conversations.ID.PUT] DB connect error:', e?.message);
        return NextResponse.json({ error: 'DB_UNAVAILABLE', detail: e?.message ?? 'Database not reachable' }, { status: 503 });
    }
    const conversation = await Conversation.findOne({ _id: conversationId, clerkId: resolvedUserId });

    if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (title) {
        conversation.title = title;
    }

    if (messages) {
        conversation.messages = messages;
        if (messages.length > 0) {
            conversation.lastMessageAt = new Date(messages[messages.length - 1].createdAt);
        } else {
            conversation.lastMessageAt = new Date();
        }
    }

    await conversation.save();
    return NextResponse.json({ conversation: toPayload(conversation) }, { status: 200 });
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
    const { userId } = await auth();
    const resolvedUserId = userId ?? process.env.LOCAL_DEV_USER_ID ?? null;
    if (!resolvedUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    try {
        await connectDB();
    } catch (e: any) {
        console.error('[Conversations.ID.DELETE] DB connect error:', e?.message);
        return NextResponse.json({ error: 'DB_UNAVAILABLE', detail: e?.message ?? 'Database not reachable' }, { status: 503 });
    }
    const deleted = await Conversation.findOneAndDelete({ _id: conversationId, clerkId: resolvedUserId });

    if (!deleted) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
}
