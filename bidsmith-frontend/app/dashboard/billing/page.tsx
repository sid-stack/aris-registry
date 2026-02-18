import { UserButton } from "@clerk/nextjs";

export default function BillingPage() {
    const stripeProLink = "https://buy.stripe.com/678..."; // Your $99 link - Placeholder

    return (
        <div className="p-8 max-w-4xl mx-auto text-white">
            <h1 className="text-3xl font-bold mb-6">Subscription & Credits</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Balance Card */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <p className="text-zinc-400 text-sm">Current Balance</p>
                    {/* In a real implementation, fetch this from API or pass as prop */}
                    <h2 className="text-4xl font-mono font-bold text-green-400">$5.00</h2>
                    <p className="mt-2 text-xs text-zinc-500">Each bid analysis costs $0.99</p>
                </div>

                {/* Upgrade Card */}
                <div className="p-6 bg-blue-600 rounded-2xl flex flex-col justify-between shadow-lg shadow-blue-900/20">
                    <div>
                        <h2 className="text-xl font-bold text-white">BidSmith Pro</h2>
                        <p className="text-blue-100 text-sm">Unlimited high-volume analysis.</p>
                    </div>
                    <a href={stripeProLink} className="mt-4 block text-center bg-white text-blue-600 py-2 rounded-lg font-bold hover:bg-zinc-100 transition-all">
                        Upgrade for $99/mo
                    </a>
                </div>
            </div>
        </div>
    );
}
