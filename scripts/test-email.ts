import { config } from "dotenv";
import { resolve } from "path";
import { Resend } from "resend";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

async function testEmail() {
    console.log("📧 Testing Resend Email Sending...");

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error("❌ Error: RESEND_API_KEY is missing in .env.local");
        process.exit(1);
    }
    console.log(`🔑 API Key found: ${apiKey.substring(0, 4)}...`);

    const resend = new Resend(apiKey);

    const recipient = process.argv[2] || "delivered@resend.dev";
    console.log(`📨 Sending to: ${recipient}`);

    try {
        const { data, error } = await resend.emails.send({
            from: "Stipends <onboarding@resend.dev>",
            to: recipient,
            subject: "Test Email from Perks App",
            html: "<p>This is a test email to verify Resend configuration.</p>",
        });

        if (error) {
            console.error("❌ Resend API Error:", error);
            process.exit(1);
        }

        console.log("✅ Email sent successfully!");
        console.log("🆔 Email ID:", data?.id);

    } catch (err) {
        console.error("❌ Unexpected Error:", err);
        process.exit(1);
    }
}

testEmail();
