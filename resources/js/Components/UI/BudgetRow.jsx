import React from 'react';

export function BudgetRow({ name, progress, budget, color = "bg-primary" }) {
    return (
        <div>
            <div className="flex justify-between mb-2">
                <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{name}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Budget: ₱{budget}</p>
                </div>
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{progress}%</span>
            </div>
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
}
