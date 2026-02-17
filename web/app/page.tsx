theimport Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans">

            {/* --- NAVBAR --- */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                            <span className="font-bold text-white text-lg">B</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">BidSmith</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
                            How it Works
                        </Link>
                        <Link href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
                            Pricing
                        </Link>
                        <Link href="#docs" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
                            Docs
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* THE LAUNCH BUTTON - NAVBAR */}
                        <Link
                            href="/dashboard"
                            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] border border-blue-400/20"
                        >
                            Launch App
                        </Link>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <main className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center overflow-hidden">

                {/* Background Gradients */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
                <div className="absolute top-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto mt-20">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-medium text-blue-400 mb-8 backdrop-blur-md animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Powered by the Aris Protocol
                    </div>

                    {/* Headlines */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 animate-fade-in drop-shadow-2xl">
                        BidSmith: The AI that wins <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 selection:text-white">government contracts.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed animate-fade-in-delayed">
                        Automate RFP discovery, research, and proposal writing.
                        Deploy autonomous agents to secure public sector funding 10x faster.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-5 items-center animate-fade-in-delayed-more">
                        <Link
                            href="/dashboard"
                            className="group relative px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] overflow-hidden"
                        >
                            <span className="relative z-10">Launch App</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        </Link>

                        <Link
                            href="https://arislabs.ai"
                            target="_blank"
                            className="px-8 py-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all backdrop-blur-sm"
                        >
                            Learn More
                        </Link>
                    </div>

                    {/* Trust Indicators / Stats */}
                    <div className="mt-20 pt-10 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 opacity-60">
                        <div>
                            <div className="text-2xl font-bold text-white">$400B+</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Market Size</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">10x</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Faster Analysis</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">24/7</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Monitoring</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">Zero</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Hallucinations</div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
