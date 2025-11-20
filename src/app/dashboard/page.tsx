"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import { resolvePaceTarget, formatPace, resolveHRTarget, resolvePaceRange, type Zone } from '@/lib/training/zones';

export default function DashboardPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loadingWorkout, setLoadingWorkout] = useState(false);
    const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);

    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        const storedId = localStorage.getItem("userId");
        if (!storedId) {
            router.push("/onboarding");
        } else {
            setUserId(storedId);
            // Fetch user profile
            fetch(`/api/getUser?userId=${storedId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.user && data.user.profile) {
                        setUserProfile(data.user.profile);
                    }
                })
                .catch(err => console.error("Failed to fetch user profile", err));
        }
    }, [router]);

    const handleTrainNow = async () => {
        setLoadingWorkout(true);
        setGeneratedWorkout(null);
        try {
            const response = await fetch("/api/trainNow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            const data = await response.json();
            if (data.workout) {
                setGeneratedWorkout(data.workout);
            } else {
                alert("Failed to generate workout");
            }
        } catch (error) {
            console.error(error);
            alert("Error generating workout");
        } finally {
            setLoadingWorkout(false);
        }
    };

    const handleExport = async () => {
        if (!generatedWorkout || !userId) return;
        const btn = document.getElementById('export-btn') as HTMLButtonElement;
        if (btn) {
            btn.disabled = true;
            btn.innerText = "Exporting...";
        }

        try {
            const response = await fetch("/api/exportWorkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    workout: generatedWorkout,
                    date: new Date().toISOString().split('T')[0] // Today for "Train Now"
                }),
            });

            if (!response.ok) throw new Error("Failed to export");

            alert("Workout exported to Intervals.icu!");
        } catch (error) {
            console.error(error);
            alert("Error exporting workout");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Export to Intervals.icu";
            }
        }
    };

    if (!userId) return null;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-zinc-900 p-8">
            <header className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.push("/plan/new")}
                        className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                    >
                        New Plan
                    </button>
                    <button
                        onClick={() => router.push("/settings")}
                        className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                        Settings
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem("userId");
                            router.push("/");
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Weekly Overview */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">This Week</h2>
                <WeeklyCalendar />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Action */}
                <div className="col-span-1 md:col-span-2 bg-white dark:bg-zinc-800 rounded-xl shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 dark:text-white">Today's Training</h2>
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg">
                        {!generatedWorkout ? (
                            <div className="text-center">
                                <p className="mb-4 text-gray-500">No workout planned yet.</p>
                                <button
                                    onClick={handleTrainNow}
                                    disabled={loadingWorkout}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    {loadingWorkout ? "Analyzing..." : "Train Now"}
                                </button>
                                <p className="mt-2 text-xs text-gray-400">AI analyzes your fatigue & history instantly.</p>
                            </div>
                        ) : (
                            <div className="w-full p-4 text-left">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-2xl font-bold text-indigo-600">{generatedWorkout.workout_name}</h3>
                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full uppercase">{generatedWorkout.sport}</span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">{generatedWorkout.description}</p>



                                // ...

                                <div className="space-y-2">
                                    {generatedWorkout.structure.map((block: any, idx: number) => {
                                        let details = `${block.duration_min}m @ ${block.intensity}`;

                                        if (block.zone && userProfile?.thresholdPace) {
                                            // Show Pace Range (e.g. 5:45 - 5:12 /km)
                                            const range = resolvePaceRange(userProfile.thresholdPace, block.zone as Zone);
                                            // Note: range.min is FASTER (lower seconds) than range.max
                                            // Usually displayed as Slower - Faster (e.g. 5:45 - 5:12) or Faster - Slower?
                                            // Let's do Faster - Slower (Min - Max in seconds value, but Max is slower)
                                            // Actually "5:12 - 5:45" reads better (Fast - Slow) or (Slow - Fast)?
                                            // Convention is often Slow - Fast for "Zone" (Easy to Hard), but for Pace numbers it's High - Low.
                                            // Let's display: "5:45 - 5:12 /km" (Slowest to Fastest)
                                            const slowPace = formatPace(range.max);
                                            const fastPace = formatPace(range.min);

                                            details = `${block.duration_min}m @ ${slowPace}-${fastPace}/km (${block.zone})`;

                                            if (userProfile.lthr) {
                                                const targetHR = resolveHRTarget(userProfile.lthr, block.zone as Zone, 0.5); // Show mid-point or range?
                                                // Let's show range for HR too?
                                                // For now, keeping it simple with just the zone indicator or maybe range
                                                // resolveHRTarget returns a single value. 
                                                // Let's just show the Zone name which implies the HR range, or maybe add range support later.
                                                // For now, let's show the mid-point as a reference.
                                                details += ` [~${targetHR} bpm]`;
                                            }
                                        }

                                        return (
                                            <div key={idx} className="flex justify-between text-sm border-b border-gray-100 dark:border-zinc-700 py-1">
                                                <span className="font-medium capitalize">{block.type}</span>
                                                <span>{details}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <button
                                        id="export-btn"
                                        onClick={handleExport}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                    >
                                        Export to Intervals.icu
                                    </button>
                                    <button onClick={() => setGeneratedWorkout(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Close</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats / Recovery */}
                <div className="col-span-1 bg-white dark:bg-zinc-800 rounded-xl shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 dark:text-white">Recovery Status</h2>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Fatigue (ATL)</span>
                                <span className="font-bold">High</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Fitness (CTL)</span>
                                <span className="font-bold">Rising</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100 dark:border-zinc-700">
                            <p className="text-sm text-gray-500">HRV is trending down. Consider a lighter session today.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
