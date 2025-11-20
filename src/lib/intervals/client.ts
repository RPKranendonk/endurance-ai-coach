import { resolvePaceTarget, formatPace, Zone } from '../training/zones';

export class IntervalsClient {
    private apiKey: string;
    private athleteId: string;
    private baseUrl = 'https://intervals.icu/api/v1';

    constructor(apiKey: string, athleteId: string = '0') {
        this.apiKey = apiKey;
        this.athleteId = athleteId;
    }

    private async fetch(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseUrl}/athlete/${this.athleteId}${endpoint}`;
        const headers = {
            'Authorization': `Basic ${btoa('API_KEY:' + this.apiKey)}`,
            'Content-Type': 'application/json',
            ...options.headers,
        };

        let response = await fetch(url, { ...options, headers });

        // Simple Rate Limit Handling (Retry once after 1s if 429)
        if (response.status === 429) {
            console.warn("Rate limit hit, waiting 1s...");
            await new Promise(r => setTimeout(r, 1000));
            response = await fetch(url, { ...options, headers });
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Intervals.icu API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    }

    async getActivities(startDate: string, endDate: string) {
        return this.fetch(`/activities?oldest=${startDate}&newest=${endDate}`);
    }

    async getWellness(startDate: string, endDate: string) {
        return this.fetch(`/wellness?oldest=${startDate}&newest=${endDate}`);
    }

    async getEvents(startDate: string, endDate: string) {
        return this.fetch(`/events?oldest=${startDate}&newest=${endDate}`);
    }

    async deleteEvent(id: string | number) {
        return this.fetch(`/events/${id}`, { method: 'DELETE' });
    }

    /**
     * Checks if a date string is today or in the future.
     * Date string can be YYYY-MM-DD or ISO.
     */
    private isFutureOrToday(dateStr: string): boolean {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // If dateStr has no time, it defaults to UTC midnight, which might be "yesterday" in local time if we aren't careful.
        // But for simplicity, let's assume input is local YYYY-MM-DD or ISO.
        // If we just compare YYYY-MM-DD parts:
        const dString = date.toISOString().split('T')[0];
        const tString = today.toISOString().split('T')[0];
        return dString >= tString;
    }

    /**
     * Uploads a workout to Intervals.icu
     * Uses the /events/bulk endpoint which supports creating/updating events.
     * Requires profile data to resolve zones.
     * SAFEGUARD: Only allows uploading to today or future.
     */
    async uploadWorkout(workout: any, date: string, profile: { thresholdPace?: number | null }) {
        // Ensure date has time component if missing
        const startDate = date.includes('T') ? date : `${date}T09:00:00`;

        if (!this.isFutureOrToday(startDate)) {
            throw new Error("Cannot upload workouts to the past. Please select today or a future date.");
        }

        // Convert JSON structure to Intervals.icu Builder Text
        const description = this.convertStructureToText(workout.structure, profile.thresholdPace);

        const payload = [{
            category: 'WORKOUT',
            start_date_local: startDate,
            name: workout.workout_name,
            description: description + `\n\n${workout.description}`, // Append AI description
            type: workout.sport === 'run' ? 'Run' : 'Ride', // Map to Intervals types
            moving_time: workout.structure.reduce((acc: number, curr: any) => acc + (curr.duration_min * 60), 0)
        }];

        return this.fetch('/events/bulk', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    /**
     * Deletes an event by ID.
     * SAFEGUARD: Checks if the event is in the future before deleting.
     */
    async deleteFutureEvent(id: string | number) {
        // 1. Fetch event to check date
        const event = await this.fetch(`/events/${id}`);
        if (!event || !event.start_date_local) {
            throw new Error("Event not found or missing date.");
        }

        if (!this.isFutureOrToday(event.start_date_local)) {
            throw new Error("Cannot delete past events. History is preserved.");
        }

        // 2. Delete
        return this.fetch(`/events/${id}`, { method: 'DELETE' });
    }

    /**
     * Converts the structured JSON workout into Intervals.icu text format.
     * Resolves Zones to concrete values if thresholdPace is provided.
     */
    private convertStructureToText(structure: any[], thresholdPace?: number | null): string {
        if (!structure || !Array.isArray(structure)) return '';

        let text = '';
        let currentGroup = '';

        structure.forEach(block => {
            const groupName = block.type.charAt(0).toUpperCase() + block.type.slice(1);

            // Add Group Header if it changes (e.g. Warmup, Main, Cooldown)
            if (groupName !== currentGroup) {
                text += `\n${groupName}\n`;
                currentGroup = groupName;
            }

            // Add descriptive label for the step (e.g. "VO2 Max Interval", "Recovery")
            // This helps Garmin/Intervals display what the step is for.
            // We can infer this from the zone or explicit type if available.
            let label = block.type; // Default to type (interval, recovery, etc)
            if (block.zone === 'Z5') label = "VO2 Max";
            else if (block.zone === 'Z4') label = "Threshold";
            else if (block.zone === 'Z3') label = "Tempo";
            else if (block.zone === 'Z2') label = "Endurance";
            else if (block.zone === 'Z1') label = "Recovery";

            // Capitalize label
            label = label.charAt(0).toUpperCase() + label.slice(1);

            let line = `- ${block.duration_min}m`;

            // Resolve Target
            if (block.zone) {
                // Use Percentage Range for Pace (e.g. "77%-87% pace")
                // This allows Intervals.icu to calculate exact pace based on user's threshold
                const range = getPaceZoneAsPercent(block.zone as Zone);
                line += ` ${range.min}%-${range.max}% pace ${label}`;
            } else if (block.target && block.target.value) {
                line += ` ${block.target.value} ${label}`;
            } else {
                line += ` ${block.intensity} ${label}`;
            }

            text += `${line}\n`;
        });

        return text.trim();
    }
}
