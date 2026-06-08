import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';

interface DropZoneProps {
  id: string;
  children: React.ReactNode;
  activeDragId: string | null;
}

type Direction = 'top' | 'bottom' | 'left' | 'right';

export function DropZone({ id, children, activeDragId }: DropZoneProps) {
  const [direction, setDirection] = useState<Direction | null>(null);

  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      direction,
    }
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isOver) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const w = rect.width;
    const h = rect.height;

    // Calculate which quadrant the mouse is in
    const distTop = y;
    const distBottom = h - y;
    const distLeft = x;
    const distRight = w - x;

    const minDist = Math.min(distTop, distBottom, distLeft, distRight);

    if (minDist === distTop) setDirection('top');
    else if (minDist === distBottom) setDirection('bottom');
    else if (minDist === distLeft) setDirection('left');
    else if (minDist === distRight) setDirection('right');
  };

  const getOverlayStyle = () => {
    if (!direction) return {};
    
    switch (direction) {
      case 'top': return { top: 0, left: 0, width: '100%', height: '50%' };
      case 'bottom': return { bottom: 0, left: 0, width: '100%', height: '50%' };
      case 'left': return { top: 0, left: 0, width: '50%', height: '100%' };
      case 'right': return { top: 0, right: 0, width: '50%', height: '100%' };
    }
  };

  const isDraggingSelf = activeDragId === id;

  return (
    <div 
      ref={setNodeRef}
      className="relative w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setDirection(null)}
      data-drop-direction={isOver ? direction : undefined}
    >
      {children}
      
      <AnimatePresence>
        {isOver && !isDraggingSelf && direction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'absolute',
              zIndex: 100,
              pointerEvents: 'none',
              background: 'rgba(var(--accent-primary-rgb), 0.15)',
              border: '2px solid var(--accent-primary)',
              boxShadow: '0 0 40px rgba(var(--accent-primary-rgb), 0.2)',
              backdropFilter: 'blur(2px)',
              ...getOverlayStyle()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
