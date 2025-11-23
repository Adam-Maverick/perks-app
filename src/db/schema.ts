import { pgTable, text, timestamp, uuid, pgEnum, integer } from 'drizzle-orm/pg-core';
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

// Transactions Table
export const transactionTypeEnum = pgEnum('transaction_type', ['credit', 'debit']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed']);

export const transactions = pgTable('transactions', {
    id: uuid('id').defaultRandom().primaryKey(),
    walletId: uuid('wallet_id').references(() => wallets.id).notNull(),
    userId: text('user_id').references(() => users.id).notNull(), // Redundant but useful for portability checks
    type: transactionTypeEnum('type').notNull(),
    amount: integer('amount').notNull(),
    description: text('description'),
    reference: text('reference').unique(),
    status: transactionStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

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
