import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

// --- Icons ---
const ArrowRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const ArrowDown = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <polyline points="19 12 12 19 5 12"></polyline>
  </svg>
);

const ExternalLink = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

// --- Animation & Utility Components ---

const useCursor = () => {
    const dotRef = useRef<HTMLDivElement>(null);
    const followerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            if (dotRef.current) {
                dotRef.current.style.transform = `translate(${clientX}px, ${clientY}px)`;
            }
            if (followerRef.current) {
                // Add a little lag for the follower for a smoother feel
                followerRef.current.animate({
                    transform: `translate(${clientX}px, ${clientY}px)`
                }, { duration: 500, fill: "forwards" });
            }
        };

        const addHover = () => document.body.classList.add('hovering');
        const removeHover = () => document.body.classList.remove('hovering');

        document.addEventListener('mousemove', moveCursor);
        const interactables = document.querySelectorAll('a, button, .interactive');
        
        interactables.forEach(el => {
            el.addEventListener('mouseenter', addHover);
            el.addEventListener('mouseleave', removeHover);
        });

        // Observer for new elements
        const observer = new MutationObserver((mutations) => {
            const newInteractables = document.querySelectorAll('a, button, .interactive');
            newInteractables.forEach(el => {
                el.removeEventListener('mouseenter', addHover); // Prevent duplicates
                el.addEventListener('mouseenter', addHover);
                el.addEventListener('mouseleave', removeHover);
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            document.removeEventListener('mousemove', moveCursor);
            observer.disconnect();
            interactables.forEach(el => {
                el.removeEventListener('mouseenter', addHover);
                el.removeEventListener('mouseleave', removeHover);
            });
        };
    }, []);

    return { dotRef, followerRef };
};

const Reveal = ({ children, delay = 0, className = "" }: { children: ReactNode, delay?: number, className?: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.1 });
        
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={`overflow-hidden ${className}`}>
            <div 
                style={{ transitionDelay: `${delay}ms` }}
                className={`transition-transform duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${isVisible ? "translate-y-0" : "translate-y-full"}`}
            >
                {children}
            </div>
        </div>
    );
};

const ParallaxBackground = ({ 
    speed = 0.2, 
    children, 
    className = "" 
}: { 
    speed?: number, 
    children?: ReactNode, 
    className?: string 
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let frameId: number;
        
        const animate = () => {
            if (containerRef.current && contentRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const viewHeight = window.innerHeight;
                
                // Only animate when near viewport to save resources
                if (rect.top < viewHeight && rect.bottom > 0) {
                    // Calculate shift based on position relative to viewport
                    // We map the scroll movement to a smaller translation to create depth
                    const yPos = rect.top * speed;
                    contentRef.current.style.transform = `translate3d(0, ${yPos}px, 0)`;
                }
            }
            frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [speed]);

    return (
        <div ref={containerRef} className={`absolute inset-0 overflow-hidden pointer-events-none -z-10 ${className}`}>
            <div ref={contentRef} className="w-full h-[140%] -top-[20%] relative will-change-transform">
                {children}
            </div>
        </div>
    );
};

const Preloader = ({ onComplete }: { onComplete: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setIsLoaded(true);
                        setTimeout(onComplete, 800); // Wait for transition
                    }, 200);
                    return 100;
                }
                return prev + Math.floor(Math.random() * 10) + 1;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className={`loader-container ${isLoaded ? 'loaded' : ''}`}>
            <div className="flex flex-col items-end">
                <div className="text-[15vw] font-bold leading-none tracking-tighter text-accent font-mono">
                    {Math.min(progress, 100)}%
                </div>
                <div className="text-sm font-mono text-text-muted mt-4 uppercase tracking-widest">
                    Loading Experience
                </div>
            </div>
        </div>
    );
};

// --- Page Sections ---

const Navbar = () => {
    return (
        <nav className="fixed top-0 w-full z-40 px-6 py-6 flex justify-between items-start mix-blend-difference text-white pointer-events-none">
            <div className="flex flex-col pointer-events-auto">
                <a href="#" className="font-bold text-lg tracking-tight hover:text-accent transition-colors">
                    FADES.<br/>CODES
                </a>
                <span className="text-xs font-mono text-text-muted mt-2">EST. 2024</span>
            </div>
            
            <div className="hidden md:flex flex-col items-end gap-1 pointer-events-auto">
                <a href="#work" className="text-sm font-mono hover:text-accent transition-colors hover-underline-animation">/ WORK</a>
                <a href="#about" className="text-sm font-mono hover:text-accent transition-colors hover-underline-animation">/ ABOUT</a>
                <a href="#contact" className="text-sm font-mono hover:text-accent transition-colors hover-underline-animation">/ CONTACT</a>
            </div>

            <button className="md:hidden pointer-events-auto text-sm font-mono uppercase border border-white/20 px-4 py-2 rounded-full">
                Menu
            </button>
        </nav>
    );
};

