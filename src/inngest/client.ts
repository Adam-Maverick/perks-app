import { Inngest } from "inngest";

// Create Inngest client for perks-app
// This client is used to define and trigger Inngest functions
export const inngest = new Inngest({
    id: "perks-app",
    name: "Perks App",
});
