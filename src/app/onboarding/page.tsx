"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { z } from "zod";
import { useRouter } from "next/navigation";

const onboardingSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    primarySport: z.enum(["run", "bike", "both"]),
    experienceLevel: z.enum(["novice", "intermediate", "advanced"]),
    availableHours: z.number().min(1).max(30),
    intervalsApiKey: z.string().min(10),
    aiProvider: z.enum(["openai", "gemini", "claude"]),
    aiApiKey: z.string().min(10),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<OnboardingFormValues>({
        // resolver: zodResolver(onboardingSchema),
        defaultValues: {
            primarySport: "run",
            experienceLevel: "intermediate",
            aiProvider: "openai",
            availableHours: 5,
        },
    });

    const onSubmit = async (data: OnboardingFormValues) => {
        console.log("Form submitted:", data);

        // Manual Validation
        try {
            onboardingSchema.parse(data);
        } catch (e) {
            console.error("Validation error:", e);
            alert("Please check your inputs.");
            return;
        }

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

            console.log("API Response status:", response.status);

            if (!response.ok) throw new Error("Failed to save config");

            const result = await response.json();
            console.log("API Result:", result);
            localStorage.setItem("userId", result.userId); // Simple auth for demo
            router.push("/dashboard");
        } catch (error) {
            console.error(error);
            alert("Error saving configuration");
        } finally {
            setIsLoading(false);
        }
    };

    const onError = (errors: any) => {
        console.error("Form validation errors:", errors);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-zinc-900">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Setup Your Coach
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        We need a few details to personalize your plan.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit, onError)}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        {/* Personal Info */}
                        <div className="p-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                {...register("email")}
                                type="email"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 p-2"
                            />
                            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                        </div>
                        <div className="p-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <input
                                {...register("name")}
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 p-2"
                            />
                        </div>

                        {/* Training Config */}
                        <div className="p-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Primary Sport</label>
                            <select
                                {...register("primarySport")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 p-2"
                            >
                                <option value="run">Running</option>
                                <option value="bike">Cycling</option>
                                <option value="both">Triathlon / Both</option>
                            </select>
                        </div>
                        <div className="p-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Experience Level</label>
                            <select
                                {...register("experienceLevel")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 p-2"
                            >
                                <option value="novice">Novice</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                        <div className="p-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weekly Hours Available</label>
                            <input
                                {...register("availableHours", { valueAsNumber: true })}
                                type="number"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 p-2"
                            />
                        </div>

                        {/* API Keys */}
                        <div className="p-2 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                            <h3 className="text-sm font-bold mb-2">Integrations</h3>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Intervals.icu API Key</label>
                            <input
                                {...register("intervalsApiKey")}
                                type="password"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 p-2"
                            />
                            {errors.intervalsApiKey && <p className="text-red-500 text-xs">{errors.intervalsApiKey.message}</p>}
                        </div>
                        <div className="p-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">AI Provider</label>
                            <select
                                {...register("aiProvider")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 p-2"
                            >
                                <option value="openai">OpenAI</option>
                                <option value="gemini">Google Gemini</option>
                                <option value="claude">Anthropic Claude</option>
                            </select>
                        </div>
                        <div className="p-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">AI API Key</label>
                            <input
                                {...register("aiApiKey")}
                                type="password"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 p-2"
                            />
                            {errors.aiApiKey && <p className="text-red-500 text-xs">{errors.aiApiKey.message}</p>}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? "Saving..." : "Complete Setup"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
