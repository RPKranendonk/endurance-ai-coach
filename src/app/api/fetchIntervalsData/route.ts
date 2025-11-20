import { NextRequest, NextResponse } from 'next/server';
import { IntervalsClient } from '@/lib/intervals/client';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '@/lib/encryption';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        if (!userId || !start || !end) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.intervalsApiKey) {
            return NextResponse.json({ error: 'User or API key not found' }, { status: 404 });
        }

        const apiKey = decrypt(user.intervalsApiKey);
        // In a real app, we would store and retrieve the intervals.icu athlete ID.
        // For now, we assume the user knows it or we fetch "self".
        // The IntervalsClient currently takes an athleteId in constructor.
        // We might need to fetch the athlete ID first if we don't have it.
        // For this MVP, we'll use a placeholder or assume the key gives access to "athlete/0" (self).
        const client = new IntervalsClient(apiKey, 'i123456'); // Placeholder ID

        const activities = await client.getActivities(start, end);
        const wellness = await client.getWellness(start, end);

        return NextResponse.json({ activities, wellness });
    } catch (error) {
        console.error('Error fetching intervals data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
