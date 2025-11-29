'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from './FileUpload';
import { createDispute } from '@/server/actions/disputes';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';

interface DisputeFormProps {
    escrowHoldId: string;
    transactionId: string;
}

export function DisputeForm({ escrowHoldId, transactionId }: DisputeFormProps) {
    const router = useRouter();
    const [description, setDescription] = useState('');
    const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim()) {
            toast.error('Please provide a description of the issue.');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createDispute({
                escrowHoldId,
                description,
                evidenceUrls,
            });

            if (result.success) {
                toast.success('Dispute submitted successfully');
                router.push(`/dashboard/employee/transactions/${transactionId}`);
            } else {
                toast.error(result.error || 'Failed to submit dispute');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                    <p className="font-medium">Before you dispute</p>
                    <p className="mt-1">
                        Opening a dispute will hold the funds and notify the merchant.
                        We recommend contacting the merchant directly first to resolve any issues.
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description of Issue <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="description"
                    rows={5}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border"
                    placeholder="Please describe what happened. Did the item not arrive? Was it damaged?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    required
                />
                <div className="flex justify-end">
                    <span className="text-xs text-gray-500">
                        {description.length} / 500 characters
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Evidence (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                    Upload photos or documents to support your claim (max 3 files).
                </p>
                <FileUpload onUploadComplete={setEvidenceUrls} maxFiles={3} />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#FA7921] border border-transparent rounded-md hover:bg-[#e66a15] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FA7921] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting || !description.trim()}
                >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit Dispute
                </button>
            </div>
        </form>
    );
}
