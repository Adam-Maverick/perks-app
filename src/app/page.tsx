import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-clean-white">
            <div className="text-center space-y-6 max-w-2xl">
                <h1 className="font-outfit text-6xl md:text-7xl font-bold text-electric-royal-blue">
                    Stipends
                </h1>
                <p className="font-inter text-xl md:text-2xl text-gray-700">
                    Financial wellness platform for Nigerian employees
                </p>

                <div className="flex gap-4 justify-center mt-8">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="px-6 py-3 bg-electric-royal-blue text-white font-outfit font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                Sign In
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="px-6 py-3 border-2 border-electric-royal-blue text-electric-royal-blue font-outfit font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                                Sign Up
                            </button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <div className="flex flex-col items-center gap-4">
                            <UserButton afterSignOutUrl="/" />
                            <Link href="/dashboard" className="px-6 py-3 bg-vibrant-coral text-white font-outfit font-semibold rounded-lg hover:bg-orange-600 transition-colors">
                                Go to Dashboard
                            </Link>
                        </div>
                    </SignedIn>
                </div>

                <p className="text-sm text-gray-500 mt-4">
                    Empowering employees with tax-efficient benefits and verified marketplace deals
                </p>
            </div>
        </main>
    );
}
