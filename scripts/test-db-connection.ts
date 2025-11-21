import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
    console.log('🔍 Testing database connection...\n');

    try {
        // Test 1: Connection
        console.log('1️⃣ Testing connection...');
        await prisma.$connect();
        console.log('✅ Connected to database successfully!\n');

        // Test 2: Check tables exist
        console.log('2️⃣ Checking tables...');
        const userCount = await prisma.user.count();
        const profileCount = await prisma.athleteProfile.count();
        const planCount = await prisma.plan.count();
        const workoutCount = await prisma.workout.count();
        const dailyLogCount = await prisma.dailyLog.count();

        console.log(`✅ Tables exist and are accessible:`);
        console.log(`   - Users: ${userCount}`);
        console.log(`   - Athlete Profiles: ${profileCount}`);
        console.log(`   - Plans: ${planCount}`);
        console.log(`   - Workouts: ${workoutCount}`);
        console.log(`   - Daily Logs: ${dailyLogCount}\n`);

        // Test 3: Create and delete a test user
        console.log('3️⃣ Testing CRUD operations...');
        const testUser = await prisma.user.create({
            data: {
                email: `test-${Date.now()}@example.com`,
                aiProvider: 'openai',
            },
        });
        console.log(`✅ Created test user: ${testUser.email}`);

        await prisma.user.delete({
            where: { id: testUser.id },
        });
        console.log(`✅ Deleted test user\n`);

        console.log('🎉 All database tests passed!');
        console.log('\n📊 Database Summary:');
        console.log(`   Database: neondb (Vercel Postgres)`);
        console.log(`   Status: Connected and operational`);
        console.log(`   All tables: Created and accessible`);

    } catch (error) {
        console.error('❌ Database test failed:');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testDatabase();
