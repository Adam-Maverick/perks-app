import { db } from "@/db";
import { employees, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RosterPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    // Get current employer organization
    const employer = await db.query.employers.findFirst({
        where: eq(employees.userId, userId),
        with: {
            organization: true,
        },
    });

    if (!employer) {
        return <div>Organization not found</div>;
    }

    const orgId = employer.organizationId;

    // Fetch all employees for this organization
    const roster = await db.query.employees.findMany({
        where: eq(employees.organizationId, orgId),
        orderBy: [desc(employees.joinedAt)],
        with: {
            user: true, // Join with users table to get names/emails
        },
    });

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-outfit font-bold text-gray-900">Employee Roster</h1>
                    <p className="text-gray-600 mt-1">Manage your team and view their status</p>
                </div>
                <button className="bg-royal-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Invite Employee
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-4 font-semibold text-gray-700">Employee</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Role</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Department</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {roster.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No employees found. Invite your first team member!
                                </td>
                            </tr>
                        ) : (
                            roster.map((emp) => (
                                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                                                {emp.user?.firstName?.[0] || emp.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : "Pending User"}
                                                </div>
                                                <div className="text-sm text-gray-500">{emp.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 capitalize">{emp.role}</td>
                                    <td className="px-6 py-4 text-gray-600">{emp.department || "-"}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-green-100 text-green-800' :
                                            emp.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                                                emp.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {emp.status === 'inactive' ? 'Transferred' : emp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {emp.joinedAt ? new Date(emp.joinedAt).toLocaleDateString() : "-"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
