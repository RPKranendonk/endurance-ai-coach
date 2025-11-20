import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { z } from 'zod';

// Define schemas for structured output
export const WorkoutSchema = z.object({
    workout_name: z.string(),
    sport: z.enum(['run', 'bike', 'strength', 'yoga', 'mobility']),
    description: z.string(),
    tags: z.array(z.string()),
    structure: z.array(
        z.object({
            type: z.enum(['warmup', 'interval', 'recovery', 'cooldown', 'steady']),
            reps: z.number().nullable().optional(),
            duration_min: z.number(),
            intensity: z.enum(['easy', 'endurance', 'tempo', 'threshold', 'vo2max', 'anaerobic', 'hill']),
            target: z.object({
                metric: z.enum(['pace', 'power', 'hr', 'rpe']),
                value: z.string(),
            }),
        })
    ),
    intervals_icu_export: z.object({
        format: z.literal('builder_v1'),
        blocks: z.array(z.any()), // Flexible for now, strictly intervals.icu format
    }),
});

export const WeeklyAdjustmentSchema = z.object({
    adjusted_week: z.array(z.any()), // Placeholder for full week structure
    summary: z.string(),
    load_change: z.enum(['increase', 'maintain', 'reduce']),
});

export const MacroPlanSchema = z.object({
    macro_plan: z.array(
        z.object({
            week: z.number(),
            focus: z.enum(['base', 'build', 'peak', 'taper', 'recovery']),
            target_volume_hours: z.number(),
            key_sessions: z.array(z.string()),
            strength_sessions: z.number(),
            yoga_sessions: z.number(),
        })
    ),
});

export type AIProvider = 'openai' | 'gemini' | 'claude';

export class AIService {
    private provider: AIProvider;
    private apiKey: string;

    constructor(provider: AIProvider, apiKey: string) {
        this.provider = provider;
        this.apiKey = apiKey;
    }

    private getModel() {
        switch (this.provider) {
            case 'openai':
                const openai = createOpenAI({ apiKey: this.apiKey });
                return openai('gpt-4-turbo'); // Or gpt-4o
            case 'gemini':
                const google = createGoogleGenerativeAI({ apiKey: this.apiKey });
                return google('models/gemini-2.0-flash');
            case 'claude':
                const anthropic = createAnthropic({ apiKey: this.apiKey });
                return anthropic('claude-3-opus-20240229');
            default:
                throw new Error('Invalid AI Provider');
        }
    }

    async generateWorkout(userProfile: any, context: string) {
        const model = this.getModel();

        const systemPrompt = `
      You are an expert endurance training coach.
      Your goal is to generate a specific workout based on the user's request and context.
      
      **Training Methodology:**
      - We use a Zone-based approach relative to Threshold Pace (TP) and Lactate Threshold Heart Rate (LTHR).
      - Workouts MUST be defined by "zone" (Z1-Z5) and "zone_position" (0.0 to 1.0).
      - Do NOT provide absolute pace or HR values. The app calculates these at runtime.
      
      **Zone Definitions:**
      - Z1 (Recovery): Easy, conversational.
      - Z2 (Endurance): Aerobic base, all day pace.
      - Z3 (Tempo): Comfortably hard, steady.
      - Z4 (Threshold): Hard, sustainable for ~60 mins.
      - Z5 (VO2 Max): Very hard, short intervals.
      
      **Zone Position:**
      - 0.0 = Bottom of zone (Easiest/Slowest)
      - 0.5 = Middle of zone
      - 1.0 = Top of zone (Hardest/Fastest)
      
      **Workout Types:**
      - **Easy Run**: Z1 or low Z2 (Pos 0.0-0.3).
      - **Long Run**: Mostly Z2. Optional finish in high Z2/low Z3.
      - **Tempo**: Continuous Z3 (Pos 0.5).
      - **Threshold**: Intervals in Z4 (Pos 0.5), recovery in Z1.
      - **VO2 Max**: Intervals in Z5, recovery in Z1.

      **Output Format:**
      Return a JSON object matching the schema.
      - "structure": Array of blocks.
      - Each block has: "type" (warmup, interval, recovery, cooldown), "duration_min", "intensity" (description), "zone" (Z1-Z5), "zone_position" (0.0-1.0).
    `;

        return JSON.parse(jsonStr);
    } catch(e) {
        console.error("Failed to parse AI response", text);
        throw new Error("AI response was not valid JSON");
    }
}

    async generateMacroPlan(userProfile: any, goal: any, history: any) {
    const model = this.getModel();
    const prompt = `
        Create a macro training plan for an athlete.
        
        Profile: ${JSON.stringify(userProfile)}
        Goal: ${JSON.stringify(goal)}
        History Summary: ${JSON.stringify(history)}
        
        **Phase Selection Logic**:
        - Analyze last 8-12 weeks of volume and intensity.
        - If load is low/inconsistent -> Start with Base.
        - If load is stable/moderate -> Start with Build or short Re-Base.
        - If advanced and stable -> Can skip Base, but include assessment weeks.
        
        **Methodology**:
        - Polarized or Pyramidal distribution.
        - Progressive overload (max 10% vol increase/week).
        - Recovery week every 3-4 weeks.
        - Taper 40-60% volume before race.
        
        Output strictly JSON.
      `;

    const { text } = await generateText({
        model,
        system: "You are a helpful assistant that outputs strictly JSON.",
        prompt
    });

    try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error("No JSON found");
        const jsonStr = text.substring(start, end + 1);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse AI response", text);
        throw new Error("AI response was not valid JSON");
    }
}
}
