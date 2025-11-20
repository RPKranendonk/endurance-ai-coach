export interface ZoneBoundaries {
    min: number;
    max: number;
}

export interface PaceZones {
    Z1: ZoneBoundaries;
    Z2: ZoneBoundaries;
    Z3: ZoneBoundaries;
    Z4: ZoneBoundaries;
    Z5: ZoneBoundaries;
}

export interface HRZones {
    Z1: ZoneBoundaries;
    Z2: ZoneBoundaries;
    Z3: ZoneBoundaries;
    Z4: ZoneBoundaries;
    Z5: ZoneBoundaries;
}

export type Zone = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';

/**
 * Calculates Pace Zones based on Threshold Pace (seconds per km).
 * Higher factor = slower pace (more seconds per km).
 */
export function calculatePaceZones(thresholdPace: number): PaceZones {
    // Factors from requirements
    // Z1: 1.30 - 1.45
    // Z2: 1.15 - 1.30
    // Z3: 1.05 - 1.15
    // Z4: 1.00 - 1.05
    // Z5: 0.90 - 1.00

    // Note: "Lower" pace value in seconds means FASTER. "Upper" means SLOWER.
    // But usually "Lower Bound" of a zone implies the easiest intensity (slowest) and "Upper Bound" implies hardest (fastest).
    // However, the requirement says "lower and upper pace in sec/km".
    // Let's return { min: faster_val, max: slower_val } to be consistent with "range", 
    // but we must be careful with "Zone Position".
    // Usually 0.0 = Start of zone (Easiest) -> 1.0 = End of zone (Hardest).
    // For Pace: Easiest = Slower = Higher Seconds. Hardest = Faster = Lower Seconds.
    // So 0.0 should map to the Slower end (High Factor), and 1.0 to Faster end (Low Factor).

    return {
        Z1: { min: thresholdPace * 1.30, max: thresholdPace * 1.45 }, // Easy
        Z2: { min: thresholdPace * 1.15, max: thresholdPace * 1.30 },
        Z3: { min: thresholdPace * 1.05, max: thresholdPace * 1.15 },
        Z4: { min: thresholdPace * 1.00, max: thresholdPace * 1.05 },
        Z5: { min: thresholdPace * 0.90, max: thresholdPace * 1.00 }, // Fast
    };
}

/**
 * Calculates HR Zones based on LTHR (bpm).
 */
export function calculateHRZones(lthr: number): HRZones {
    return {
        Z1: { min: 0, max: Math.round(lthr * 0.85) - 1 },
        Z2: { min: Math.round(lthr * 0.85), max: Math.round(lthr * 0.89) },
        Z3: { min: Math.round(lthr * 0.90), max: Math.round(lthr * 0.94) },
        Z4: { min: Math.round(lthr * 0.95), max: Math.round(lthr * 0.99) },
        Z5: { min: Math.round(lthr * 1.00), max: 220 }, // Cap at theoretical max for safety
    };
}

/**
 * Formats seconds per km into MM:SS string.
 */
export function formatPace(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Returns the Speed % Range of Threshold for a given zone.
 * Used for Intervals.icu export (e.g. "77%-87% pace").
 * Derived from Time Factors: Speed % = 100 / TimeFactor.
 */
export function getPaceZoneAsPercent(zone: Zone): { min: number, max: number } {
    // Time Factors:
    // Z1: 1.30 - 1.45 (Slower) -> Speed: 1/1.45 - 1/1.30 -> ~69% - 77%
    // Z2: 1.15 - 1.30 -> Speed: 1/1.30 - 1/1.15 -> ~77% - 87%
    // Z3: 1.05 - 1.15 -> Speed: 1/1.15 - 1/1.05 -> ~87% - 95%
    // Z4: 1.00 - 1.05 -> Speed: 1/1.05 - 1/1.00 -> ~95% - 100%
    // Z5: 0.90 - 1.00 -> Speed: 1/1.00 - 1/0.90 -> ~100% - 111%

    switch (zone) {
        case 'Z1': return { min: 69, max: 77 };
        case 'Z2': return { min: 77, max: 87 };
        case 'Z3': return { min: 87, max: 95 };
        case 'Z4': return { min: 95, max: 100 };
        case 'Z5': return { min: 100, max: 111 };
    }
}

/**
 * Resolves the min and max pace (in seconds/km) for a zone.
 * Useful for displaying the range to the user.
 */
export function resolvePaceRange(thresholdPace: number, zone: Zone): { min: number, max: number } {
    const zones = calculatePaceZones(thresholdPace);
    const range = zones[zone];
    // Note: "min" in calculatePaceZones is the faster pace (lower seconds), "max" is slower.
    // We return them as is.
    return { min: range.min, max: range.max };
}

/**
 * Resolves a specific target pace from a zone and position.
 * Position 0.0 = Easiest (Slower, Max Seconds)
 * Position 1.0 = Hardest (Faster, Min Seconds)
 */
export function resolvePaceTarget(thresholdPace: number, zone: Zone, position: number): number {
    const zones = calculatePaceZones(thresholdPace);
    const range = zones[zone];

    // Easiest (Pos 0) is the MAX seconds (slower).
    // Hardest (Pos 1) is the MIN seconds (faster).
    // Value = Max - (Position * (Max - Min))
    return range.max - (position * (range.max - range.min));
}

/**
 * Resolves a specific target HR from a zone and position.
 * Position 0.0 = Easiest (Lower BPM)
 * Position 1.0 = Hardest (Higher BPM)
 */
export function resolveHRTarget(lthr: number, zone: Zone, position: number): number {
    const zones = calculateHRZones(lthr);
    const range = zones[zone];

    // Easiest (Pos 0) is Min BPM.
    // Hardest (Pos 1) is Max BPM.
    return Math.round(range.min + (position * (range.max - range.min)));
}
