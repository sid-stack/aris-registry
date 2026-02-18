import { HeroSection, LogosSection } from "@/components/ui/hero-1";
import { Header } from "@/components/ui/header-1";

export default function DemoOne() {
    return (
        <div className="flex w-full flex-col min-h-screen bg-background text-foreground" >
            <Header />
            <main className="grow" >
                <HeroSection />
                <LogosSection />
            </main>
        </div>
    );
}
