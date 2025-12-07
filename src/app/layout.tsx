import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { QueryClientProviderWrapper } from "@/components/QueryClientProviderWrapper";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
    display: "swap",
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Stipends - Financial Wellness Platform",
    description: "Financial wellness platform for Nigerian employees",
    manifest: "/manifest.json",
};

export const viewport: Viewport = {
    themeColor: "#2563EB",
};

import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { OfflineBanner } from "@/components/modules/marketplace/OfflineBanner";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <QueryClientProviderWrapper>
                <html lang="en" className={`${outfit.variable} ${inter.variable}`} suppressHydrationWarning>
                    <body className="font-inter antialiased">
                        <ServiceWorkerRegister />
                        <OfflineBanner />
                        {children}
                    </body>
                </html>
            </QueryClientProviderWrapper>
        </ClerkProvider>
    );
}
