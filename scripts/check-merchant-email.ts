import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
import { db } from "@/db";
import { merchants } from "@/db/schema";

async function checkMerchantEmail() {
    const merchant = await db.query.merchants.findFirst();
    let email = "None";
    if (merchant && merchant.contactInfo) {
        try {
            const contact = JSON.parse(merchant.contactInfo);
            email = contact.email || "None";
        } catch (e) {
            email = "Invalid JSON";
        }
    }
    console.log("Merchant Email:", email);
    process.exit(0);
}
checkMerchantEmail();
