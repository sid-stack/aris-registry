import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User, Analysis } from '@/models';
import { runFullAnalysis } from '@/lib/aris-protocol';

const FREE_TIER_LIMIT = 5;
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB ?? '10');
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(req: NextRequest) {
    // 1. Authenticate via Clerk
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse multipart form
    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('file') as File | null;
    if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
            { error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` },
            { status: 413 }
        );
    }

    // 3. Connect to DB and enforce credit check (atomic)
    await connectDB();

    const user = await User.findOneAndUpdate(
        { clerkId: userId, credits: { $gt: 0 } },
        { $inc: { credits: -1, analysesUsed: 1 } },
        { new: true, upsert: false }
    );

    // If no document was updated, either user doesn't exist or no credits
    if (!user) {
        // Check if user exists at all
        const existingUser = await User.findOne({ clerkId: userId });
        if (!existingUser) {
            // First time — create user with 5 credits and deduct 1 immediately
            await User.create({
                clerkId: userId,
                email: '',
                credits: 4, // 5 - 1
                analysesUsed: 1
            });
        } else {
            // No credits left
            return NextResponse.json(
                { error: 'Insufficient credits. Please top up your balance.' },
                { status: 402 }
            );
        }
    }

    // 4. Extract PDF text
    let pdfText = '';
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Dynamic import to avoid SSR issues
        const pdfParse = (await import('pdf-parse')).default;
        const parsed = await pdfParse(buffer);
        pdfText = parsed.text;
    } catch (e) {
        console.error('PDF parse error:', e);
        return NextResponse.json({ error: 'Failed to read PDF. Ensure it is a valid PDF file.' }, { status: 422 });
    }

    if (!pdfText || pdfText.trim().length < 100) {
        return NextResponse.json(
            { error: 'PDF appears to be empty or image-only (scanned). Please upload a text-based PDF.' },
            { status: 422 }
        );
    }

    // 5. Run the 3-agent free pipeline (ARIS-1, 2, 3)
    let analysis;
    try {
        analysis = await runFullAnalysis(pdfText);
    } catch (e) {
        console.error('Aris Protocol error:', e);
        return NextResponse.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 });
    }

    // 6. Save to MongoDB
    const saved = await Analysis.create({
        clerkId: userId,
        fileName: file.name,
        fileSize: file.size,
        projectTitle: analysis.projectTitle,
        agency: analysis.agency,
        naicsCode: analysis.naicsCode,
        setAside: analysis.setAside,
        estValue: analysis.estValue,
        deadline: analysis.deadline,
        complianceItems: analysis.complianceItems,
        winThemes: analysis.winThemes,
        keyRisks: analysis.keyRisks,
        execBriefing: analysis.execBriefing,
        winScore: analysis.winScore,
        matchScore: analysis.matchScore,
        isValidRfp: analysis.isValidRfp,
        rejectionReason: analysis.rejectionReason,
    });

    return NextResponse.json({ id: saved._id.toString(), ...analysis }, { status: 200 });
}
