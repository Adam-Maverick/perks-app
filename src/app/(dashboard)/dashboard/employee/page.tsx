import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import EmployeeProfile from "@/components/modules/employee/EmployeeProfile";

export default async function EmployeeDashboard() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const user = await currentUser();
    const firstName = user?.firstName || "there";

    return (
        <div className="min-h-screen bg-clean-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <h1 className="font-outfit text-2xl font-bold text-electric-royal-blue">
                        Stipends
                    </h1>
                    <nav className="flex items-center gap-6">
                        <a href="/dashboard/employee" className="text-gray-700 hover:text-electric-royal-blue transition-colors">
                            Dashboard
                        </a>
                        <a href="/dashboard/employee/deals" className="text-gray-700 hover:text-electric-royal-blue transition-colors">
                            Deals
                        </a>
                        <a href="/dashboard/employee/wallet" className="text-gray-700 hover:text-electric-royal-blue transition-colors">
                            Wallet
                        </a>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Welcome Section with Profile */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2">
                        <h2 className="font-outfit text-3xl font-bold text-gray-900 mb-2">
                            Welcome back, {firstName}! 👋
                        </h2>
                        <p className="font-inter text-gray-600">
                            Here's what's happening with your benefits today.
                        </p>
                    </div>
                    <div className="lg:col-span-1">
                        <EmployeeProfile />
                    </div>
                </div>

                {/* Dashboard Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Wallet Widget Placeholder */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-electric-royal-blue/10 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">💰</span>
                            </div>
                            <h3 className="font-outfit text-lg font-semibold text-gray-900">
                                Stipend Wallet
                            </h3>
                        </div>
                        <p className="font-inter text-3xl font-bold text-electric-royal-blue mb-2">
                            ₦0.00
                        </p>
                        <p className="font-inter text-sm text-gray-500">
                            Available balance
                        </p>
                    </div>

                    {/* Deals Widget Placeholder */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-vibrant-coral/10 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🎁</span>
                            </div>
                            <h3 className="font-outfit text-lg font-semibold text-gray-900">
                                Active Deals
                            </h3>
                        </div>
                        <p className="font-inter text-3xl font-bold text-vibrant-coral mb-2">
                            0
                        </p>
                        <p className="font-inter text-sm text-gray-500">
                            Explore marketplace
                        </p>
                    </div>

                    {/* Tax Shield Widget Placeholder */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-electric-lime/10 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🛡️</span>
                            </div>
                            <h3 className="font-outfit text-lg font-semibold text-gray-900">
                                Tax Savings
                            </h3>
                        </div>
                        <p className="font-inter text-3xl font-bold text-electric-lime mb-2">
                            ₦0.00
                        </p>
                        <p className="font-inter text-sm text-gray-500">
                            Estimated annual savings
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-gradient-to-r from-electric-royal-blue to-blue-600 rounded-lg p-6 text-white">
                    <h3 className="font-outfit text-xl font-semibold mb-3">
                        Get Started
                    </h3>
                    <p className="font-inter mb-4 opacity-90">
                        Complete your profile and start exploring exclusive deals from our merchant partners.
                    </p>
                    <a href="/dashboard/employee/marketplace" className="inline-block bg-white text-electric-royal-blue px-6 py-2 rounded-lg font-outfit font-semibold hover:bg-gray-100 transition-colors">
                        Browse Deals
                    </a>
                </div>
            </main>
        </div>
    );
}
