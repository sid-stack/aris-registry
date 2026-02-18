import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── User ────────────────────────────────────────────────────────────────────
export interface IUser extends Document {
    clerkId: string;
    email: string;
    credits: number;                        // Balance (starts at 5)
    isPro: boolean;
    analysesUsed: number;                   // Lifecycle counter
    processedStripeSessionIds: string[];    // Idempotency: track processed Stripe sessions
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        clerkId: { type: String, required: true, unique: true, index: true },
        email: { type: String, required: true },
        credits: { type: Number, default: 5 },
        isPro: { type: Boolean, default: false },
        analysesUsed: { type: Number, default: 0 },
        processedStripeSessionIds: { type: [String], default: [] },
    },
    { timestamps: true }
);

// ─── Analysis ────────────────────────────────────────────────────────────────
export interface IAnalysis extends Document {
    clerkId: string;
    fileName: string;
    fileSize: number;

    // ARIS-1: Intelligence Extractor
    projectTitle: string;
    agency: string;
    naicsCode: string;
    setAside: string;
    estValue: string;
    deadline: string;
    complianceItems: string[];

    // ARIS-2: Strategic Analyst
    winThemes: string[];
    keyRisks: string[];
    execBriefing: string;

    // ARIS-3: Win Probability Scorer
    winScore: number;     // 0–100
    matchScore: string;     // e.g. "8.5/10"

    // ARIS-4: Proposal Architect (Pro — $0.99)
    proposalDraft: string | null;
    proposalPaidAt: Date | null;

    isValidRfp: boolean;
    rejectionReason: string;
    createdAt: Date;
}

const AnalysisSchema = new Schema<IAnalysis>(
    {
        clerkId: { type: String, required: true, index: true },
        fileName: { type: String, required: true },
        fileSize: { type: Number, required: true },

        projectTitle: { type: String, default: 'Unknown Project' },
        agency: { type: String, default: 'Unknown Agency' },
        naicsCode: { type: String, default: 'TBD' },
        setAside: { type: String, default: 'None' },
        estValue: { type: String, default: 'TBD' },
        deadline: { type: String, default: 'TBD' },
        complianceItems: [{ type: String }],

        winThemes: [{ type: String }],
        keyRisks: [{ type: String }],
        execBriefing: { type: String, default: '' },

        winScore: { type: Number, default: 0 },
        matchScore: { type: String, default: 'N/A' },

        proposalDraft: { type: String, default: null },
        proposalPaidAt: { type: Date, default: null },

        isValidRfp: { type: Boolean, default: true },
        rejectionReason: { type: String, default: '' },
    },
    { timestamps: true }
);

// Prevent model re-registration in Next.js hot reload
export const User: Model<IUser> =
    mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);

export const Analysis: Model<IAnalysis> =
    mongoose.models.Analysis ?? mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
