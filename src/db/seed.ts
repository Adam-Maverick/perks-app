import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('Please ensure .env.local file exists with DATABASE_URL');
    process.exit(1);
}

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        // Clear existing data (optional - for dev environment)
        console.log('Clearing existing data...');
        await db.delete(schema.deals);
        await db.delete(schema.merchantBadges);
        await db.delete(schema.merchants);
        await db.delete(schema.categories);

        // Seed Categories
        console.log('Seeding categories...');
        const categoriesData = [
            { name: 'Food', slug: 'food', icon: '🍔' },
            { name: 'Transport', slug: 'transport', icon: '🚗' },
            { name: 'Utilities', slug: 'utilities', icon: '⚡' },
            { name: 'Electronics', slug: 'electronics', icon: '📱' },
            { name: 'Wellness', slug: 'wellness', icon: '💪' },
        ];

        const insertedCategories = await db.insert(schema.categories).values(categoriesData).returning();
        console.log(`✅ Seeded ${insertedCategories.length} categories`);

        // Create category ID map for easy reference
        const categoryMap = insertedCategories.reduce((acc, cat) => {
            acc[cat.slug] = cat.id;
            return acc;
        }, {} as Record<string, string>);

        // Seed Merchants (5 VERIFIED, 5 EMERGING)
        console.log('Seeding merchants...');
        const merchantsData = [
            // VERIFIED Merchants
            {
                name: 'Chicken Republic',
                description: 'Nigeria\'s favorite fast food chain serving delicious chicken and sides',
                logoUrl: 'https://via.placeholder.com/150?text=CR',
                trustLevel: 'VERIFIED' as const,
                location: 'Lagos, Nigeria',
                contactInfo: JSON.stringify({ phone: '+234-800-CHICKEN', email: 'info@chickenrepublic.com' }),
            },
            {
                name: 'Shoprite',
                description: 'Leading supermarket chain offering groceries, electronics, and household items',
                logoUrl: 'https://via.placeholder.com/150?text=Shoprite',
                trustLevel: 'VERIFIED' as const,
                location: 'Ikeja, Lagos',
                contactInfo: JSON.stringify({ phone: '+234-1-SHOPRITE', email: 'customercare@shoprite.ng' }),
            },
            {
                name: 'Bolt',
                description: 'Ride-hailing service offering affordable transportation across Nigeria',
                logoUrl: 'https://via.placeholder.com/150?text=Bolt',
                trustLevel: 'VERIFIED' as const,
                location: 'Lagos, Nigeria',
                contactInfo: JSON.stringify({ phone: '+234-700-BOLT', email: 'support@bolt.eu' }),
            },
            {
                name: 'Ikeja Electric',
                description: 'Electricity distribution company serving Lagos residents',
                logoUrl: 'https://via.placeholder.com/150?text=IE',
                trustLevel: 'VERIFIED' as const,
                location: 'Ikeja, Lagos',
                contactInfo: JSON.stringify({ phone: '+234-700-IKEJA', email: 'customercare@ikejaelectric.com' }),
            },
            {
                name: 'Jumia',
                description: 'Nigeria\'s largest online marketplace for electronics, fashion, and more',
                logoUrl: 'https://via.placeholder.com/150?text=Jumia',
                trustLevel: 'VERIFIED' as const,
                location: 'Lagos, Nigeria',
                contactInfo: JSON.stringify({ phone: '+234-1-JUMIA', email: 'support@jumia.com.ng' }),
            },
            // EMERGING Merchants
            {
                name: 'Mama Put Kitchen',
                description: 'Authentic Nigerian home-cooked meals delivered fresh daily',
                logoUrl: 'https://via.placeholder.com/150?text=MPK',
                trustLevel: 'EMERGING' as const,
                location: 'Yaba, Lagos',
                contactInfo: JSON.stringify({ phone: '+234-803-555-1234', email: 'orders@mamaputkitchen.ng' }),
            },
            {
                name: 'TechHub Electronics',
                description: 'Affordable smartphones, laptops, and accessories',
                logoUrl: 'https://via.placeholder.com/150?text=TechHub',
                trustLevel: 'EMERGING' as const,
                location: 'Computer Village, Lagos',
                contactInfo: JSON.stringify({ phone: '+234-805-555-5678', email: 'sales@techhub.ng' }),
            },
            {
                name: 'FitLife Wellness Center',
                description: 'Gym memberships, yoga classes, and nutrition counseling',
                logoUrl: 'https://via.placeholder.com/150?text=FitLife',
                trustLevel: 'EMERGING' as const,
                location: 'Victoria Island, Lagos',
                contactInfo: JSON.stringify({ phone: '+234-807-555-9012', email: 'hello@fitlife.ng' }),
            },
            {
                name: 'QuickRide Bikes',
                description: 'Motorcycle taxi service for fast city navigation',
                logoUrl: 'https://via.placeholder.com/150?text=QuickRide',
                trustLevel: 'EMERGING' as const,
                location: 'Surulere, Lagos',
                contactInfo: JSON.stringify({ phone: '+234-809-555-3456', email: 'ride@quickride.ng' }),
            },
            {
                name: 'PowerGen Solutions',
                description: 'Solar panels and backup generators for homes and businesses',
                logoUrl: 'https://via.placeholder.com/150?text=PowerGen',
                trustLevel: 'EMERGING' as const,
                location: 'Lekki, Lagos',
                contactInfo: JSON.stringify({ phone: '+234-810-555-7890', email: 'info@powergen.ng' }),
            },
        ];

        const insertedMerchants = await db.insert(schema.merchants).values(merchantsData).returning();
        console.log(`✅ Seeded ${insertedMerchants.length} merchants (5 VERIFIED, 5 EMERGING)`);

        // Seed Deals (30 total, distributed across merchants and categories)
        console.log('Seeding deals...');
        const dealsData = [
            // Chicken Republic (Food)
            { merchantId: insertedMerchants[0].id, categoryId: categoryMap.food, title: '20% Off Family Meal', description: 'Get 20% off our delicious family meal combo', discountPercentage: 20, originalPrice: 800000, validUntil: new Date('2025-12-31'), inventoryCount: 100 },
            { merchantId: insertedMerchants[0].id, categoryId: categoryMap.food, title: 'Free Drink with Burger', description: 'Buy any burger and get a free soft drink', discountPercentage: 15, originalPrice: 250000, validUntil: new Date('2025-12-31'), inventoryCount: 200 },
            { merchantId: insertedMerchants[0].id, categoryId: categoryMap.food, title: 'Lunch Special - ₦1,500', description: 'Chicken, rice, and coleslaw combo', discountPercentage: 25, originalPrice: 200000, validUntil: new Date('2025-12-31'), inventoryCount: 150 },

            // Shoprite (Food, Electronics)
            { merchantId: insertedMerchants[1].id, categoryId: categoryMap.food, title: '10% Off Groceries Over ₦10,000', description: 'Save on your weekly grocery shopping', discountPercentage: 10, originalPrice: 1000000, validUntil: new Date('2025-12-31'), inventoryCount: null },
            { merchantId: insertedMerchants[1].id, categoryId: categoryMap.electronics, title: '15% Off Kitchen Appliances', description: 'Blenders, toasters, and more', discountPercentage: 15, originalPrice: 3500000, validUntil: new Date('2025-12-31'), inventoryCount: 50 },
            { merchantId: insertedMerchants[1].id, categoryId: categoryMap.food, title: 'Fresh Produce Bundle - ₦3,000', description: 'Vegetables and fruits for the week', discountPercentage: 20, originalPrice: 375000, validUntil: new Date('2025-12-31'), inventoryCount: 80 },

            // Bolt (Transport)
            { merchantId: insertedMerchants[2].id, categoryId: categoryMap.transport, title: '30% Off First 5 Rides', description: 'New users get 30% off their first 5 trips', discountPercentage: 30, originalPrice: 150000, validUntil: new Date('2025-12-31'), inventoryCount: null },
            { merchantId: insertedMerchants[2].id, categoryId: categoryMap.transport, title: 'Weekend Discount - 20% Off', description: 'Save on weekend rides', discountPercentage: 20, originalPrice: 200000, validUntil: new Date('2025-12-31'), inventoryCount: null },
            { merchantId: insertedMerchants[2].id, categoryId: categoryMap.transport, title: 'Airport Transfer Special', description: 'Flat ₦5,000 to Murtala Muhammed Airport', discountPercentage: 25, originalPrice: 666667, validUntil: new Date('2025-12-31'), inventoryCount: null },

            // Ikeja Electric (Utilities)
            { merchantId: insertedMerchants[3].id, categoryId: categoryMap.utilities, title: '5% Cashback on Prepaid Top-Up', description: 'Get 5% back when you buy ₦10,000 or more', discountPercentage: 5, originalPrice: 1000000, validUntil: new Date('2025-12-31'), inventoryCount: null },
            { merchantId: insertedMerchants[3].id, categoryId: categoryMap.utilities, title: 'Free Meter Upgrade', description: 'Upgrade to smart meter at no cost', discountPercentage: 100, originalPrice: 1500000, validUntil: new Date('2025-12-31'), inventoryCount: 20 },
            { merchantId: insertedMerchants[3].id, categoryId: categoryMap.utilities, title: 'Energy Audit Discount', description: 'Get 50% off professional energy audit', discountPercentage: 50, originalPrice: 2000000, validUntil: new Date('2025-12-31'), inventoryCount: 10 },

            // Jumia (Electronics)
            { merchantId: insertedMerchants[4].id, categoryId: categoryMap.electronics, title: 'Smartphone Flash Sale - 25% Off', description: 'Top brands at unbeatable prices', discountPercentage: 25, originalPrice: 15000000, validUntil: new Date('2025-12-31'), inventoryCount: 30 },
            { merchantId: insertedMerchants[4].id, categoryId: categoryMap.electronics, title: 'Laptop Bundle Deal', description: 'Laptop + mouse + bag for ₦120,000', discountPercentage: 20, originalPrice: 15000000, validUntil: new Date('2025-12-31'), inventoryCount: 15 },
            { merchantId: insertedMerchants[4].id, categoryId: categoryMap.electronics, title: 'Headphones - Buy 1 Get 1 Free', description: 'Premium wireless headphones', discountPercentage: 50, originalPrice: 2000000, validUntil: new Date('2025-12-31'), inventoryCount: 40 },

            // Mama Put Kitchen (Food)
            { merchantId: insertedMerchants[5].id, categoryId: categoryMap.food, title: 'Jollof Rice Special - ₦800', description: 'Our famous jollof with chicken', discountPercentage: 20, originalPrice: 100000, validUntil: new Date('2025-12-31'), inventoryCount: 50 },
            { merchantId: insertedMerchants[5].id, categoryId: categoryMap.food, title: 'Lunch Box - ₦1,200', description: 'Rice, stew, protein, and plantain', discountPercentage: 25, originalPrice: 160000, validUntil: new Date('2025-12-31'), inventoryCount: 60 },
            { merchantId: insertedMerchants[5].id, categoryId: categoryMap.food, title: 'Party Pack for 10 - ₦15,000', description: 'Feed your team with our party pack', discountPercentage: 15, originalPrice: 1764706, validUntil: new Date('2025-12-31'), inventoryCount: 10 },

            // TechHub Electronics (Electronics)
            { merchantId: insertedMerchants[6].id, categoryId: categoryMap.electronics, title: 'Refurbished iPhone - 30% Off', description: 'Grade A refurbished iPhones with warranty', discountPercentage: 30, originalPrice: 20000000, validUntil: new Date('2025-12-31'), inventoryCount: 12 },
            { merchantId: insertedMerchants[6].id, categoryId: categoryMap.electronics, title: 'Gaming Console Bundle', description: 'Console + 2 controllers + 3 games', discountPercentage: 20, originalPrice: 25000000, validUntil: new Date('2025-12-31'), inventoryCount: 8 },
            { merchantId: insertedMerchants[6].id, categoryId: categoryMap.electronics, title: 'Smart TV 43" - ₦80,000', description: 'Full HD Smart TV with streaming apps', discountPercentage: 25, originalPrice: 10666667, validUntil: new Date('2025-12-31'), inventoryCount: 5 },

            // FitLife Wellness Center (Wellness)
            { merchantId: insertedMerchants[7].id, categoryId: categoryMap.wellness, title: '3-Month Gym Membership - ₦25,000', description: 'Access to all equipment and classes', discountPercentage: 30, originalPrice: 3571429, validUntil: new Date('2025-12-31'), inventoryCount: 20 },
            { merchantId: insertedMerchants[7].id, categoryId: categoryMap.wellness, title: 'Personal Training Package', description: '10 sessions with certified trainer', discountPercentage: 20, originalPrice: 7500000, validUntil: new Date('2025-12-31'), inventoryCount: 5 },
            { merchantId: insertedMerchants[7].id, categoryId: categoryMap.wellness, title: 'Yoga Class Pass - 5 Sessions', description: 'Beginner-friendly yoga classes', discountPercentage: 25, originalPrice: 2000000, validUntil: new Date('2025-12-31'), inventoryCount: 15 },

            // QuickRide Bikes (Transport)
            { merchantId: insertedMerchants[8].id, categoryId: categoryMap.transport, title: 'First Ride Free', description: 'New users ride free up to ₦500', discountPercentage: 100, originalPrice: 50000, validUntil: new Date('2025-12-31'), inventoryCount: null },
            { merchantId: insertedMerchants[8].id, categoryId: categoryMap.transport, title: 'Weekly Pass - ₦5,000', description: 'Unlimited rides for one week', discountPercentage: 40, originalPrice: 833333, validUntil: new Date('2025-12-31'), inventoryCount: null },
            { merchantId: insertedMerchants[8].id, categoryId: categoryMap.transport, title: 'Rush Hour Discount - 15% Off', description: 'Save during peak traffic hours', discountPercentage: 15, originalPrice: 100000, validUntil: new Date('2025-12-31'), inventoryCount: null },

            // PowerGen Solutions (Utilities)
            { merchantId: insertedMerchants[9].id, categoryId: categoryMap.utilities, title: 'Solar Panel Installation - 20% Off', description: 'Complete home solar system', discountPercentage: 20, originalPrice: 50000000, validUntil: new Date('2025-12-31'), inventoryCount: 3 },
            { merchantId: insertedMerchants[9].id, categoryId: categoryMap.utilities, title: 'Generator Maintenance Package', description: 'Annual maintenance for your generator', discountPercentage: 25, originalPrice: 2000000, validUntil: new Date('2025-12-31'), inventoryCount: 10 },
            { merchantId: insertedMerchants[9].id, categoryId: categoryMap.utilities, title: 'Inverter Battery Replacement', description: 'High-capacity battery with 2-year warranty', discountPercentage: 15, originalPrice: 8000000, validUntil: new Date('2025-12-31'), inventoryCount: 7 },
        ];

        const insertedDeals = await db.insert(schema.deals).values(dealsData).returning();
        console.log(`✅ Seeded ${insertedDeals.length} deals`);

        console.log('\n🎉 Database seeding completed successfully!');
        console.log(`\nSummary:`);
        console.log(`- Categories: ${insertedCategories.length}`);
        console.log(`- Merchants: ${insertedMerchants.length} (5 VERIFIED, 5 EMERGING)`);
        console.log(`- Deals: ${insertedDeals.length}`);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the seed function
seed()
    .then(() => {
        console.log('✅ Seed script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seed script failed:', error);
        process.exit(1);
    });
