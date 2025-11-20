import React from 'react';

interface DayProps {
    day: string;
    date: number;
    workout?: {
        title: string;
        type: string;
        duration: number;
    };
    isToday?: boolean;
}

const DayCard = ({ day, date, workout, isToday }: DayProps) => (
    <div className={`flex flex-col p-4 border rounded-lg ${isToday ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'}`}>
        <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{day}</span>
            <span className={`text-sm font-bold ${isToday ? 'text-indigo-600' : 'text-gray-900 dark:text-white'}`}>{date}</span>
        </div>
        {workout ? (
            <div className="mt-2">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{workout.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{workout.duration} min • {workout.type}</div>
            </div>
        ) : (
            <div className="mt-2 text-xs text-gray-400 italic">Rest Day</div>
        )}
    </div>
);

export default function WeeklyCalendar() {
    // Mock data for visualization
    const days = [
        { day: 'Mon', date: 18, workout: { title: 'Easy Run', type: 'Endurance', duration: 45 } },
        { day: 'Tue', date: 19, workout: { title: 'Intervals 4x8m', type: 'Threshold', duration: 75 }, isToday: true },
        { day: 'Wed', date: 20 },
        { day: 'Thu', date: 21, workout: { title: 'Tempo Ride', type: 'Tempo', duration: 60 } },
        { day: 'Fri', date: 22, workout: { title: 'Yoga Flow', type: 'Recovery', duration: 30 } },
        { day: 'Sat', date: 23, workout: { title: 'Long Ride', type: 'Endurance', duration: 180 } },
        { day: 'Sun', date: 24 },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {days.map((d, idx) => (
                <DayCard key={idx} {...d} />
            ))}
        </div>
    );
}
