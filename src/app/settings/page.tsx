"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

const settingsSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    primarySport: z.enum(["run", "bike", "both"]),
    experienceLevel: z.enum(["novice", "intermediate", "advanced"]),
    availableHours: z.number().min(1).max(30),
    thresholdPace: z.number().optional(),
    lthr: z.number().optional(),
    intervalsApiKey: z.string().optional(), // Optional on update
    aiProvider: z.enum(["openai", "gemini", "claude"]),
    aiApiKey: z.string().optional(), // Optional on update
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
    });

    useEffect(() => {
        const storedId = localStorage.getItem("userId");
        if (!storedId) {
            router.push("/onboarding");
            return;
        }
        setUserId(storedId);

        // In a real app, fetch current user config here
        // For now, we'll just leave fields empty or mock
    }, [router]);

    const onSubmit = async (data: SettingsFormValues) => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const response = await fetch("/api/saveUserConfig", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: data.email,
                    intervalsApiKey: data.intervalsApiKey,
                    aiProvider: data.aiProvider,
                    aiApiKey: data.aiApiKey,
                    profile: {
                        name: data.name,
                        primarySport: data.primarySport,
                        experienceLevel: data.experienceLevel,
                        availableHours: data.availableHours,
                    },
                }),
            });

            if (!response.ok) throw new Error("Failed to update settings");
            alert("Settings updated successfully");
        } catch (error) {
            console.error(error);
            alert("Error updating settings");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-zinc-900 p-8">
            <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-800 rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    <button onClick={() => router.push('/dashboard')} className="text-indigo-600 hover:text-indigo-500">Back to Dashboard</button>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {/* Personal Info */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                {...register("email")}
                                type="email"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600 p-2"
                            />
                            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <input
                                {...register("name")}
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600 p-2"
                            />
                        </div>
                    </div>

                    {/* Training Config */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Primary Sport</label>
                            <select
                                {...register("primarySport")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600 p-2"
                            >
                                <option value="run">Running</option>
                                <option value="bike">Cycling</option>
                                <option value="both">Triathlon / Both</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Experience Level</label>
                            <select
                                {...register("experienceLevel")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600 p-2"
                            >
                                <option value="novice">Novice</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weekly Training Hours</label>
                            <input
                                {...register("availableHours", { valueAsNumber: true })}
                                type="number"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600 p-2"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Threshold Pace (MM:SS/km)</label>
                                <input
                                    type="text"
                                    placeholder="04:00"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600 p-2"
                                    onBlur={(e) => {
                                        const val = e.target.value;
                                        if (val.includes(':')) {
                                            const [m, s] = val.split(':').map(Number);
                                            const totalSeconds = (m * 60) + s;
                                            setValue('thresholdPace', totalSeconds);
                                        }
                                    }}
                                />
                                <input type="hidden" {...register("thresholdPace", { valueAsNumber: true })} />
                                <p className="text-xs text-gray-500 mt-1">Garmin Threshold Pace</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">LTHR (bpm)</label>
                                <input
                                    {...register("lthr", { valueAsNumber: true })}
                                    type="number"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600 p-2"
                                />
                                <p className="text-xs text-gray-500 mt-1">Lactate Threshold HR</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Goals</label>
                        </div>
                    </div>
                    {/* API Keys (Optional updates) */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h3 className="text-sm font-bold mb-4">Update Integrations (Leave blank to keep current)</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Intervals.icu API Key</label>
                                <input
                                    {...register("intervalsApiKey")}
                                    type="password"
                                    placeholder="••••••••"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600 p-2"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">AI Provider</label>
                                    <select
                                        {...register("aiProvider")}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600 p-2"
                                    >
                                        <option value="openai">OpenAI</option>
                                        <option value="gemini">Google Gemini</option>
                                        <option value="claude">Anthropic Claude</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">AI API Key</label>
                                    <input
                                        {...register("aiApiKey")}
                                        type="password"
                                        placeholder="••••••••"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600 p-2"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