const Hero = () => {
    return (
        <header className="min-h-screen flex flex-col justify-end pb-20 px-6 relative container mx-auto">
            <div className="w-full">
                <div className="mb-4 flex items-center gap-4">
                    <div className="h-px bg-accent w-12"></div>
                    <span className="text-accent font-mono text-sm tracking-widest">CREATIVE DEVELOPER</span>
                </div>
                
                <h1 className="text-[11vw] leading-[0.8] font-bold tracking-tighter uppercase mb-8">
                    <Reveal delay={100}>
                        <span className="block">Digital</span>
                    </Reveal>
                    <Reveal delay={200}>
                        <span className="block text-text-muted">Artisan &</span>
                    </Reveal>
                    <Reveal delay={300}>
                        <span className="block text-accent">Coder</span>
                    </Reveal>
                </h1>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-t border-border pt-8 mt-12">
                    <div className="max-w-md mb-8 md:mb-0">
                         <Reveal delay={600}>
                            <p className="text-lg text-text-muted leading-relaxed">
                                I craft immersive web experiences that merge brutalist design with silky smooth interactions. Based in the digital void, working worldwide.
                            </p>
                         </Reveal>
                    </div>
                    <Reveal delay={800}>
                         <div className="animate-bounce">
                             <ArrowDown className="w-8 h-8 text-accent" />
                         </div>
                    </Reveal>
                </div>
            </div>
            
            {/* Background Texture/Grid */}
            <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none" 
                 style={{backgroundImage: 'radial-gradient(circle at 1px 1px, #333 1px, transparent 0)', backgroundSize: '40px 40px'}}>
            </div>
        </header>
    );
};

const projects = [
    {
        id: 1,
        title: "NEBULA FINANCE",
        category: "Fintech / WebGL",
        year: "2024",
        image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2664&auto=format&fit=crop"
    },
    {
        id: 2,
        title: "VOGUE REDESIGN",
        category: "Editorial / Next.js",
        year: "2023",
        image: "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=2564&auto=format&fit=crop"
    },
    {
        id: 3,
        title: "NIKE AIR MAX",
        category: "Commerce / 3D",
        year: "2023",
        image: "https://images.unsplash.com/photo-1605348532760-6753d5c43329?q=80&w=2564&auto=format&fit=crop"
    },
    {
        id: 4,
        title: "CYBERPUNK UI",
        category: "Design System",
        year: "2022",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop"
    }
];

