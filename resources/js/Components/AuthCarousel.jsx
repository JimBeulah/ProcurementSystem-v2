import { useState, useEffect } from 'react';

const slides = [
    {
        title: "Unified Access",
        description: "Everything you need in an easily customizable dashboard.",
        image: "nodes"
    },
    {
        title: "Streamline Procurement.",
        description: "Manage vendors, track orders, and approve requests in one place.",
        image: "documents"
    },
    {
        title: "Actionable Insights.",
        description: "Gain real-time visibility into spending and optimize your budget.",
        image: "chart"
    }
];

export default function AuthCarousel() {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="hidden lg:flex w-1/2 bg-[#0066FF] relative flex-col items-center justify-center overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border-[40px] border-white/[0.03] rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border-[20px] border-white/[0.04] rounded-full" />

            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg px-12">
                {/* Carousel Graphics Wrapper */}
                <div className="h-72 mb-10 relative w-full flex items-center justify-center pointer-events-none select-none">
                    {slides.map((slide, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                                }`}
                        >
                            {/* Abstract representation 1: Nodes / Connection */}
                            {slide.image === 'nodes' && (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {/* Center Panel */}
                                    <div className="w-64 h-48 bg-white rounded-2xl shadow-2xl p-4 flex flex-col gap-3 z-10">
                                        <div className="flex gap-2 mb-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                        </div>
                                        <div className="w-3/4 h-2.5 bg-slate-100 rounded-full" />
                                        <div className="w-1/2 h-2.5 bg-slate-100 rounded-full" />
                                        <div className="flex gap-3 mt-auto border-t border-slate-50 pt-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <div className="w-4 h-4 rounded-full bg-blue-500" />
                                            </div>
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="w-full h-2 bg-slate-100 rounded" />
                                                <div className="w-2/3 h-2 bg-slate-100 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Side nodes connected visually */}
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-6">
                                        <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center relative translate-x-2">
                                            <div className="w-5 h-5 bg-indigo-500 rounded-md" />
                                            <div className="absolute w-12 h-0.5 bg-white/40 left-full top-1/2 -translate-y-1/2 z-0" />
                                        </div>
                                        <div className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center relative -translate-x-4 z-20">
                                            <div className="w-6 h-6 bg-emerald-500 rounded-full" />
                                            <div className="absolute w-16 h-0.5 bg-white/40 left-full top-1/2 -translate-y-1/2 z-0" />
                                        </div>
                                        <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center relative translate-x-2">
                                            <div className="w-5 h-5 bg-rose-500 rounded-md" />
                                            <div className="absolute w-12 h-0.5 bg-white/40 left-full top-1/2 -translate-y-1/2 z-0" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Abstract representation 2: Documents / Approval */}
                            {slide.image === 'documents' && (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {/* Back Document */}
                                    <div className="w-56 h-64 bg-white/90 rounded-2xl shadow-xl rotate-[-6deg] translate-x-3 translate-y-3 p-5 flex flex-col absolute">
                                        <div className="w-1/2 h-3 bg-slate-200 rounded-full mb-4" />
                                        <div className="space-y-2.5">
                                            <div className="w-full h-2 bg-slate-100 rounded-full" />
                                            <div className="w-5/6 h-2 bg-slate-100 rounded-full" />
                                            <div className="w-4/6 h-2 bg-slate-100 rounded-full" />
                                        </div>
                                    </div>
                                    {/* Front Document */}
                                    <div className="w-56 h-64 bg-white rounded-2xl shadow-2xl z-10 p-5 flex flex-col">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-1/3 h-3 bg-slate-200 rounded-full" />
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                                            </div>
                                        </div>

                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-600"><path d="M20 6L9 17l-5-5" /></svg>
                                                </div>
                                                <div className="w-2/3 h-2 bg-slate-200 rounded-full" />
                                            </div>
                                            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                                </div>
                                                <div className="w-1/2 h-2 bg-slate-200 rounded-full" />
                                            </div>
                                        </div>
                                        <div className="w-full h-8 bg-blue-50 rounded-lg mt-auto flex items-center justify-center">
                                            <div className="w-1/3 h-2 bg-blue-200 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Abstract representation 3: Analytics / Chart */}
                            {slide.image === 'chart' && (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <div className="w-72 h-52 bg-white rounded-2xl shadow-2xl p-6 flex flex-col justify-between">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="space-y-1.5">
                                                <div className="w-16 h-2 bg-slate-200 rounded-full" />
                                                <div className="w-24 h-4 bg-slate-800 rounded-full" />
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                                            </div>
                                        </div>
                                        {/* Bar Chart */}
                                        <div className="flex justify-between items-end h-24 gap-3">
                                            <div className="w-full bg-blue-100 hover:bg-blue-200 transition-colors rounded-t-lg h-[40%]" />
                                            <div className="w-full bg-blue-200 hover:bg-blue-300 transition-colors rounded-t-lg h-[65%]" />
                                            <div className="w-full bg-blue-500 rounded-t-lg h-[90%] relative shadow-lg">
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-5 bg-slate-800 rounded flex items-center justify-center">
                                                    <div className="w-4 h-1 bg-white/80 rounded-full" />
                                                </div>
                                            </div>
                                            <div className="w-full bg-blue-300 hover:bg-blue-400 transition-colors rounded-t-lg h-[75%]" />
                                            <div className="w-full bg-blue-100 hover:bg-blue-200 transition-colors rounded-t-lg h-[50%]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Carousel Text */}
                <div className="text-center h-24">
                    <h2 className="text-[28px] font-bold text-white mb-3 tracking-tight transition-opacity duration-300">
                        {slides[currentSlide].title}
                    </h2>
                    <p className="text-blue-100 text-[16px] leading-relaxed transition-opacity duration-300">
                        {slides[currentSlide].description}
                    </p>
                </div>

                {/* Carousel Dots */}
                <div className="flex items-center gap-2 mt-8">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'w-8 bg-white'
                                : 'w-2 bg-white/40 hover:bg-white/70'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
