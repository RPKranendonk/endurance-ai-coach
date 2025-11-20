"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const planSchema = z.object({
    goalEvent: z.string().min(3),
    eventDate: z.string(),
    goalDescription: z.string().optional(),
});

type PlanFormValues = z.infer<typeof planSchema>;

export default function GeneratePlanPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const storedId = localStorage.getItem("userId");
        if (!storedId) {
            router.push("/onboarding");
        } else {
            setUserId(storedId);
        }
    }, [router]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PlanFormValues>({
        resolver: zodResolver(planSchema),
    });

    const onSubmit = async (data: PlanFormValues) => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const response = await fetch("/api/generatePlan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    goal: {
                        event: data.goalEvent,
                        date: data.eventDate,
                        description: data.goalDescription,
                    },
                }),
            });

            if (!response.ok) throw new Error("Failed to generate plan");

            const result = await response.json();
            alert("Plan generated successfully!");
            router.push("/dashboard");
        } catch (error) {
            console.error(error);
            alert("Error generating plan. Please check your API keys and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-zinc-900 p-8">
            <div className="max-w-xl mx-auto bg-white dark:bg-zinc-800 rounded-xl shadow p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Training Plan</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Event Name</label>
                        <input
                            {...register("goalEvent")}
                            type="text"
                            placeholder="e.g. London Marathon 2025"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600 p-2"
                        />
                        {errors.goalEvent && <p className="text-red-500 text-xs">{errors.goalEvent.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Event Date</label>
                        <input
                            {...register("eventDate")}
                            type="date"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600 p-2"
                        />
                        {errors.eventDate && <p className="text-red-500 text-xs">{errors.eventDate.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Specific Goals / Notes</label>
                        <textarea
                            {...register("goalDescription")}
                            rows={4}
                            placeholder="e.g. Sub 3 hours, focus on hill strength..."
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600 p-2"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? "Generating Plan..." : "Generate Plan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
