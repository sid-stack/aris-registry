import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google"; // Using next/font
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-fira-code" });

export const metadata: Metadata = {
    title: "Aris Network Registry",
    description: "Live Agent Directory for Aris Network",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={cn(inter.variable, firaCode.variable, "bg-neutral-950 text-white min-h-screen font-sans antialiased")}>
                {children}
            </body>
        </html>
    );
}
