import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai/service';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '@/lib/encryption';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { userId, goal } = await req.json();

        // Fetch user and profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });

        if (!user || !user.profile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.aiApiKey) {
            return NextResponse.json({ error: 'AI API Key not configured' }, { status: 400 });
        }

        // Decrypt key
        const apiKey = decrypt(user.aiApiKey);
        const aiService = new AIService(user.aiProvider as any, apiKey);

        // Generate Plan
        const planJson = await aiService.generateMacroPlan(user.profile, goal, []);

        // Save to DB
        const plan = await prisma.plan.create({
            data: {
                userId: user.id,
                startDate: new Date(), // Should be calculated based on goal
                endDate: new Date(goal.date),
                macroPlan: JSON.stringify(planJson),
            },
        });

        return NextResponse.json({ plan });
    } catch (error) {
        console.error('Error generating plan:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
