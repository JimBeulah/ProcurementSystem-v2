import React, { useEffect, useRef } from 'react';

const ParticleCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Futuristic Cyber/Neon Palette
        const colors = ['#00f3ff', '#bc13fe', '#4a00e0', '#00ffcc'];

        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                // Faster base velocity
                this.vx = (Math.random() - 0.5) * 1.5;
                this.vy = (Math.random() - 0.5) * 1.5;
                this.radius = Math.random() * 2 + 1;
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update(mouseX, mouseY) {
                // Movement
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges smoothly
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

                // Mouse interaction - pull towards mouse if close
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 200) {
                    // Magnetic pull towards the cursor
                    this.x += dx * 0.01;
                    this.y += dy * 0.01;

                    // Slightly agitate particles
                    this.vx += (Math.random() - 0.5) * 0.1;
                    this.vy += (Math.random() - 0.5) * 0.1;

                    // Cap speed to avoid chaos
                    const maxSpeed = 3.5;
                    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    if (speed > maxSpeed) {
                        this.vx = (this.vx / speed) * maxSpeed;
                        this.vy = (this.vy / speed) * maxSpeed;
                    }
                }

                this.draw();
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;

                // Add futuristic neon glow
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.fill();

                // Reset shadow to avoid massive performance hit on lines
                ctx.shadowBlur = 0;
            }
        }

        // Slightly fewer particles since lines are expensive
        const particlesArray = Array.from({ length: 120 }, () => new Particle());

        let mouseX = -1000;
        let mouseY = -1000;

        const handleMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };
        const handleMouseLeave = () => {
            mouseX = -1000;
            mouseY = -1000;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        const animate = () => {
            // Draw a semi-transparent dark background to create motion trails (Cyber effect)
            ctx.fillStyle = 'rgba(5, 5, 12, 0.25)'; // Deep space/tech-blue fade base
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particlesArray.forEach(particle => particle.update(mouseX, mouseY));

            // Draw Constellation Lines (The Network Effect)
            for (let i = 0; i < particlesArray.length; i++) {
                for (let j = i; j < particlesArray.length; j++) {
                    const dx = particlesArray[i].x - particlesArray[j].x;
                    const dy = particlesArray[i].y - particlesArray[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        ctx.beginPath();
                        // Cyan fading laser lines
                        ctx.strokeStyle = `rgba(0, 243, 255, ${0.15 - distance / 800})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                        ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                        ctx.stroke();
                    }
                }

                // Draw lines to the mouse if close enough (Energy extraction effect)
                const dxMouse = particlesArray[i].x - mouseX;
                const dyMouse = particlesArray[i].y - mouseY;
                const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

                if (distMouse < 180) {
                    ctx.beginPath();
                    // Purple magnetic lines drawn to the cursor
                    ctx.strokeStyle = `rgba(188, 19, 254, ${0.4 - distMouse / 450})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                    ctx.lineTo(mouseX, mouseY);
                    ctx.stroke();
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', setCanvasSize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#05050C]">
            {/* The animated tech grid / particles */}
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none mix-blend-screen"
            />
            {/* Dark vignette to focus attention to the center panel */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,2,6,0.95)_100%)]"></div>
        </div>
    );
};

export default ParticleCanvas;
