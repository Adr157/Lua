
import React, { useMemo } from 'react';

interface Star {
  id: number;
  style: React.CSSProperties;
  animationClass: string;
  sizeClass: string;
}

const AnimatedBackground: React.FC = () => {
  const numStars = 70; // Number of stars

  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: numStars }).map((_, i) => {
      const size = Math.random() * 2 + 0.5; // Star size between 0.5px and 2.5px
      const animationDelay = Math.random() * 5; // Random delay for twinkling
      const randomAnimation = Math.ceil(Math.random() * 3); // 1, 2, or 3

      return {
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${size}px`,
          height: `${size}px`,
          animationDelay: `${animationDelay}s`,
        },
        animationClass: `animate-twinkle-${randomAnimation}`,
        sizeClass: size < 1 ? 'opacity-70' : (size < 1.5 ? 'opacity-80' : 'opacity-90')
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950" />
      {stars.map(star => (
        <div
          key={star.id}
          className={`absolute rounded-full bg-slate-300 ${star.animationClass} ${star.sizeClass}`}
          style={star.style}
        />
      ))}
      {/* Subtle "nebula" effects */}
      <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      <div className="absolute bottom-1/8 right-1/8 w-1/3 h-1/3 bg-indigo-500/10 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
    </div>
  );
};

export default AnimatedBackground;
