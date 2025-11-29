import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function checkUserEmail() {
    const userId = "user_35p4B9JJjSKeexSSI3vhN7aNAHm";
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    console.log("User Email:", user?.email);
    process.exit(0);
}
checkUserEmail();
