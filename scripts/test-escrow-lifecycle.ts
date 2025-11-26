import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';

// Load environment variables BEFORE importing app code
config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}

async function runDemo() {
    console.log('🚀 Starting Escrow Lifecycle Demo...\n');

    // Dynamic imports to ensure env vars are loaded
    const schema = await import('../src/db/schema');
    const { transitionState, EscrowStates } = await import('../src/lib/escrow-state-machine');

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    let transactionId: string | null = null;
    let escrowHoldId: string | null = null;

    try {
        // 1. Find a merchant
        const merchant = await db.query.merchants.findFirst();
        if (!merchant) {
            throw new Error('No merchants found. Please run db:seed first.');
        }
        console.log(`✅ Found Merchant: ${merchant.name} (${merchant.id})`);

        // 2. Find or Create User
        let user = await db.query.users.findFirst();
        if (!user) {
            console.log('⚠️ No user found. Creating dummy user...');
            const [newUser] = await db.insert(schema.users).values({
                id: `user_${Date.now()}`,
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
            }).returning();
            user = newUser;
        }
        console.log(`✅ Using User: ${user.email} (${user.id})`);

        // 3. Find or Create Wallet
        let wallet = await db.query.wallets.findFirst({
            where: eq(schema.wallets.userId, user.id)
        });
        if (!wallet) {
            console.log('⚠️ No wallet found. Creating dummy wallet...');
            const [newWallet] = await db.insert(schema.wallets).values({
                userId: user.id,
                balance: 1000000, // 10,000.00
                currency: 'NGN',
            }).returning();
            wallet = newWallet;
        }
        console.log(`✅ Using Wallet: ${wallet.id}`);

        // 4. Create Transaction
        console.log('Creating Transaction...');
        const [transaction] = await db.insert(schema.transactions).values({
            walletId: wallet.id,
            userId: user.id,
            type: 'debit',
            amount: 500000, // 5,000.00
            description: 'Test Escrow Transaction',
            status: 'pending',
            reference: `REF-${Date.now()}`,
        }).returning();
        console.log(`✅ Created Transaction: ${transaction.id}`);

        // 5. Create Escrow Hold
        console.log('Creating Escrow Hold...');
        const [hold] = await db.insert(schema.escrowHolds).values({
            transactionId: transaction.id,
            merchantId: merchant.id,
            amount: 500000,
            state: EscrowStates.HELD,
        }).returning();
        console.log(`✅ Created Escrow Hold: ${hold.id} (State: ${hold.state})`);

        // 6. Demonstrate Transitions
        console.log('\n--- Transition 1: HELD -> RELEASED ---');
        const result1 = await transitionState(
            hold.id,
            EscrowStates.RELEASED,
            user.id,
            'Manual release by user'
        );

        if (result1.success) {
            console.log('✅ Transition Successful');
        } else {
            console.error('❌ Transition Failed:', result1.error);
        }

        // Verify State
        const updatedHold = await db.query.escrowHolds.findFirst({
            where: eq(schema.escrowHolds.id, hold.id)
        });
        console.log(`Current State: ${updatedHold?.state}`);

        // 7. Check Audit Logs
        console.log('\n--- Audit Logs ---');
        const logs = await db.query.escrowAuditLog.findMany({
            where: eq(schema.escrowAuditLog.escrowHoldId, hold.id)
        });

        logs.forEach(log => {
            console.log(`[${log.createdAt.toISOString()}] ${log.fromState} -> ${log.toState} | Actor: ${log.actorId} | Reason: ${log.reason}`);
        });

        console.log('\n🎉 Demo Completed Successfully!');

    } catch (error) {
        console.error('❌ Demo Failed:', error);
    } finally {
        await pool.end();
    }
}

runDemo();
