import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/functions";

/**
 * Inngest API Route
 * 
 * This route serves all Inngest functions and handles:
 * - Function registration with Inngest Cloud
 * - Cron job execution
 * - Event-driven function triggers
 * - Webhook signature verification
 * 
 * Environment variables required:
 * - INNGEST_EVENT_KEY: For sending events to Inngest
 * - INNGEST_SIGNING_KEY: For webhook signature verification
 */
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions,
});
