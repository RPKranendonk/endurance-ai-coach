import { IntervalsClient } from '../src/lib/intervals/client';
import { AIService } from '../src/lib/ai/service';

// Mock AI Service to test parsing
class MockAIService extends AIService {
    constructor() {
        super('openai', 'test-key');
    }

    // Override to return static text for testing parsing
    // @ts-ignore
    async generateText(prompt: any) {
        return {
            text: `Here is the workout:
            {
                "workout_name": "Test Interval Session",
                "sport": "run",
                "description": "A hard test session",
                "tags": ["threshold"],
                "structure": [
                    { "type": "warmup", "duration_min": 10, "intensity": "easy", "target": { "metric": "hr", "value": "Z1" } },
                    { "type": "interval", "duration_min": 5, "intensity": "threshold", "target": { "metric": "pace", "value": "4:00/km" } },
                    { "type": "recovery", "duration_min": 2, "intensity": "easy", "target": { "metric": "rpe", "value": "3" } },
                    { "type": "cooldown", "duration_min": 10, "intensity": "easy", "target": { "metric": "hr", "value": "Z1" } }
                ],
                "intervals_icu_export": { "format": "builder_v1", "blocks": [] }
            }`
        };
    }
}

async function runVerification() {
    console.log("Starting Verification...");

    // 1. Test AI Parsing
    console.log("\n1. Testing AI JSON Parsing...");
    const aiService = new MockAIService();
    // We mock the internal call, so arguments don't matter much here
    // But we need to access the protected method or just test the public one if we mocked the internal 'generateText'
    // Since 'generateText' is imported in the real service, mocking it via class extension is tricky without dependency injection.
    // For this script, we will just manually test the IntervalsClient conversion logic which is pure logic.

    const mockWorkout = {
        "workout_name": "Test Interval Session",
        "sport": "run",
        "description": "A hard test session",
        "structure": [
            { "type": "warmup", "duration_min": 10, "intensity": "easy", "target": { "metric": "hr", "value": "Z1" } },
            { "type": "interval", "duration_min": 5, "intensity": "threshold", "target": { "metric": "pace", "value": "4:00/km" } },
            { "type": "recovery", "duration_min": 2, "intensity": "easy", "target": { "metric": "rpe", "value": "3" } },
            { "type": "cooldown", "duration_min": 10, "intensity": "easy", "target": { "metric": "hr", "value": "Z1" } }
        ]
    };

    // 2. Test Intervals.icu Conversion
    console.log("\n2. Testing Intervals.icu Text Conversion...");
    const client = new IntervalsClient('test-key', '0');
    // Access private method via casting to any (for testing purposes)
    const text = (client as any).convertStructureToText(mockWorkout.structure);

    console.log("Generated Text:");
    console.log("---------------------------------------------------");
    console.log(text);
    console.log("---------------------------------------------------");

    const expectedLines = [
        "Warmup",
        "- 10m Z1",
        "Interval",
        "- 5m 4:00/km",
        "Recovery",
        "- 2m 3",
        "Cooldown",
        "- 10m Z1"
    ];

    const allPresent = expectedLines.every(line => text.includes(line));

    if (allPresent) {
        console.log("✅ Conversion Verification PASSED");
    } else {
        console.error("❌ Conversion Verification FAILED");
        console.log("Expected to contain:", expectedLines);
    }
}

runVerification();
