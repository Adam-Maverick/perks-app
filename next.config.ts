import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    cacheOnNavigation: true,
    reloadOnOnline: true,
    disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'img.clerk.com',
            },
        ],
    },
};

export default withSerwist(nextConfig);
