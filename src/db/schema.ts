import { pgTable, text, timestamp, uuid, pgEnum, integer, index, boolean } from 'drizzle-orm/pg-core';
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
    isFlagged: boolean('is_flagged').default(false).notNull(), // Story 3.4: Fraud detection flag
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
// Story 5.1: Added unique index on user_id for 1:1 relationship
export const wallets = pgTable('wallets', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(), // Linked to User, NOT Organization
    balance: integer('balance').default(0).notNull(), // Stored in minor units (e.g., kobo/cents)
    currency: text('currency').default('NGN').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index('wallets_user_id_idx').on(table.userId).concurrently(), // Performance index
    userIdUnique: index('wallets_user_id_unique').on(table.userId), // Enforce 1:1 via unique index (AC: 2)
}));

// ============================================
// WALLET TRANSACTIONS SCHEMA (Story 5.1)
// ============================================

// Wallet Transaction Type Enum (AC: 3)
export const walletTransactionTypeEnum = pgEnum('wallet_transaction_type', [
    'DEPOSIT',    // Employer funds wallet
    'SPEND',      // Employee spends from wallet
    'REFUND',     // Refund to wallet
    'RESERVED',   // ADR-005: Reservation pattern - funds reserved but not committed
    'RELEASED',   // ADR-005: Reserved funds released (rollback)
]);

// Wallet Transaction Status Enum (AC: 4, ADR-005)
export const walletTransactionStatusEnum = pgEnum('wallet_transaction_status', [
    'PENDING',    // Transaction initiated, not yet committed
    'COMPLETED',  // Transaction committed and balance updated
    'FAILED',     // Transaction failed/rolled back
]);

// Wallet Transactions Table (AC: 3, 4)
export const walletTransactions = pgTable('wallet_transactions', {
    id: uuid('id').defaultRandom().primaryKey(),
    walletId: uuid('wallet_id').references(() => wallets.id).notNull(),
    type: walletTransactionTypeEnum('type').notNull(),
    amount: integer('amount').notNull(), // In kobo, always positive
    description: text('description'),
    referenceId: text('reference_id').unique(), // For idempotency and external links (AC: 4)
    status: walletTransactionStatusEnum('status').default('PENDING').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    walletIdIdx: index('wallet_transactions_wallet_id_idx').on(table.walletId),
    statusIdx: index('wallet_transactions_status_idx').on(table.status),
    referenceIdIdx: index('wallet_transactions_reference_id_idx').on(table.referenceId),
    createdAtIdx: index('wallet_transactions_created_at_idx').on(table.createdAt),
}));

// Wallet Relations (Story 5.1)
export const walletsRelations = relations(wallets, ({ one, many }) => ({
    user: one(users, {
        fields: [wallets.userId],
        references: [users.id],
    }),
    walletTransactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
    wallet: one(wallets, {
        fields: [walletTransactions.walletId],
        references: [wallets.id],
    }),
}));

// Transactions Table (Extended for Story 3.2: Paystack Integration)
export const transactionTypeEnum = pgEnum('transaction_type', ['credit', 'debit']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed', 'auto_completed']);

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

// Disputes Table (Story 3.4)
export const disputeStatusEnum = pgEnum('dispute_status', ['PENDING', 'UNDER_REVIEW', 'RESOLVED_EMPLOYEE_FAVOR', 'RESOLVED_MERCHANT_FAVOR']);

export const disputes = pgTable('disputes', {
    id: uuid('id').defaultRandom().primaryKey(),
    escrowHoldId: uuid('escrow_hold_id').references(() => escrowHolds.id).notNull(),
    employeeEvidenceUrls: text('employee_evidence_urls').array(), // URLs from Vercel Blob
    employeeDescription: text('employee_description').notNull(),
    merchantEvidenceUrls: text('merchant_evidence_urls').array(),
    merchantResponse: text('merchant_response'),
    status: disputeStatusEnum('status').default('PENDING').notNull(),
    resolution: text('resolution'), // Notes on resolution
    resolvedBy: text('resolved_by').references(() => users.id), // Admin ID
    resolvedAt: timestamp('resolved_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    statusIdx: index('disputes_status_idx').on(table.status),
    escrowHoldIdx: index('disputes_escrow_hold_id_idx').on(table.escrowHoldId),
    createdAtIdx: index('disputes_created_at_idx').on(table.createdAt),
}));

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
    disputes: many(disputes),
}));

export const disputesRelations = relations(disputes, ({ one }) => ({
    escrowHold: one(escrowHolds, {
        fields: [disputes.escrowHoldId],
        references: [escrowHolds.id],
    }),
    resolvedByUser: one(users, {
        fields: [disputes.resolvedBy],
        references: [users.id],
    }),
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

// ============================================
// TAX & BENEFITS SCHEMA (Story 4.2)
// ============================================

// Rent Receipts Table
export const rentReceipts = pgTable('rent_receipts', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    landlordName: text('landlord_name').notNull(),
    propertyAddress: text('property_address').notNull(),
    rentAmount: integer('rent_amount').notNull(), // In kobo (e.g., 15000000 for ₦150,000)
    paymentDate: timestamp('payment_date').notNull(),
    pdfUrl: text('pdf_url').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userIdx: index('rent_receipts_user_id_idx').on(table.userId),
    createdAtIdx: index('rent_receipts_created_at_idx').on(table.createdAt),
}));

// Rent Receipts Relations
export const rentReceiptsRelations = relations(rentReceipts, ({ one }) => ({
    user: one(users, {
        fields: [rentReceipts.userId],
        references: [users.id],
    }),
}));

// Tax Reports Table (Story 4.3: Employer Welfare Spending Report)
export const taxReports = pgTable('tax_reports', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id').references(() => organizations.id).notNull(),
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    totalFunded: integer('total_funded').notNull(), // In kobo
    totalSpent: integer('total_spent').notNull(), // In kobo
    taxDeduction: integer('tax_deduction').notNull(), // 150% of spending, in kobo
    fileUrl: text('file_url'), // Optional: PDF stored in Vercel Blob
    format: text('format').notNull(), // 'pdf' or 'csv'
    createdBy: text('created_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    orgIdx: index('tax_reports_organization_id_idx').on(table.organizationId),
    periodIdx: index('tax_reports_period_idx').on(table.periodStart, table.periodEnd),
    createdAtIdx: index('tax_reports_created_at_idx').on(table.createdAt),
}));

// Tax Reports Relations
export const taxReportsRelations = relations(taxReports, ({ one }) => ({
    organization: one(organizations, {
        fields: [taxReports.organizationId],
        references: [organizations.id],
    }),
    createdByUser: one(users, {
        fields: [taxReports.createdBy],
        references: [users.id],
    }),
}));
