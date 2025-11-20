import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai/service';
import { IntervalsClient } from '@/lib/intervals/client';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '@/lib/encryption';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });

        if (!user || !user.profile || !user.intervalsApiKey || !user.aiApiKey) {
            return NextResponse.json({ error: 'User configuration missing' }, { status: 400 });
        }

        const intervalsApiKey = decrypt(user.intervalsApiKey);
        const aiApiKey = decrypt(user.aiApiKey);

        // Fetch recent history
        const intervals = new IntervalsClient(intervalsApiKey, 'athlete_id_placeholder'); // Need to store athlete ID too
        // Mock dates for now
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const activities = await intervals.getActivities(startDate, endDate);
        const wellness = await intervals.getWellness(startDate, endDate);

        // AI Decision
        const aiService = new AIService(user.aiProvider as any, aiApiKey);
        const context = `
      Recent Activities: ${JSON.stringify(activities)}
      Recent Wellness: ${JSON.stringify(wellness)}
      User wants to train NOW. Decide the best workout based on fatigue and history.
    `;

        const workout = await aiService.generateWorkout(user.profile, context);

        return NextResponse.json({ workout });

    } catch (error) {
        console.error('Error in Train Now:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
