import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-fira-code" });

export const metadata: Metadata = {
    title: "BidSmith — AI That Wins Government Contracts",
    description: "Automate RFP discovery, research, and proposal writing. Deploy autonomous agents to secure public sector funding 10x faster.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={cn(inter.variable, firaCode.variable, "bg-black text-white min-h-screen font-sans antialiased")}>
                {children}
            </body>
        </html>
    );
}
