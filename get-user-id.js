// get-user-id.js
// Run this script to get your Clerk user ID from the database

import { db } from './src/db/index.js';
import { users } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

const email = 'ilereb31927@gaabiace.com';

const user = await db.query.users.findFirst({
    where: eq(users.email, email),
});

if (user) {
    console.log('\n✅ User found!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.firstName, user.lastName);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Copy this ID for Step 2:');
    console.log(user.id);
    console.log('\n');
} else {
    console.log('❌ User not found with email:', email);
}

process.exit(0);
