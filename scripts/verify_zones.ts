import { calculatePaceZones, calculateHRZones, resolvePaceTarget, resolveHRTarget, formatPace } from '../src/lib/training/zones';

function runVerification() {
    console.log("Starting Zone Verification...");

    // 1. Test Profile
    const thresholdPace = 240; // 4:00/km
    const lthr = 170; // bpm

    console.log(`\nProfile: TP=${formatPace(thresholdPace)}/km, LTHR=${lthr} bpm`);

    // 2. Verify Pace Zones
    console.log("\n--- Pace Zones ---");
    const paceZones = calculatePaceZones(thresholdPace);
    console.log("Z1 (Easy):", formatPace(paceZones.Z1.min), "-", formatPace(paceZones.Z1.max));
    console.log("Z4 (Threshold):", formatPace(paceZones.Z4.min), "-", formatPace(paceZones.Z4.max));

    // Check Z4 Logic: 1.00 - 1.05 * TP. 
    // Lower Bound (Fastest) = 1.00 * 240 = 240 (4:00)
    // Upper Bound (Slowest) = 1.05 * 240 = 252 (4:12)
    if (Math.abs(paceZones.Z4.min - 240) < 1 && Math.abs(paceZones.Z4.max - 252) < 1) {
        console.log("✅ Z4 Pace Calculation Correct");
    } else {
        console.error("❌ Z4 Pace Calculation Failed");
    }

    // 3. Verify HR Zones
    console.log("\n--- HR Zones ---");
    const hrZones = calculateHRZones(lthr);
    console.log("Z4 (Threshold):", hrZones.Z4.min, "-", hrZones.Z4.max);
    // Check Z4 Logic: 0.95 - 0.99 * LTHR
    // Min = 170 * 0.95 = 161.5 -> 162
    // Max = 170 * 0.99 = 168.3 -> 168
    if (hrZones.Z4.min === 162 && hrZones.Z4.max === 168) {
        console.log("✅ Z4 HR Calculation Correct");
    } else {
        console.error("❌ Z4 HR Calculation Failed");
    }

    // 4. Verify Target Resolution
    console.log("\n--- Target Resolution ---");
    // Z4 Middle (0.5)
    const z4Target = resolvePaceTarget(thresholdPace, 'Z4', 0.5);
    // Range: 240 - 252. Diff = 12. 0.5 * 12 = 6. Max(252) - 6 = 246.
    console.log("Z4 @ 0.5 Target:", formatPace(z4Target));

    if (Math.abs(z4Target - 246) < 1) {
        console.log("✅ Z4 Target Resolution Correct");
    } else {
        console.error("❌ Z4 Target Resolution Failed. Got:", z4Target);
    }

    // 5. Verify Update Behavior (Change TP)
    console.log("\n--- Update Behavior (New TP) ---");
    const newTP = 300; // 5:00/km
    const newZ4Target = resolvePaceTarget(newTP, 'Z4', 0.5);
    console.log(`New TP: ${formatPace(newTP)}/km`);
    console.log("New Z4 @ 0.5 Target:", formatPace(newZ4Target));

    // Range: 300 - 315. Diff 15. 0.5 * 15 = 7.5. 315 - 7.5 = 307.5.
    if (Math.abs(newZ4Target - 307.5) < 1) {
        console.log("✅ Dynamic Update Verified");
    } else {
        console.error("❌ Dynamic Update Failed");
    }
}

runVerification();
