import { useState, useEffect } from "react";
import { motion } from "motion/react";

interface Particle {
  id: number;
  x: number;
  y: number;
}

export function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let particleId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsMoving(true);

      if (Math.random() > 0.7) {
        const newParticle = {
          id: particleId++,
          x: e.clientX,
          y: e.clientY,
        };
        setParticles((prev) => [...prev, newParticle]);

        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
        }, 800);
      }

      clearTimeout(timeout);
      timeout = setTimeout(() => setIsMoving(false), 100);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      <motion.div
        className="fixed pointer-events-none z-[9999] hidden lg:block"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
        }}
        animate={{
          scale: isMoving ? 1 : 0.8,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      >
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "40px",
            height: "40px",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-400/50"
          style={{
            width: "12px",
            height: "12px",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.8) 0%, rgba(167, 139, 250, 0.3) 100%)",
          }}
        />
      </motion.div>

      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="fixed pointer-events-none z-[9998] hidden lg:block"
          initial={{
            x: particle.x,
            y: particle.y,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: particle.x + (Math.random() - 0.5) * 50,
            y: particle.y + (Math.random() - 0.5) * 50,
            scale: 0,
            opacity: 0,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div
            className="w-1 h-1 rounded-full"
            style={{
              background: `linear-gradient(45deg, #8b5cf6, #a78bfa, #c4b5fd)`,
              boxShadow: "0 0 8px rgba(139, 92, 246, 0.8)",
            }}
          />
        </motion.div>
      ))}
    </>
  );
}
