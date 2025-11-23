"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { validateEmailDomain } from "@/lib/validators/email-domain";
import { useState } from "react";

export default function Page() {
    const [invitationCode, setInvitationCode] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [employerName, setEmployerName] = useState<string | null>(null);
    const [showInviteInput, setShowInviteInput] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleValidate = async () => {
        if (!invitationCode) return;
        setIsValidating(true);
        setError(null);

        try {
            // Dynamic import to avoid server-action-in-client-component issues if not handled correctly by Next.js
            // But usually direct import works in Client Components if the action is "use server"
            const { validateInvitationCode } = await import("@/server/actions/invitations");
            const result = await validateInvitationCode(invitationCode);

            if (result.success && result.data) {
                setEmployerName(result.data.employerName);
                // We could also store the employerId or code in a cookie or local storage
                // to use it after signup, or pass it to Clerk metadata if possible.
                // For now, we'll just show the success state.
            } else {
                setError(result.error || "Invalid code");
                setEmployerName(null);
            }
        } catch (err) {
            setError("Failed to validate code");
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 font-outfit">
                    Join your team
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 font-inter">
                    Sign up with your work email to access your benefits
                </p>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-[480px]">
                <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">

                    {/* Invitation Code Section */}
                    <div className="mb-6">
                        {!showInviteInput && !employerName && (
                            <button
                                onClick={() => setShowInviteInput(true)}
                                className="text-sm text-electric-royal-blue hover:underline w-full text-center"
                            >
                                Have an invitation code?
                            </button>
                        )}

                        {showInviteInput && !employerName && (
                            <div className="space-y-2">
                                <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700">
                                    Invitation Code
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="invite-code"
                                        type="text"
                                        value={invitationCode}
                                        onChange={(e) => setInvitationCode(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-electric-royal-blue focus:ring-electric-royal-blue sm:text-sm p-2 border"
                                        placeholder="ENTER-CODE"
                                    />
                                    <button
                                        onClick={handleValidate}
                                        disabled={isValidating || !invitationCode}
                                        className="inline-flex justify-center rounded-md border border-transparent bg-electric-royal-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-electric-royal-blue focus:ring-offset-2 disabled:opacity-50"
                                    >
                                        {isValidating ? "..." : "Apply"}
                                    </button>
                                </div>
                                {error && <p className="text-sm text-red-600">{error}</p>}
                            </div>
                        )}

                        {employerName && (
                            <div className="rounded-md bg-green-50 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        {/* Checkmark icon */}
                                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-green-800">Invitation Accepted</h3>
                                        <div className="mt-2 text-sm text-green-700">
                                            <p>You are joining <strong>{employerName}</strong></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <SignUp
                        appearance={{
                            elements: {
                                formButtonPrimary:
                                    "bg-electric-royal-blue hover:bg-blue-700 text-sm normal-case",
                                footerActionLink:
                                    "text-electric-royal-blue hover:text-blue-700",
                                card: "shadow-none p-0",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                            }
                        }}
                        afterSignUpUrl="/dashboard/employee"
                        signInUrl="/sign-in"
                        // Pass invitation code as unsafe metadata if supported, or we rely on post-signup linking
                        unsafeMetadata={{ invitationCode: employerName ? invitationCode : undefined }}
                    />
                </div>

                <div className="mt-6 text-center text-xs text-gray-500">
                    <p>
                        By signing up, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}
