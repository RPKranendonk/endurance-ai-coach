import { NextRequest, NextResponse } from 'next/server';
import { IntervalsClient } from '@/lib/intervals/client';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '@/lib/encryption';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { userId, workout, date } = await req.json();

        if (!userId || !workout) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });

        if (!user || !user.intervalsApiKey) {
            return NextResponse.json({ error: 'User or Intervals API key not found' }, { status: 404 });
        }

        const apiKey = decrypt(user.intervalsApiKey);
        // Defaulting to '0' (self) if no external athlete ID is managed
        const client = new IntervalsClient(apiKey, '0');

        // Use provided date or default to tomorrow
        const targetDate = date || new Date(Date.now() + 86400000).toISOString().split('T')[0];

        const result = await client.uploadWorkout(workout, targetDate, {
            thresholdPace: user.profile?.thresholdPace
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Error exporting workout:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
