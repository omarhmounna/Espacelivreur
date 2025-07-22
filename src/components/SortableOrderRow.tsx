import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Order } from '@/pages/Index';

interface SortableOrderRowProps {
  order: Order;
  index: number;
  children: React.ReactNode;
  className?: string;
  isDragEnabled?: boolean; // New prop to control dragging
}

const SortableOrderRow: React.FC<SortableOrderRowProps> = ({ 
  order, 
  index, 
  children, 
  className,
  isDragEnabled = false // Default to false
}) => {
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    setActivatorNodeRef,
  } = useSortable({ 
    id: order.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  // Handle long press for mobile - only if dragging is enabled
  const handleTouchStart = (e: React.TouchEvent) => {
    console.log('Touch start - isDragEnabled:', isDragEnabled);
    if (!isDragEnabled) {
      console.log('Touch start - drag disabled, allowing normal scroll');
      return; // Return early if dragging is disabled
    }
    
    console.log('Touch start detected on mobile - drag enabled');
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    // Clear any existing timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
      console.log('Starting long press timer...');
      // Start long press timer - reduced to 150ms for faster response
      longPressTimer.current = setTimeout(() => {
        console.log('Long press activated!');
        setIsLongPress(true);
        
        // Add stronger haptic feedback on mobile
        if ('vibrate' in navigator) {
          console.log('Vibrating device - stronger feedback');
          navigator.vibrate([50, 30, 50]); // Pattern for better feedback
        }
        
        // Visual feedback - add temporary class for indication
        const element = e.currentTarget as HTMLElement;
        element.style.transform = 'scale(1.02)';
        element.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
        element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        
        console.log('Triggering drag start manually');
        // Force enable dragging and trigger pointer event
        if (listeners?.onPointerDown) {
          const syntheticEvent = new PointerEvent('pointerdown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            pointerId: 1,
            pointerType: 'touch',
            isPrimary: true,
            bubbles: true,
          });
          listeners.onPointerDown(syntheticEvent as any);
        }
      }, 150); // Reduced from 200ms to 150ms for faster response
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    console.log('Touch move detected');
    if (!touchStartPos.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    console.log(`Touch movement: deltaX=${deltaX}, deltaY=${deltaY}`);
    
    // Cancel long press if finger moves too much (more than 10px)
    if ((deltaX > 10 || deltaY > 10) && longPressTimer.current) {
      console.log('Cancelling long press due to movement');
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      return; // السماح بالسكرول الطبيعي
    }
    
    // If we're in drag mode, handle the move and prevent scrolling
    if (isLongPress) {
      e.stopPropagation();
      e.preventDefault();
      if (listeners?.onPointerMove) {
        console.log('Handling drag move');
        const syntheticEvent = new PointerEvent('pointermove', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          pointerId: 1,
          pointerType: 'touch',
          isPrimary: true,
          bubbles: true,
        });
        listeners.onPointerMove(syntheticEvent as any);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    console.log('Touch end detected');
    
    // Clear long press timer
    if (longPressTimer.current) {
      console.log('Clearing long press timer');
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // If we were dragging, end the drag
    if (isLongPress && listeners?.onPointerUp) {
      console.log('Ending drag');
      e.stopPropagation();
      const changedTouch = e.changedTouches[0];
      const syntheticEvent = new PointerEvent('pointerup', {
        clientX: changedTouch.clientX,
        clientY: changedTouch.clientY,
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        bubbles: true,
      });
      listeners.onPointerUp(syntheticEvent as any);
    }
    
    // Reset states and restore original styling
    console.log('Resetting drag state');
    setIsLongPress(false);
    touchStartPos.current = null;
    
    // Reset visual effects
    const element = e.currentTarget as HTMLElement;
    element.style.transform = '';
    element.style.boxShadow = '';
    element.style.backgroundColor = '';
  };

  // Handle mouse events for desktop - only if dragging is enabled
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDragEnabled) return; // Return early if dragging is disabled
    if (e.button !== 0) return; // Only left click
    
    setIsLongPress(true);
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e as any);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setActivatorNodeRef(node);
      }}
      style={style}
      className={`${className} ${isDragging ? 'shadow-lg' : ''} relative ${isDragEnabled ? 'cursor-grab hover:cursor-grab' : ''}`}
      {...attributes}
      {...(isDragEnabled ? listeners : {})} // Only apply DnD listeners when drag is enabled
      onTouchStart={handleTouchStart} // Always handle touch start for long press detection
      onTouchMove={handleTouchMove}   // Always handle touch move
      onTouchEnd={handleTouchEnd}     // Always handle touch end
      onMouseDown={handleMouseDown}   // Always handle mouse down
    >
      {children}
    </div>
  );
};

export default SortableOrderRow;