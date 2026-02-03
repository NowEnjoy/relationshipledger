import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  onClick: () => void;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({ children, onDelete, onClick }) => {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
    // Disable transition during drag for immediate response
    if (itemRef.current) itemRef.current.style.transition = 'none';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;

    // Only allow dragging left (negative diff), max -100px
    // If already open (offset is negative), allow dragging back to right
    let newOffset = diff;
    
    // Resistance/Limit logic
    if (newOffset < -100) newOffset = -100 + (newOffset + 100) * 0.2; // Elasticity
    if (newOffset > 0) newOffset = 0;

    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (itemRef.current) itemRef.current.style.transition = 'transform 0.2s ease-out';

    // Threshold to snap open/close
    if (offset < -50) {
      setOffset(-80); // Snap open to reveal button
    } else {
      setOffset(0); // Snap closed
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOffset(0);
    // Directly delete without confirmation dialog
    // The interaction cost (swipe + precise tap) is high enough to assume intent
    // This avoids issues where browsers block window.confirm
    onDelete();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl mb-3 select-none">
      {/* Background Action Layer (Delete Button) */}
      <div className="absolute inset-y-0 right-0 w-full bg-red-500 flex justify-end items-center px-6 rounded-2xl">
        <Trash2 className="text-white animate-pulse" size={24} />
      </div>

      {/* Foreground Content Layer */}
      <div
        ref={itemRef}
        className="relative bg-white dark:bg-slate-800 rounded-2xl z-10 touch-pan-y shadow-sm border border-slate-100 dark:border-slate-700"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
            // If open, close it; otherwise trigger normal click
            if (offset < -10) setOffset(0);
            else onClick();
        }}
      >
        {children}
      </div>

      {/* Invisible trigger area for the delete button behind the content */}
      {offset < -40 && (
         <div 
            className="absolute top-0 bottom-0 right-0 w-24 z-20 cursor-pointer"
            onClick={handleDeleteClick}
         />
      )}
    </div>
  );
};

export default SwipeableItem;