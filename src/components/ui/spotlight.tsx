import * as React from "react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spotlightColor?: string;
  spotlightSize?: number;
  spotlightOpacity?: number;
}

export function Spotlight({
  children,
  className,
  spotlightColor = "rgba(var(--text-primary-rgb), 0.08)",
  spotlightSize = 400,
  spotlightOpacity = 1,
  ...props
}: SpotlightProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseEnter = useCallback(() => setOpacity(spotlightOpacity), [spotlightOpacity]);
  const handleMouseLeave = useCallback(() => setOpacity(0), []);

  return (
    <div
      className={cn("relative overflow-hidden group/spotlight", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px z-10 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(${spotlightSize}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
          borderRadius: "inherit",
        }}
      />
      {children}
    </div>
  );
}

interface SpotlightCardProps extends SpotlightProps {
  borderSpotlightColor?: string;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(var(--text-primary-rgb), 0.05)",
  borderSpotlightColor = "rgba(var(--text-primary-rgb), 0.15)",
  ...props
}: SpotlightCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseEnter = useCallback(() => setOpacity(1), []);
  const handleMouseLeave = useCallback(() => setOpacity(0), []);

  return (
    <div
      className={cn(
        "relative rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--surface-color)] p-6 overflow-hidden group/spotlight-card",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Background Spotlight */}
      <div
        className="pointer-events-none absolute -inset-px z-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
          borderRadius: "inherit",
        }}
      />
      
      {/* Border Spotlight */}
      <div
        className="pointer-events-none absolute -inset-px z-10 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${borderSpotlightColor}, transparent 40%)`,
          maskImage: `linear-gradient(black, black) content-box, linear-gradient(black, black)`,
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
          borderRadius: "inherit",
        }}
      />

      <div className="relative z-20">{children}</div>
    </div>
  );
}
