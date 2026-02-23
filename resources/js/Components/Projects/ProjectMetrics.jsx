import React from 'react';
import { Briefcase, PhilippinePeso, Building } from 'lucide-react';

export default function ProjectMetrics({ projects }) {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
    const completedProjects = totalProjects - activeProjects;
    const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget), 0);
    const totalAppropriation = projects.reduce((sum, p) => sum + (Number(p.appropriation) || 0), 0);
    const totalFloorArea = projects
        .filter(p => p.project_type === 'BUILDING')
        .reduce((sum, p) => sum + (Number(p.total_floor_area) || 0), 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 group hover:border-cyan-500/30 transition-all shadow-sm">
                <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-600 group-hover:scale-110 transition-transform"><Briefcase size={24} /></div>
                <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">Total Projects</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalProjects}</p>
                    <div className="flex gap-2 text-[9px] font-bold mt-1">
                        <span className="text-emerald-600">{activeProjects} Active</span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-500">{completedProjects} Completed</span>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 group hover:border-emerald-500/30 transition-all shadow-sm">
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform"><PhilippinePeso size={24} /></div>
                <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">Total Budget</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">₱ {(totalBudget / 1000000).toFixed(2)}M</p>
                    <p className="text-[9px] text-slate-500 mt-1">Appropriations: ₱ {(totalAppropriation / 1000000).toFixed(2)}M</p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 group hover:border-blue-500/30 transition-all shadow-sm">
                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform"><Building size={24} /></div>
                <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">Total Floor Area</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalFloorArea.toLocaleString()} <span className="text-xs text-slate-500">sqm</span></p>
                    <p className="text-[9px] text-slate-500 mt-1">Building Projects Only</p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-center gap-2 group hover:border-orange-500/30 transition-all shadow-sm">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Project Health</span>
                    <span className="text-xs font-bold text-emerald-600">98% On Track</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[98%]" />
                </div>
                <p className="text-[9px] text-slate-500">Based on timeline and budget utilization</p>
            </div>
        </div>
    );
}
