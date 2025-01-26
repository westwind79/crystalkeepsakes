// components/effects/ParticleBackground.jsx
import React, { useEffect, useRef } from 'react';

export const ParticleBackground = () => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Create particles
    const particleCount = 50;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Randomize initial position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      
      // Add animation delay
      particle.style.animationDelay = `${Math.random() * 5}s`;
      
      container.appendChild(particle);
      particles.push(particle);
    }
    
    // Cleanup
    return () => {
      particles.forEach(particle => particle.remove());
    };
  }, []);

  return (
    <div className="particle-container" ref={containerRef}></div>
  );
};