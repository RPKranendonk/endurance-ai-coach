import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai/service';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '@/lib/encryption';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { userId, type, duration, date } = await req.json();

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });

        if (!user || !user.aiApiKey) {
            return NextResponse.json({ error: 'User or API key not found' }, { status: 404 });
        }

        const apiKey = decrypt(user.aiApiKey);
        const aiService = new AIService(user.aiProvider as any, apiKey);

        const context = `
      User requests a specific workout:
      Type: ${type || 'Any'}
      Duration: ${duration || 'Any'} minutes
      Date: ${date || 'Tomorrow'}
      
      Generate a single workout matching these constraints.
    `;

        const workout = await aiService.generateWorkout(user.profile, context);

        return NextResponse.json({ workout });
    } catch (error) {
        console.error('Error generating workout:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
