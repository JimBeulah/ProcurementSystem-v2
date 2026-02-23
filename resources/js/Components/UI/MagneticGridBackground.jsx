import { useEffect, useState, useRef } from 'react';

export default function MagneticGridBackground() {
    const containerRef = useRef(null);
    const [hasMoved, setHasMoved] = useState(false);

    useEffect(() => {
        const updateMousePosition = (e) => {
            if (!containerRef.current) return;
            if (!hasMoved) setHasMoved(true);

            const { clientX, clientY } = e;
            containerRef.current.style.setProperty('--mouse-x', `${clientX}px`);
            containerRef.current.style.setProperty('--mouse-y', `${clientY}px`);
        };

        window.addEventListener('mousemove', updateMousePosition);
        return () => window.removeEventListener('mousemove', updateMousePosition);
    }, [hasMoved]);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-0 bg-slate-50 dark:bg-slate-950 overflow-hidden"
            style={{
                '--mouse-x': '50vw',
                '--mouse-y': '50vh',
            }}
        >
            {/* Base faint grid */}
            <div className="absolute inset-0 bg-[radial-gradient(theme(colors.slate.300)_1px,transparent_1px)] dark:bg-[radial-gradient(theme(colors.slate.800)_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />

            {/* Magnetic highlight grid */}
            <div
                className="absolute inset-0 bg-[radial-gradient(theme(colors.blue.500)_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(theme(colors.cyan.400)_1.5px,transparent_1.5px)] [background-size:24px_24px] transition-opacity duration-1000"
                style={{
                    opacity: hasMoved ? 1 : 0,
                    maskImage: 'radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), black, transparent)',
                    WebkitMaskImage: 'radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), black, transparent)',
                }}
            />

            {/* Soft Ambient Glow following the cursor */}
            <div
                className="absolute inset-0 mix-blend-multiply dark:mix-blend-screen transition-opacity duration-1000 pointer-events-none"
                style={{
                    opacity: hasMoved ? 0.15 : 0,
                    background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), theme(colors.blue.400), transparent 40%)',
                }}
            />
        </div>
    );
}
