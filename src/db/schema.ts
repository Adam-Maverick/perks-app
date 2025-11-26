import { pgTable, text, timestamp, uuid, pgEnum, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['admin', 'member']);
export const employeeStatusEnum = pgEnum('employee_status', ['active', 'inactive', 'invited']);

// Users Table (Synced from Clerk)
export const users = pgTable('users', {
    id: text('id').primaryKey(), // Clerk ID
    email: text('email').notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organizations Table (Synced from Clerk)
export const organizations = pgTable('organizations', {
    id: text('id').primaryKey(), // Clerk Org ID
    name: text('name').notNull(),
    slug: text('slug').unique(),
    logoUrl: text('logo_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Employers Table (Links User to Organization as an Admin/Manager)
export const employers = pgTable('employers', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    organizationId: text('organization_id').references(() => organizations.id).notNull(),
    role: roleEnum('role').default('member').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Employees Table (The workforce)
export const employees = pgTable('employees', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id), // Nullable until they sign up
    organizationId: text('organization_id').references(() => organizations.id).notNull(),
    email: text('email').notNull(), // Work email
    role: text('role').default('employee').notNull(),
    status: employeeStatusEnum('status').default('invited').notNull(),
    department: text('department'),
    jobTitle: text('job_title'),
    joinedAt: timestamp('joined_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Invitations Table (For non-SSO registration)
export const invitations = pgTable('invitations', {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').unique().notNull(),
    employerId: text('employer_id').references(() => organizations.id).notNull(),
    email: text('email'), // Optional: if invite is targeted to specific email
    usedAt: timestamp('used_at'),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Account Transfers Audit Log (NDPR Compliance)
export const accountTransfers = pgTable('account_transfers', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    oldOrganizationId: text('old_organization_id').references(() => organizations.id).notNull(),
    newOrganizationId: text('new_organization_id').references(() => organizations.id).notNull(),
    invitationCode: text('invitation_code').notNull(),
    transferredAt: timestamp('transferred_at').defaultNow().notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
});

// Wallets Table (Linked to User for Portability)
export const wallets = pgTable('wallets', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(), // Linked to User, NOT Organization
    balance: integer('balance').default(0).notNull(), // Stored in minor units (e.g., kobo/cents)
    currency: text('currency').default('NGN').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions Table (Extended for Story 3.2: Paystack Integration)
export const transactionTypeEnum = pgEnum('transaction_type', ['credit', 'debit']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed']);

export const transactions = pgTable('transactions', {
    id: uuid('id').defaultRandom().primaryKey(),
    walletId: uuid('wallet_id').references(() => wallets.id),  // Nullable for payment transactions
    userId: text('user_id').references(() => users.id).notNull(),
    type: transactionTypeEnum('type').notNull(),
    amount: integer('amount').notNull(),
    description: text('description'),
    reference: text('reference').unique(),
    status: transactionStatusEnum('status').default('pending').notNull(),

    // Story 3.2: Paystack payment transaction fields
    dealId: uuid('deal_id').references(() => deals.id),  // Nullable for wallet transactions
    merchantId: uuid('merchant_id').references(() => merchants.id),  // Nullable for wallet transactions
    escrowHoldId: uuid('escrow_hold_id'),  // Nullable until escrow created. No FK to avoid circular dependency.
    paystackReference: text('paystack_reference').unique(),  // Paystack transaction reference

    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    paystackRefIdx: index('transactions_paystack_ref_idx').on(table.paystackReference),
    statusIdx: index('transactions_status_idx').on(table.status),
    userIdx: index('transactions_user_id_idx').on(table.userId),
}));

// Relations
export const employeesRelations = relations(employees, ({ one }) => ({
    user: one(users, {
        fields: [employees.userId],
        references: [users.id],
    }),
    organization: one(organizations, {
        fields: [employees.organizationId],
        references: [organizations.id],
    }),
}));

export const employersRelations = relations(employers, ({ one }) => ({
    user: one(users, {
        fields: [employers.userId],
        references: [users.id],
    }),
    organization: one(organizations, {
        fields: [employers.organizationId],
        references: [organizations.id],
    }),
}));



// ============================================
// MARKETPLACE SCHEMA (Story 2.1)
// ============================================

// Trust Level Enum for Merchants
export const trustLevelEnum = pgEnum('trust_level', ['VERIFIED', 'EMERGING']);

// Categories Table
export const categories = pgTable('categories', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    icon: text('icon'), // Emoji or icon name
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Merchants Table (Extended for Story 3.2: Paystack Transfer Recipients)
export const merchants = pgTable('merchants', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    logoUrl: text('logo_url'),
    trustLevel: trustLevelEnum('trust_level').notNull(),
    location: text('location'), // e.g., "Lagos, Nigeria"
    contactInfo: text('contact_info'), // JSON string with phone/email
    paystackRecipientCode: text('paystack_recipient_code'),  // Story 3.2: Transfer Recipient code
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    trustLevelIdx: index('merchants_trust_level_idx').on(table.trustLevel),
}));

// Merchant Badges Table
export const merchantBadges = pgTable('merchant_badges', {
    id: uuid('id').defaultRandom().primaryKey(),
    merchantId: uuid('merchant_id').references(() => merchants.id).notNull(),
    badgeType: text('badge_type').notNull(), // e.g., "VERIFIED", "TOP_RATED"
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Deals Table
export const deals = pgTable('deals', {
    id: uuid('id').defaultRandom().primaryKey(),
    merchantId: uuid('merchant_id').references(() => merchants.id).notNull(),
    categoryId: uuid('category_id').references(() => categories.id).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    discountPercentage: integer('discount_percentage'), // e.g., 20 for 20%
    originalPrice: integer('original_price').notNull(), // In kobo (e.g., 500000 for ₦5,000)
    validUntil: timestamp('valid_until'),
    inventoryCount: integer('inventory_count'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    categoryIdx: index('deals_category_id_idx').on(table.categoryId),
    merchantIdx: index('deals_merchant_id_idx').on(table.merchantId),
}));

// Marketplace Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
    deals: many(deals),
}));

export const merchantsRelations = relations(merchants, ({ many }) => ({
    deals: many(deals),
    badges: many(merchantBadges),
}));

export const merchantBadgesRelations = relations(merchantBadges, ({ one }) => ({
    merchant: one(merchants, {
        fields: [merchantBadges.merchantId],
        references: [merchants.id],
    }),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
    merchant: one(merchants, {
        fields: [deals.merchantId],
        references: [merchants.id],
    }),
    category: one(categories, {
        fields: [deals.categoryId],
        references: [categories.id],
    }),
}));

// ============================================
// ESCROW SCHEMA (Story 3.1)
// ============================================

// Escrow State Enum
export const escrowStateEnum = pgEnum('escrow_state', ['HELD', 'RELEASED', 'DISPUTED', 'REFUNDED']);

// Escrow Holds Table
export const escrowHolds = pgTable('escrow_holds', {
    id: uuid('id').defaultRandom().primaryKey(),
    transactionId: uuid('transaction_id').references(() => transactions.id).notNull(),
    merchantId: uuid('merchant_id').references(() => merchants.id).notNull(),
    amount: integer('amount').notNull(), // In kobo
    state: escrowStateEnum('state').default('HELD').notNull(),
    heldAt: timestamp('held_at').defaultNow().notNull(),
    releasedAt: timestamp('released_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    stateIdx: index('escrow_holds_state_idx').on(table.state),
    heldAtIdx: index('escrow_holds_held_at_idx').on(table.heldAt),
}));

// Escrow Audit Log Table (Compliance)
export const escrowAuditLog = pgTable('escrow_audit_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    escrowHoldId: uuid('escrow_hold_id').references(() => escrowHolds.id).notNull(),
    fromState: text('from_state'), // Nullable for initial creation
    toState: text('to_state').notNull(),
    actorId: text('actor_id').notNull(), // User ID or 'SYSTEM'
    reason: text('reason').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Escrow Relations
export const escrowHoldsRelations = relations(escrowHolds, ({ one, many }) => ({
    transaction: one(transactions, {
        fields: [escrowHolds.transactionId],
        references: [transactions.id],
    }),
    merchant: one(merchants, {
        fields: [escrowHolds.merchantId],
        references: [merchants.id],
    }),
    auditLogs: many(escrowAuditLog),
}));

export const escrowAuditLogRelations = relations(escrowAuditLog, ({ one }) => ({
    escrowHold: one(escrowHolds, {
        fields: [escrowAuditLog.escrowHoldId],
        references: [escrowHolds.id],
    }),
}));

// Transactions Relations (Story 3.2) - Moved to end to avoid circular dependencies
export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(users, {
        fields: [transactions.userId],
        references: [users.id],
    }),
    wallet: one(wallets, {
        fields: [transactions.walletId],
        references: [wallets.id],
    }),
    deal: one(deals, {
        fields: [transactions.dealId],
        references: [deals.id],
    }),
    merchant: one(merchants, {
        fields: [transactions.merchantId],
        references: [merchants.id],
    }),
    escrowHold: one(escrowHolds, {
        fields: [transactions.escrowHoldId],
        references: [escrowHolds.id],
    }),
}));