const WorkList = () => {
    const [hoveredProject, setHoveredProject] = useState<number | null>(null);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const requestRef = useRef<number | null>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        // Use requestAnimationFrame for smoother performance
        if (requestRef.current !== null) return;
        requestRef.current = requestAnimationFrame(() => {
            setCursorPos({ x: e.clientX, y: e.clientY });
            requestRef.current = null;
        });
    };

    return (
        <section id="work" className="py-32 relative z-10 overflow-hidden" onMouseMove={handleMouseMove}>
            <ParallaxBackground speed={-0.1} className="opacity-[0.03]">
                <div className="w-full h-full" 
                     style={{
                        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                     }}>
                </div>
            </ParallaxBackground>

            <div className="container mx-auto px-6 relative">
                <Reveal>
                    <div className="flex items-end justify-between mb-16 border-b border-border pb-4">
                        <h2 className="text-4xl font-bold uppercase tracking-tight">Selected Works</h2>
                        <span className="font-mono text-accent hidden md:block">(04)</span>
                    </div>
                </Reveal>

                <div className="flex flex-col">
                    {projects.map((project, index) => (
                        <div 
                            key={project.id}
                            className="group relative border-b border-border py-12 flex flex-col md:flex-row items-baseline justify-between interactive cursor-none transition-colors duration-300 hover:bg-white/5 px-4"
                            onMouseEnter={() => setHoveredProject(project.id)}
                            onMouseLeave={() => setHoveredProject(null)}
                        >
                            <div className="flex items-baseline gap-8">
                                <span className="font-mono text-xs text-text-muted">0{index + 1}/</span>
                                <h3 className="text-4xl md:text-7xl font-bold uppercase tracking-tighter group-hover:text-transparent group-hover:text-stroke transition-all duration-300">
                                    {project.title}
                                </h3>
                            </div>
                            <div className="flex items-center gap-12 mt-4 md:mt-0">
                                <span className="font-mono text-xs uppercase text-text-muted">{project.category}</span>
                                <span className="font-mono text-xs text-accent">{project.year}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Image Reveal */}
            <div 
                className="fixed top-0 left-0 w-[400px] h-[250px] pointer-events-none z-20 hidden md:block transition-opacity duration-300 mix-blend-normal"
                style={{ 
                    opacity: hoveredProject ? 1 : 0,
                    transform: `translate(${cursorPos.x + 20}px, ${cursorPos.y - 125}px)` // Offset from cursor
                }}
            >
                {projects.map((p) => (
                    <img 
                        key={p.id}
                        src={p.image}
                        alt={p.title}
                        className={`absolute inset-0 w-full h-full object-cover grayscale transition-opacity duration-300 ${hoveredProject === p.id ? 'opacity-100' : 'opacity-0'}`}
                    />
                ))}
            </div>
        </section>
    );
};

const Services = () => {
    const services = [
        "Creative Direction", "Web Development", "UI/UX Design", "WebGL / 3D", "Brand Identity", "Motion Design"
    ];

    return (
        <section id="about" className="py-32 bg-surface relative overflow-hidden">
             <ParallaxBackground speed={0.15} className="opacity-10 pointer-events-none">
                <div className="absolute top-0 right-0 text-[30vw] font-bold leading-none text-white opacity-5 whitespace-nowrap">
                    SERVICES
                </div>
            </ParallaxBackground>

            <div className="container mx-auto px-6 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                    <div>
                         <Reveal>
                            <h2 className="text-xs font-mono text-accent mb-8 uppercase tracking-widest">/ What I Do</h2>
                         </Reveal>
                         <Reveal delay={200}>
                            <h3 className="text-4xl md:text-5xl font-bold leading-tight mb-8">
                                I help bold brands define their digital presence through rapid prototyping and code-driven design.
                            </h3>
                         </Reveal>
                         <Reveal delay={300}>
                             <a href="#" className="inline-flex items-center gap-2 text-sm font-mono uppercase border-b border-accent pb-1 hover:text-accent transition-colors">
                                 Read Full Bio <ExternalLink className="w-4 h-4" />
                             </a>
                         </Reveal>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
                        {services.map((service, i) => (
                            <Reveal key={service} delay={i * 100}>
                                <div className="group border-t border-border pt-4 interactive">
                                    <h4 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">{service}</h4>
                                    <p className="text-sm text-text-muted">
                                        End-to-end execution from concept to deployment with a focus on performance.
                                    </p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const Marquee = () => {
    return (
        <div className="py-8 bg-accent text-background overflow-hidden flex items-center relative z-20">
            <div className="animate-marquee whitespace-nowrap flex gap-8 items-center">
                {[...Array(10)].map((_, i) => (
                    <span key={i} className="text-4xl font-bold uppercase tracking-tighter">
                        AVAILABLE FOR FREELANCE WORK <span className="mx-4 text-transparent text-stroke-black">•</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

const Footer = () => {
    return (
        <footer id="contact" className="relative w-full min-h-screen flex flex-col pt-32 pb-8 px-6 overflow-hidden">
            <ParallaxBackground speed={-0.2} className="opacity-30">
                <div className="w-full h-full bg-gradient-to-b from-transparent to-[#1a1a1a]"></div>
                <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-accent blur-[150px] opacity-10"></div>
            </ParallaxBackground>

            <div className="container mx-auto flex-grow flex flex-col justify-between relative z-10">
                <div className="flex-grow flex flex-col justify-center">
                    <Reveal>
                        <h2 className="text-[12vw] leading-none font-bold tracking-tighter uppercase text-center md:text-left hover:text-accent transition-colors duration-500 cursor-pointer">
                            Let's<br/>Work<br/>Together
                        </h2>
                    </Reveal>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-border pt-8 mt-12">
                    <div>
                        <h4 className="font-mono text-xs text-text-muted mb-4 uppercase">Contact</h4>
                        <a href="mailto:hello@example.com" className="block text-xl font-bold hover:text-accent">hello@fades.codes</a>
                        <a href="tel:+1234567890" className="block text-xl font-bold hover:text-accent">+1 (555) 000-0000</a>
                    </div>
                    
                    <div>
                        <h4 className="font-mono text-xs text-text-muted mb-4 uppercase">Socials</h4>
                        <div className="flex flex-col gap-2">
                            <a href="#" className="hover:text-accent hover:translate-x-2 transition-transform">Instagram</a>
                            <a href="#" className="hover:text-accent hover:translate-x-2 transition-transform">Twitter / X</a>
                            <a href="#" className="hover:text-accent hover:translate-x-2 transition-transform">GitHub</a>
                            <a href="#" className="hover:text-accent hover:translate-x-2 transition-transform">LinkedIn</a>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between md:text-right">
                        <span className="font-mono text-xs text-text-muted uppercase">Designed & Built by Alex</span>
                        <span className="font-mono text-xs text-text-muted uppercase mt-4">© 2024 All Rights Reserved</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const App = () => {
    const [loading, setLoading] = useState(true);
    const { dotRef, followerRef } = useCursor();

    return (
        <>
            <Preloader onComplete={() => setLoading(false)} />
            
            {/* Custom Cursor DOM */}
            <div ref={dotRef} className="cursor-dot hidden md:block"></div>
            <div ref={followerRef} className="cursor-follower hidden md:block"></div>

            <main className={`transition-opacity duration-1000 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                <Navbar />
                <Hero />
                <Marquee />
                <WorkList />
                <Services />
                <Footer />
            </main>
        </>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);