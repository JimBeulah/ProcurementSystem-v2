import React from 'react';
import Modal from '@/Components/UI/Modal';
import { TrendingUp, Home, Car } from 'lucide-react';

export default function BoqMetricsModal({ 
    isOpen, 
    onClose, 
    project, 
    calculations 
}) {
    const { 
        totalWithProfit, 
        amountPerSqmBuilding, 
        floorArea, 
        amountPerSqmCarport, 
        carportArea, 
        totalConstructionCost, 
        amountWithoutCarportWithProfit 
    } = calculations;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Project Metrics" maxWidth="max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-2">
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={48} className="text-purple-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Project Cost</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight relative z-10">
                        <span className="text-lg text-slate-400 mr-1">₱</span>
                        {(Number(project.appropriation) || totalWithProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Home size={48} className="text-blue-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Home size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Building Value</span>
                    </div>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                            ₱ {amountPerSqmBuilding.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <span className="text-xs text-slate-500 font-medium">/ sqm ({floorArea})</span>
                    </div>
                </div>

                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Car size={48} className="text-amber-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Car size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Carport Value</span>
                    </div>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                            ₱ {amountPerSqmCarport.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <span className="text-xs text-slate-500 font-medium">/ sqm ({carportArea})</span>
                    </div>
                </div>

                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col justify-end shadow-sm relative">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cost Distribution</span>
                    </div>
                    <div className="w-full bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-3 overflow-hidden flex mb-2">
                        <div className="bg-cyan-500 h-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${(amountWithoutCarportWithProfit / totalWithProfit) * 100 || 0}%` }} />
                        <div className="bg-amber-500 h-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${(100 - (amountWithoutCarportWithProfit / totalWithProfit) * 100) || 0}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-500"></div> Building ({((amountWithoutCarportWithProfit / totalWithProfit) * 100 || 0).toFixed(0)}%)</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Carport</span>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
