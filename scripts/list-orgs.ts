
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listOrgs() {
    const { db } = await import('../src/db');
    const { organizations } = await import('../src/db/schema');

    const orgs = await db.select().from(organizations);
    console.log('--- Organizations ---');
    orgs.forEach(o => {
        console.log(`Name: '${o.name}', ID: '${o.id}', Slug: '${o.slug}'`);
    });
    process.exit(0);
}

listOrgs().catch(console.error);
