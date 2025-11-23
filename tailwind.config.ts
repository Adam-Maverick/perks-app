import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'electric-royal-blue': '#2563EB',
                'vibrant-coral': '#FA7921',
                'electric-lime': '#96E072',
                'clean-white': '#FFFFFF',
                'soft-light-grey': '#F8F9FA',
            },
            fontFamily: {
                outfit: ['var(--font-outfit)', 'sans-serif'],
                inter: ['var(--font-inter)', 'sans-serif'],
            },
        },
    },
    plugins: [],
};

export default config;
