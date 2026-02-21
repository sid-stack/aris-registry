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

type ConversationListItem = {
    id: string;
    title: string;
    messageCount: number;
    preview: string;
    lastMessageAt: string;
    createdAt: string;
    updatedAt: string;
};

function clampTitle(input?: string): string {
    const trimmed = input?.trim();
    if (!trimmed) {
        return 'New conversation';
    }
    return trimmed.slice(0, MAX_TITLE_LENGTH);
}

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

function deriveTitle(title: string | undefined, messages: IConversationMessage[]): string {
    const normalizedTitle = clampTitle(title);
    if (normalizedTitle !== 'New conversation') {
        return normalizedTitle;
    }

    const firstUserMessage = messages.find((message) => message.role === 'user');
    if (!firstUserMessage) {
        return normalizedTitle;
    }

    const preview = firstUserMessage.content.replace(/\s+/g, ' ').trim();
    if (!preview) {
        return normalizedTitle;
    }

    return preview.slice(0, MAX_TITLE_LENGTH);
}

export async function GET() {
    const { userId } = await auth();
    const resolvedUserId = userId ?? process.env.LOCAL_DEV_USER_ID ?? null;
    if (!resolvedUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectDB();
    } catch (e: any) {
        console.error('[Conversations.GET] DB connect error:', e?.message);
        return NextResponse.json({ error: 'DB_UNAVAILABLE', detail: e?.message ?? 'Database not reachable' }, { status: 503 });
    }
    const conversations = await Conversation.find({ clerkId: resolvedUserId })
        .sort({ updatedAt: -1 })
        .limit(100)
        .lean();

    const conversationList: ConversationListItem[] = conversations.map((conversation) => {
        const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
        const latest = messages[messages.length - 1];
        return {
            id: String(conversation._id),
            title: conversation.title || 'New conversation',
            messageCount: messages.length,
            preview: latest?.content?.slice(0, 120) || 'No messages yet',
            lastMessageAt: toIsoDate(conversation.lastMessageAt),
            updatedAt: toIsoDate(conversation.updatedAt),
            createdAt: toIsoDate(conversation.createdAt),
        };
    });

    return NextResponse.json({ conversations: conversationList }, { status: 200 });
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    const resolvedUserId = userId ?? process.env.LOCAL_DEV_USER_ID ?? null;
    if (!resolvedUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        body = {};
    }

    const inputMessages = sanitizeMessages(body.messages);
    const inputTitle = typeof body.title === 'string' ? body.title : undefined;
    const title = deriveTitle(inputTitle, inputMessages);
    const lastMessageAt =
        inputMessages.length > 0
            ? new Date(inputMessages[inputMessages.length - 1].createdAt)
            : new Date();

    try {
        await connectDB();
    } catch (e: any) {
        console.error('[Conversations.POST] DB connect error:', e?.message);
        return NextResponse.json({ error: 'DB_UNAVAILABLE', detail: e?.message ?? 'Database not reachable' }, { status: 503 });
    }
    const created = await Conversation.create({
        clerkId: resolvedUserId,
        title,
        messages: inputMessages,
        lastMessageAt,
    });

    return NextResponse.json({ conversation: toPayload(created) }, { status: 201 });
}
