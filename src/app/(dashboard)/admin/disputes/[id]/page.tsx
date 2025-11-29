import { AlertCircle } from "lucide-react";

export default function AdminDisputePage() {
    return (
        <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                    <AlertCircle className="w-8 h-8 text-blue-600" />
                </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dispute Resolution</h1>
            <p className="text-gray-500 mb-6">
                This feature is coming soon. Use the database or manual scripts to resolve disputes for now.
            </p>
            <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                Return to Dashboard
            </div>
        </div>
    );
}
