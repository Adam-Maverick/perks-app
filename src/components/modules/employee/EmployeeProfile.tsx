import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { organizations, employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import Image from "next/image";

export default async function EmployeeProfile() {
    const { userId, orgId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return null;

    // Fetch organization data from multiple sources
    let orgName = "No Organization";
    let orgLogo = null;

    // Strategy 1: Check Clerk organization (for SSO users)
    if (orgId) {
        const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, orgId),
        });
        if (org) {
            orgName = org.name;
            orgLogo = org.logoUrl;
        }
    }

    // Strategy 2: Fallback to employee record (for invitation-based users)
    if (orgName === "No Organization") {
        const employee = await db.query.employees.findFirst({
            where: eq(employees.userId, userId),
        });

        if (employee) {
            const org = await db.query.organizations.findFirst({
                where: eq(organizations.id, employee.organizationId),
            });
            if (org) {
                orgName = org.name;
                orgLogo = org.logoUrl;
            }
        }
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    {/* User Avatar */}
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100">
                        <Image
                            src={user.imageUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* User Info */}
                    <div>
                        <h3 className="font-outfit text-xl font-bold text-gray-900">
                            {user.firstName} {user.lastName}
                        </h3>
                        <p className="font-inter text-sm text-gray-500">
                            {user.emailAddresses[0]?.emailAddress}
                        </p>

                        {/* Organization Badge */}
                        <div className="mt-2 flex items-center gap-2">
                            {orgLogo && (
                                <div className="relative w-5 h-5 rounded-full overflow-hidden">
                                    <Image
                                        src={orgLogo}
                                        alt={orgName}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-electric-royal-blue">
                                {orgName}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Edit Action */}
                <button className="text-sm font-medium text-gray-500 hover:text-electric-royal-blue transition-colors">
                    Edit Profile
                </button>
            </div>
        </div>
    );
}
