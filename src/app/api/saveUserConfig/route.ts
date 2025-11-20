import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { encrypt } from '@/lib/encryption';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, intervalsApiKey, aiProvider, aiApiKey, profile } = body;

        // Basic validation
        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const encryptedIntervalsKey = intervalsApiKey ? encrypt(intervalsApiKey) : undefined;
        const encryptedAiKey = aiApiKey ? encrypt(aiApiKey) : undefined;

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                intervalsApiKey: encryptedIntervalsKey,
                aiProvider,
                aiApiKey: encryptedAiKey,
                profile: {
                    upsert: {
                        create: profile,
                        update: profile,
                    }
                }
            },
            create: {
                email,
                intervalsApiKey: encryptedIntervalsKey,
                aiProvider,
                aiApiKey: encryptedAiKey,
                profile: {
                    create: profile
                }
            },
        });

        return NextResponse.json({ success: true, userId: user.id });
    } catch (error) {
        console.error('Error saving config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
