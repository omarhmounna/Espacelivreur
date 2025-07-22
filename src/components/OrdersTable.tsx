import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Phone, MessageCircle, Edit2, Send, GripVertical, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SortableOrderRow from './SortableOrderRow';
import type { Order } from '@/pages/Index';

interface TableSettings {
  columnVisibility: {
    code: boolean;
    destination: boolean;
    phone: boolean;
    price: boolean;
    commission: boolean;
    comment: boolean;
    status: boolean;
  };
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'light';
  textAlignment: {
    code: 'left' | 'center' | 'right';
    phone: 'left' | 'center' | 'right';
    price: 'left' | 'center' | 'right';
    comment: 'left' | 'center' | 'right';
  };
  coordinatesVisibility: boolean;
}

interface OrdersTableProps {
  orders: Order[];
  onUpdateComment: (id: string, comment: string, showNotification?: boolean) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePhone: (id: string, phone: string, showNotification?: boolean) => void;
  onUpdatePrice: (id: string, price: number, showNotification?: boolean) => void;
  onUpdateCommission: (id: string, commission: number) => void;
  onReorderOrders: (newOrders: Order[]) => void;
  tableSettings: TableSettings;
  defaultCommission?: number;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onUpdateComment, onUpdateStatus, onUpdatePhone, onUpdatePrice, onUpdateCommission, onReorderOrders, tableSettings, defaultCommission = 0 }) => {
  const { t, isRTL } = useLanguage();
  
  // دالة نسخ النص مع إظهار مؤشر النسخ
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log(`تم نسخ ${label}: ${text}`);
      
      // إخفاء مؤشر النسخ
      setCopyIndicator({ isVisible: false, text: '', position: { x: 0, y: 0 } });
      
      // اهتزاز خفيف للتأكيد
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (err) {
      console.error('فشل في النسخ:', err);
      setCopyIndicator({ isVisible: false, text: '', position: { x: 0, y: 0 } });
    }
  };

  // دالة التعامل مع بداية الضغط المطول
  const handleLongPressStart = (
    e: React.TouchEvent | React.MouseEvent,
    text: string
  ) => {
    if (!text || text.trim() === '') return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // مسح أي مؤقت سابق
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    // بدء مؤقت الضغط المطول
    longPressTimer.current = setTimeout(() => {
      // إظهار أيقونة النسخ
      setCopyIndicator({
        isVisible: true,
        text: text,
        position: { x: clientX, y: clientY - 50 } // إظهار الأيقونة فوق الإصبع
      });

      // اهتزاز للتأكيد
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    }, longPressThreshold);
  };

  // دالة التعامل مع انتهاء الضغط المطول
  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // دالة التعامل مع النقر على أيقونة النسخ
  const handleCopyClick = () => {
    if (copyIndicator.text) {
      copyToClipboard(copyIndicator.text, 'محتوى الخانة');
    }
  };
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isDragEnabled, setIsDragEnabled] = useState(false); // New state for controlling drag
  const [editingComment, setEditingComment] = useState<string | null>(null); // للتعليق المُحرر حالياً
  const [tempCommentValue, setTempCommentValue] = useState<string>(''); // قيمة التعليق المؤقتة أثناء التحرير
  const [tempPhoneValue, setTempPhoneValue] = useState<string>(''); // قيمة الهاتف المؤقتة أثناء التحرير
  const [tempPriceValue, setTempPriceValue] = useState<string>(''); // قيمة السعر المؤقتة أثناء التحرير
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [recentlyScannedOrders, setRecentlyScannedOrders] = useState<Set<string>>(new Set());
  const [scannedOrdersTimer, setScannedOrdersTimer] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [permanentlyScannedOrders, setPermanentlyScannedOrders] = useState<Set<string>>(new Set());
  const [touchVelocity, setTouchVelocity] = useState({ x: 0, y: 0 });
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const [lastTouchPosition, setLastTouchPosition] = useState({ x: 0, y: 0 });
  const [columnWidths, setColumnWidths] = useState({
    code: 12,      // 12%
    vendeur: 20,   // 20%
    numero: 16,    // 16%
    prix: 10,      // 10%
    status: 12,    // 12%
    comment: 30    // 30%
  });


  // إضافة حالة للحوار التأكيدي
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    orderId: string;
    orderCode: string;
  }>({
    isOpen: false,
    orderId: '',
    orderCode: ''
  });

  // إضافة حالة لعرض أيقونات التفاعل مع رقم الهاتف
  const [phoneActionsPopup, setPhoneActionsPopup] = useState<{
    isOpen: boolean;
    phoneNumber: string;
    orderId: string;
    targetElement: HTMLElement | null;
    position?: { x: number; y: number };
  }>({
    isOpen: false,
    phoneNumber: '',
    orderId: '',
    targetElement: null,
    position: undefined
  });

  // إضافة حالة لعرض أيقونة النسخ عند الضغط المطول
  const [copyIndicator, setCopyIndicator] = useState<{
    isVisible: boolean;
    text: string;
    position: { x: number; y: number };
  }>({
    isVisible: false,
    text: '',
    position: { x: 0, y: 0 }
  });

  // متغيرات للضغط المطول
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressThreshold = 500; // 500ms للضغط المطول

  const containerRef = useRef<HTMLDivElement>(null);
  
  // DND Kit sensors - optimized for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Allow a little movement before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orders.findIndex((order) => order.id === active.id);
      const newIndex = orders.findIndex((order) => order.id === over.id);

      const newOrders = arrayMove(orders, oldIndex, newIndex);
      onReorderOrders(newOrders);
      
      // إضافة اهتزاز خفيف عند إنجاز السحب
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    }
    
    // لا نقوم بإعادة تعيين isDragEnabled هنا بحيث تبقى قائمة الحالة مفتوحة
    // setIsDragEnabled(false); // إزالة هذا السطر
  };
  const momentumAnimationRef = useRef<number | null>(null);
  const resizeStartPosRef = useRef<{ x: number; initialWidth: number }>({ x: 0, initialWidth: 0 });

  const statusOptions = [
    'Confirmé',
    'Livré', 
    'Reporté',
    'Annulé',
    'Refusé',
    'Numéro erroné',
    'Hors zone',
    'Programmé',
    'Pas de réponse'
  ];

  // Helper function to check if status is rejected/cancelled
  const isRejectedStatus = (status: string) => {
    return ['Annulé', 'Refusé', 'Hors zone', 'Pas de réponse'].includes(status);
  };

  // Enhanced tracking for recently scanned orders - show animation only once then keep permanent state
  useEffect(() => {
    console.log('Current orders scan status:', orders.map(o => ({ id: o.id, code: o.code, isScanned: o.isScanned })));
    
    orders.forEach(order => {
      if (order.isScanned && !permanentlyScannedOrders.has(order.id)) {
        console.log('New scanned order detected (first time):', order.id, order.code);
        
        // Add to permanently scanned set immediately
        setPermanentlyScannedOrders(prev => {
          const newSet = new Set(prev);
          newSet.add(order.id);
          console.log('Added to permanently scanned:', order.id);
          return newSet;
        });

        // Add to recently scanned set for 3-second animation
        setRecentlyScannedOrders(prev => {
          const newSet = new Set(prev);
          newSet.add(order.id);
          console.log('Added to recently scanned for animation:', order.id);
          return newSet;
        });
        
        // Clear any existing timer for this order
        const existingTimer = scannedOrdersTimer.get(order.id);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        
        // Set new timer to remove animation after 3 seconds (but keep permanent state)
        const newTimer = setTimeout(() => {
          console.log('Removing animation for order (keeping permanent state):', order.id);
          setRecentlyScannedOrders(prev => {
            const updated = new Set(prev);
            updated.delete(order.id);
            console.log('Removed from recently scanned animation:', order.id);
            return updated;
          });
          
          // Clean up timer from map
          setScannedOrdersTimer(prev => {
            const newMap = new Map(prev);
            newMap.delete(order.id);
            return newMap;
          });
        }, 3000);
        
        // Store timer reference
        setScannedOrdersTimer(prev => {
          const newMap = new Map(prev);
          newMap.set(order.id, newTimer);
          return newMap;
        });
      }
    });
    
    // Clean up timers for orders that are no longer scanned
    scannedOrdersTimer.forEach((timer, orderId) => {
      const order = orders.find(o => o.id === orderId);
      if (!order || !order.isScanned) {
        clearTimeout(timer);
        setScannedOrdersTimer(prev => {
          const newMap = new Map(prev);
          newMap.delete(orderId);
          return newMap;
        });
        // Also remove from permanent state if order is no longer scanned
        setPermanentlyScannedOrders(prev => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
      }
    });
  }, [orders, permanentlyScannedOrders]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      scannedOrdersTimer.forEach(timer => clearTimeout(timer));
      if (momentumAnimationRef.current) {
        cancelAnimationFrame(momentumAnimationRef.current);
      }
    };
  }, []);

  // Enhanced momentum scrolling for ultra-smooth touch experience
  const applyMomentumScrolling = (velocity: { x: number, y: number }) => {
    if (!containerRef.current) return;
    
    // Ultra-refined friction for Google Sheets-like smoothness
    const friction = 0.95; // Higher value = less friction = smoother
    const minVelocity = 0.1; // Lower threshold for longer momentum
    const elasticBounds = true;
    
    const animate = () => {
      if (Math.abs(velocity.x) < minVelocity && Math.abs(velocity.y) < minVelocity) {
        momentumAnimationRef.current = null;
        return;
      }
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const maxPanX = 0;
        const maxPanY = 0;
        const minPanX = Math.min(0, rect.width - (800 * zoomLevel));
        const minPanY = Math.min(0, rect.height - (600 * zoomLevel));
        
        const newX = panOffset.x + velocity.x;
        const newY = panOffset.y + velocity.y;
        
        // Elastic bounds for more natural feel
        let finalX = newX;
        let finalY = newY;
        
        if (elasticBounds) {
          // Allow subtle overscroll with ultra-smooth elastic bounce back - like Google Sheets
          const elasticStrength = 0.15; // Much smoother elastic effect
          
          if (newX > maxPanX) {
            finalX = maxPanX + (newX - maxPanX) * elasticStrength;
            velocity.x *= 0.92; // Gentle velocity reduction for smooth feel
          } else if (newX < minPanX) {
            finalX = minPanX + (newX - minPanX) * elasticStrength;
            velocity.x *= 0.92; // Gentle velocity reduction for smooth feel
          }
          
          if (newY > maxPanY) {
            finalY = maxPanY + (newY - maxPanY) * elasticStrength;
            velocity.y *= 0.92;
          } else if (newY < minPanY) {
            finalY = minPanY + (newY - minPanY) * elasticStrength;
            velocity.y *= 0.92;
          }
        } else {
          finalX = Math.max(minPanX, Math.min(maxPanX, newX));
          finalY = Math.max(minPanY, Math.min(maxPanY, newY));
        }
        
        setPanOffset({ x: finalX, y: finalY });
      }
      
      velocity.x *= friction;
      velocity.y *= friction;
      
      momentumAnimationRef.current = requestAnimationFrame(animate);
    };
    
    momentumAnimationRef.current = requestAnimationFrame(animate);
  };

  // Enhanced column resizing with better mobile support
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, column: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Resize start for column:', column);
    setIsResizing(true);
    setResizingColumn(column);
    
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const currentWidth = columnWidths[column as keyof typeof columnWidths];
    
    // Store initial position and width for smoother calculations
    resizeStartPosRef.current = { x: startX, initialWidth: currentWidth };
    
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      const rect = containerRef.current.getBoundingClientRect();
      const totalWidth = rect.width;
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      
      // Calculate delta from the initial position
      const deltaX = currentX - resizeStartPosRef.current.x;
      const deltaPercent = (deltaX / totalWidth) * 100;
      
      // Apply the change relative to the initial width with more flexible limits
      let minWidth = 2; // Smaller default minimum width
      
      // Allow even smaller minimum for all columns to give more flexibility
      if (column === 'vendeur' || column === 'code' || column === 'destination') {
        minWidth = 0.5; // Very small minimum for vendor, code, and destination columns
      } else if (column === 'numero' || column === 'prix') {
        minWidth = 0.5; // Very small minimum for phone and price
      } else if (column === 'comment') {
        minWidth = 1; // Slightly bigger minimum for comment column
      }
      
      const newWidth = Math.max(minWidth, Math.min(50, resizeStartPosRef.current.initialWidth + deltaPercent));
      
      console.log(`Resizing ${column}: deltaX=${deltaX}, deltaPercent=${deltaPercent.toFixed(2)}, newWidth=${newWidth.toFixed(2)}, minWidth=${minWidth}`);
      
      setColumnWidths(prev => ({
        ...prev,
        [column]: newWidth
      }));
    };
    
    const handleEnd = (endEvent?: MouseEvent | TouchEvent) => {
      console.log('Resize end for column:', column);
      setIsResizing(false);
      setResizingColumn(null);
      
      // Clean up event listeners
      document.removeEventListener('mousemove', handleMove as EventListener, { passive: false } as any);
      document.removeEventListener('mouseup', handleEnd as EventListener);
      document.removeEventListener('touchmove', handleMove as EventListener, { passive: false } as any);
      document.removeEventListener('touchend', handleEnd as EventListener);
    };
    
    // Add event listeners with proper options for touch devices
    document.addEventListener('mousemove', handleMove as EventListener, { passive: false });
    document.addEventListener('mouseup', handleEnd as EventListener);
    document.addEventListener('touchmove', handleMove as EventListener, { passive: false });
    document.addEventListener('touchend', handleEnd as EventListener);
  };

  // Check if scrollbar should be visible
  useEffect(() => {
    const checkScrollbarVisibility = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const needsHorizontalScroll = container.scrollWidth > container.clientWidth;
        const isZoomedOut = zoomLevel < 0.8;
        setShowScrollbar(needsHorizontalScroll || isZoomedOut);
      }
    };

    checkScrollbarVisibility();
    window.addEventListener('resize', checkScrollbarVisibility);
    
    return () => {
      window.removeEventListener('resize', checkScrollbarVisibility);
    };
  }, [zoomLevel, orders]);

  // Enhanced keyboard shortcuts for zoom with focus point preservation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          zoomAtPoint(0.1, null);
        } else if (e.key === '-') {
          e.preventDefault();
          zoomAtPoint(-0.1, null);
        } else if (e.key === '0') {
          e.preventDefault();
          setZoomLevel(1);
          setPanOffset({ x: 0, y: 0 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomLevel, panOffset]);

  // Enhanced zoom function that preserves focus point
  const zoomAtPoint = (deltaZoom: number, focusPoint: { x: number, y: number } | null) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Use center of viewport if no focus point provided
    const focusX = focusPoint?.x ?? rect.width / 2;
    const focusY = focusPoint?.y ?? rect.height / 2;
    
    const newZoom = Math.max(0.3, Math.min(3, zoomLevel + deltaZoom));
    const zoomFactor = newZoom / zoomLevel;
    
    // Calculate the position of the focus point relative to the current pan offset
    const currentFocusX = (focusX - panOffset.x) / zoomLevel;
    const currentFocusY = (focusY - panOffset.y) / zoomLevel;
    
    // Calculate new pan offset to keep the focus point at the same screen position
    const newPanX = focusX - currentFocusX * newZoom;
    const newPanY = focusY - currentFocusY * newZoom;
    
    // Apply limits to prevent excessive panning
    const maxPanX = 0;
    const maxPanY = 0;
    const minPanX = Math.min(0, rect.width - (800 * newZoom));
    const minPanY = Math.min(0, rect.height - (600 * newZoom));
    
    setZoomLevel(newZoom);
    setPanOffset({
      x: Math.max(minPanX, Math.min(maxPanX, newPanX)),
      y: Math.max(minPanY, Math.min(maxPanY, newPanY))
    });
  };

  // Ultra-smooth touch handling with professional gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent browser's default touch behaviors for smoother control
    e.preventDefault();
    
    // Allow column resizing to work - don't block if we're near a resize handle
    if (isResizing) return;
    
    // Check if touch is near a resize handle by looking for resize handle elements
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle') || target.closest('.resize-handle')) {
      return; // Let the resize handle work
    }
    
    // Cancel any ongoing momentum animation
    if (momentumAnimationRef.current) {
      cancelAnimationFrame(momentumAnimationRef.current);
      momentumAnimationRef.current = null;
    }
    
    if (e.touches.length === 2) {
      // Professional pinch zoom with smooth scaling
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      // Calculate the center point between two fingers with high precision
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      // Convert to container-relative coordinates
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const focusX = centerX - rect.left;
        const focusY = centerY - rect.top;
        (e.currentTarget as any).focusPoint = { x: focusX, y: focusY };
      }
      
      (e.currentTarget as any).initialDistance = distance;
      (e.currentTarget as any).initialZoom = zoomLevel;
      
      // Stop any panning when starting pinch zoom
      setIsPanning(false);
    } else if (e.touches.length === 1) {
      // Ultra-smooth single touch pan with advanced velocity tracking
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
      
      // High-precision velocity tracking for natural momentum
      const currentTime = performance.now(); // More precise timing
      setLastTouchTime(currentTime);
      setLastTouchPosition({ x: touch.clientX, y: touch.clientY });
      setTouchVelocity({ x: 0, y: 0 });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Don't handle zoom/pan if we're resizing columns or editing
    if (isResizing || editingCell) return;
    
    if (e.touches.length === 2) {
      // Professional pinch zoom with ultra-smooth scaling
      e.preventDefault();
      e.stopPropagation();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const initialDistance = (e.currentTarget as any).initialDistance;
      const initialZoom = (e.currentTarget as any).initialZoom;
      const focusPoint = (e.currentTarget as any).focusPoint;
      
      if (initialDistance && initialZoom && focusPoint) {
        const scale = distance / initialDistance;
        // Smooth zoom scaling with damping for natural feel
        const dampingFactor = 0.8;
        const smoothScale = 1 + (scale - 1) * dampingFactor;
        const newZoom = Math.max(0.3, Math.min(3, initialZoom * smoothScale));
        const deltaZoom = newZoom - zoomLevel;
        
        if (Math.abs(deltaZoom) > 0.005) { // More sensitive threshold
          zoomAtPoint(deltaZoom, focusPoint);
        }
      }
    } else if (e.touches.length === 1 && isPanning) {
      // Ultra-smooth single touch pan with advanced velocity tracking
      e.preventDefault();
      
      const touch = e.touches[0];
      const currentTime = performance.now(); // High precision timing
      const deltaTime = currentTime - lastTouchTime;
      
      if (deltaTime > 0) {
        // Advanced velocity calculation with smoothing
        const deltaX = touch.clientX - lastTouchPosition.x;
        const deltaY = touch.clientY - lastTouchPosition.y;
        
        // Apply exponential smoothing for more natural feel
        const smoothingFactor = 0.7;
        const velocityX = (deltaX / deltaTime * 1000) * smoothingFactor + touchVelocity.x * (1 - smoothingFactor);
        const velocityY = (deltaY / deltaTime * 1000) * smoothingFactor + touchVelocity.y * (1 - smoothingFactor);
        
        setTouchVelocity({ x: velocityX, y: velocityY });
        setLastTouchTime(currentTime);
        setLastTouchPosition({ x: touch.clientX, y: touch.clientY });
      }
      
      const rect = containerRef.current?.getBoundingClientRect();
      
      if (rect) {
        const maxPanX = 0;
        const maxPanY = 0;
        const minPanX = Math.min(0, rect.width - (800 * zoomLevel));
        const minPanY = Math.min(0, rect.height - (600 * zoomLevel));
        
        // Smooth panning with micro-adjustments for precision
        const newOffsetX = Math.max(minPanX, Math.min(maxPanX, touch.clientX - panStart.x));
        const newOffsetY = Math.max(minPanY, Math.min(maxPanY, touch.clientY - panStart.y));
        
        setPanOffset({ x: newOffsetX, y: newOffsetY });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Don't interfere with column resizing
    if (isResizing) return;
    
    if (e.touches.length < 2) {
      (e.currentTarget as any).initialDistance = null;
      (e.currentTarget as any).initialZoom = null;
      (e.currentTarget as any).focusPoint = null;
    }
    
    if (e.touches.length === 0) {
      setIsPanning(false);
      
      // Professional momentum scrolling with intelligent threshold
      const velocityMagnitude = Math.sqrt(touchVelocity.x * touchVelocity.x + touchVelocity.y * touchVelocity.y);
      
      if (velocityMagnitude > 0.5) { // Lower threshold for more responsive momentum
        // Scale velocity for optimal momentum feel
        const scaledVelocity = {
          x: touchVelocity.x * 0.8, // Slight damping for natural feel
          y: touchVelocity.y * 0.8
        };
        applyMomentumScrolling(scaledVelocity);
      }
      
      // Reset velocity tracking
      setTouchVelocity({ x: 0, y: 0 });
    }
  };

  // دوال التعليق المحسنة - مثل Google Sheets
  const handleCommentClick = (order: Order) => {
    setEditingComment(order.id);
    setTempCommentValue(order.commentaire || '');
  };

  const handleCommentChange = (orderId: string, newComment: string) => {
    // تحديث محلي فقط أثناء الكتابة - بدون إرسال للخادم
    setTempCommentValue(newComment);
    // تحديث قاعدة البيانات فوراً بدون إشعار أثناء الكتابة
    onUpdateComment(orderId, newComment, false); // بدون إشعار
  };

  const handleCommentBlur = () => {
    // حفظ نهائي عند الانتهاء من التحرير
    if (editingComment) {
      onUpdateComment(editingComment, tempCommentValue, true); // مع إشعار
    }
    setEditingComment(null);
    setTempCommentValue('');
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent, orderId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // حفظ عند الضغط على Enter
      onUpdateComment(orderId, tempCommentValue, true); // مع إشعار
      setEditingComment(null);
      setTempCommentValue('');
    } else if (e.key === 'Escape') {
      setEditingComment(null);
      setTempCommentValue('');
    }
  };

  const addPriorityToComment = (orderId: string, priority: number, currentComment: string) => {
    const priorityText = `${priority}. `;
    const newComment = currentComment.startsWith(priorityText) 
      ? currentComment.substring(priorityText.length)
      : priorityText + currentComment.replace(/^\d+\.\s*/, '');
    
    // تحديث القيمة المؤقتة فوراً
    setTempCommentValue(newComment);
    // حفظ فوري للأولوية مع إشعار
    onUpdateComment(orderId, newComment, true); // مع إشعار
  };


  // Reverted getStatusBadge function to original static version
  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Confirmé': 'bg-green-500',
      'En cours': 'bg-yellow-500',
      'Livré': 'bg-emerald-500',
      'Reporté': 'bg-cyan-500',
      'Annulé': 'bg-red-500',
      'Refusé': 'bg-red-600',
      'Numéro erroné': 'bg-orange-500',
      'Hors zone': 'bg-gray-500',
      'Programmé': 'bg-blue-500',
      'Nouveau': 'bg-blue-500',
      'Pas de réponse': 'bg-yellow-500'
    };
    
    return (
      <div className={cn(
        'inline-flex items-center justify-center rounded-sm text-white font-medium w-16 h-4 text-center',
        statusColors[status as keyof typeof statusColors] || 'bg-gray-500'
      )}>
        <span className="truncate text-[9px]">{t(status) || status}</span>
      </div>
    );
  };

  const getAvailableStatusOptions = (currentStatus: string) => {
    return statusOptions.filter(status => status !== currentStatus);
  };

  // Enhanced wheel zoom with focus point preservation
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const focusX = e.clientX - rect.left;
        const focusY = e.clientY - rect.top;
        const deltaZoom = e.deltaY > 0 ? -0.1 : 0.1;
        
        zoomAtPoint(deltaZoom, { x: focusX, y: focusY });
      }
    }
  };

  // دالة معالجة تغيير الحالة مع إضافة التأكيد للحالة "Livré"
  const handleStatusChange = (orderId: string, newStatus: string) => {
    if (newStatus === 'Livré') {
      // العثور على الطلبية للحصول على الكود
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setConfirmDialog({
          isOpen: true,
          orderId: orderId,
          orderCode: order.code
        });
      }
    } else {
      // تغيير الحالة مباشرة للحالات الأخرى
      onUpdateStatus(orderId, newStatus);
    }
    
    // إغلاق القائمة وتعطيل السحب والإفلات
    setOpenDropdownId(null);
    setIsDragEnabled(false);
  };

  // دالة تأكيد التسليم
  const handleConfirmDelivery = () => {
    onUpdateStatus(confirmDialog.orderId, 'Livré');
    setConfirmDialog({
      isOpen: false,
      orderId: '',
      orderCode: ''
    });
  };

  // دالة إلغاء التأكيد
  const handleCancelConfirmation = () => {
    setConfirmDialog({
      isOpen: false,
      orderId: '',
      orderCode: ''
    });
  };

  // دالة معالجة النقر المزدوج على رقم الهاتف
  const handlePhoneDoubleClick = (e: React.MouseEvent, phoneNumber: string, orderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const container = element.closest('.orders-table-container');
    const containerRect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
    
    setPhoneActionsPopup({
      isOpen: true,
      phoneNumber,
      orderId,
      targetElement: element,
      position: {
        x: rect.left - containerRect.left + (rect.width / 2),
        y: rect.top - containerRect.top + container!.scrollTop
      }
    });
  };

  // دالة إغلاق قائمة أيقونات الهاتف
  const closePhoneActionsPopup = () => {
    setPhoneActionsPopup({
      isOpen: false,
      phoneNumber: '',
      orderId: '',
      targetElement: null,
      position: undefined
    });
  };

  // دالة الاتصال
  const handlePhoneCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
    closePhoneActionsPopup();
  };

  // دالة إرسال رسالة واتساب
  const handleWhatsAppMessage = (phoneNumber: string, orderCode: string) => {
    let cleanNumber = phoneNumber.replace(/[\s-+()]/g, '');
    
    // إضافة كود المغرب +212 إذا لم يكن موجوداً
    if (!cleanNumber.startsWith('212')) {
      // إزالة الصفر الأول إذا كان موجوداً
      if (cleanNumber.startsWith('0')) {
        cleanNumber = cleanNumber.substring(1);
      }
      cleanNumber = '212' + cleanNumber;
    }
    
    // Template message: "Bonjour, je vous (nom livreur) appelé à propos de votre commande N° (code) , Merci de me répondre."
    const message = `Bonjour, je vous appelé à propos de votre commande N° ${orderCode}, Merci de me répondre.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanNumber}?text=${encodedMessage}`, '_blank');
    closePhoneActionsPopup();
  };

  // دالة إرسال رسالة عادية
  const handleSMSMessage = (phoneNumber: string, orderCode: string) => {
    // Template message: "Bonjour, je vous (nom livreur) appelé à propos de votre commande N° (code) , Merci de me répondre."
    const message = `Bonjour, je vous appelé à propos de votre commande N° ${orderCode}, Merci de me répondre.`;
    window.open(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`, '_self');
    closePhoneActionsPopup();
  };

  // دالة تحرير رقم الهاتف
  const handleEditPhone = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    setEditingCell(`${orderId}-numero`);
    setTempPhoneValue(order?.numero || '');
    closePhoneActionsPopup();
  };

  // دالة تحديث رقم الهاتف (محلي أثناء التحرير)
  const handlePhoneChange = (id: string, phone: string) => {
    setTempPhoneValue(phone);
  };

  // دالة معالجة فوكس رقم الهاتف
  const handlePhoneFocus = (id: string) => {
    const order = orders.find(o => o.id === id);
    setEditingCell(`${id}-numero`);
    setTempPhoneValue(order?.numero || '');
  };

  // دالة معالجة blur رقم الهاتف (حفظ نهائي)
  const handlePhoneBlur = () => {
    if (editingCell && editingCell.includes('-numero')) {
      const orderId = editingCell.split('-')[0];
      onUpdatePhone(orderId, tempPhoneValue, true); // مع إشعار
    }
    setEditingCell(null);
    setTempPhoneValue('');
  };

  // دالة معالجة الضغط على Enter في رقم الهاتف
  const handlePhoneKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      onUpdatePhone(id, tempPhoneValue, true); // مع إشعار
      setEditingCell(null);
      setTempPhoneValue('');
    }
  };

  // دوال تحرير السعر
  const handlePriceDoubleClick = (e: React.MouseEvent, price: number, orderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCell(`${orderId}-prix`);
    setTempPriceValue(price.toString());
  };

  const handlePriceChange = (id: string, price: string) => {
    setTempPriceValue(price);
  };

  const handlePriceFocus = (id: string) => {
    const order = orders.find(o => o.id === id);
    setEditingCell(`${id}-prix`);
    setTempPriceValue(order?.prix.toString() || '0');
  };

  const handlePriceBlur = () => {
    if (editingCell && editingCell.includes('-prix')) {
      const orderId = editingCell.split('-')[0];
      const numPrice = parseFloat(tempPriceValue) || 0;
      onUpdatePrice(orderId, numPrice, true); // مع إشعار
    }
    setEditingCell(null);
    setTempPriceValue('');
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      const numPrice = parseFloat(tempPriceValue) || 0;
      onUpdatePrice(id, numPrice, true); // مع إشعار
      setEditingCell(null);
      setTempPriceValue('');
    }
  };

  return (
    <div className="w-full bg-white">
      {/* Professional Table Container with Ultra-Smooth Touch Support */}
      <div 
        ref={containerRef}
        className={cn(
          "w-full h-[calc(100vh-200px)] border border-gray-300 bg-white relative orders-table-container",
          "ultra-smooth-table hardware-accelerated momentum-scroll",
          showScrollbar ? "overflow-x-auto" : "overflow-x-hidden",
          "overflow-y-auto touch-manipulation"
        )}
        data-scrollbar="show"
        style={{ 
          cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
          scrollbarWidth: 'auto',
          scrollbarColor: 'hsl(210 100% 14%) rgba(0, 0, 0, 0.05)',
          userSelect: isResizing ? 'none' : 'auto',
          WebkitUserSelect: isResizing ? 'none' : 'auto',
          WebkitTouchCallout: 'none',
          touchAction: editingCell ? 'auto' : isDragEnabled ? 'none' : 'pan-x pan-y pinch-zoom',
          overscrollBehavior: 'auto', // Allow native smooth overscroll like Google Sheets
          scrollBehavior: 'smooth' // Enhanced smoothness
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={editingCell ? undefined : handleWheel}
      >
        {/* Ultra-Smooth Transform Container with Professional Transitions */}
        <div 
          className="absolute top-0 left-0 w-full h-full hardware-accelerated"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'top left',
            transition: isPanning || isResizing || momentumAnimationRef.current ? 'none' : 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            minWidth: '800px',
            minHeight: '100%',
            pointerEvents: editingCell ? 'none' : 'auto',
            willChange: isPanning || isResizing ? 'transform' : 'auto',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <div className="w-full shadow-lg rounded-sm overflow-hidden bg-white">
            {/* Header Row with Significantly Enhanced Resizable Handles for Touch */}
            <div className="flex">
              {/* Code Column Header */}
              {tableSettings.columnVisibility.code && (
                <div className="relative" style={{ width: `${columnWidths.code}%`, minWidth: '80px' }}>
                    <div className="h-7 px-1 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                     <span className="text-xs font-bold text-gray-800">{t('code')}</span>
                   </div>
                {/* Professional Resize Handle */}
                <div 
                  className={cn(
                    "absolute top-0 right-0 w-2 h-7 cursor-col-resize touch-manipulation flex items-center justify-center",
                    "hover:bg-blue-300 bg-gray-400 opacity-40 hover:opacity-70 transition-all duration-200",
                    "border-l border-gray-300",
                    isResizing && resizingColumn === 'code' && "bg-blue-400 opacity-80"
                  )}
                  onMouseDown={(e) => handleResizeStart(e, 'code')}
                  onTouchStart={(e) => handleResizeStart(e, 'code')}
                  style={{ 
                    touchAction: 'none',
                    minHeight: '28px',
                    minWidth: '8px',
                    zIndex: isResizing ? 50 : 10
                  }}
                >
                  <div className="w-0.5 h-3 bg-white rounded-full opacity-60" />
                </div>
              </div>
              )}

              {/* CL/Vendeur Column Header */}
              {tableSettings.columnVisibility.destination && (
                <div className="relative" style={{ width: `${columnWidths.vendeur}%`, minWidth: '60px' }}>
                   <div className="h-7 px-1 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">{t('client')}</span>
                  </div>
                {/* Professional Resize Handle */}
                <div 
                  className={cn(
                    "absolute top-0 right-0 w-2 h-7 cursor-col-resize touch-manipulation flex items-center justify-center",
                    "hover:bg-blue-300 bg-gray-400 opacity-40 hover:opacity-70 transition-all duration-200",
                    "border-l border-gray-300",
                    isResizing && resizingColumn === 'vendeur' && "bg-blue-400 opacity-80"
                  )}
                  onMouseDown={(e) => handleResizeStart(e, 'vendeur')}
                  onTouchStart={(e) => handleResizeStart(e, 'vendeur')}
                  style={{ 
                    touchAction: 'none',
                    minHeight: '28px',
                    minWidth: '8px',
                    zIndex: isResizing ? 50 : 10
                  }}
                >
                  <div className="w-0.5 h-3 bg-white rounded-full opacity-60" />
                </div>
              </div>
              )}

              {/* Number Column Header */}
              {tableSettings.columnVisibility.phone && (
                <div className="relative" style={{ width: `${columnWidths.numero}%`, minWidth: '100px' }}>
                   <div className="h-7 px-1 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">{t('phone')}</span>
                  </div>
                {/* Professional Resize Handle */}
                <div 
                  className={cn(
                    "absolute top-0 right-0 w-2 h-7 cursor-col-resize touch-manipulation flex items-center justify-center",
                    "hover:bg-blue-300 bg-gray-400 opacity-40 hover:opacity-70 transition-all duration-200",
                    "border-l border-gray-300",
                    isResizing && resizingColumn === 'numero' && "bg-blue-400 opacity-80"
                  )}
                  onMouseDown={(e) => handleResizeStart(e, 'numero')}
                  onTouchStart={(e) => handleResizeStart(e, 'numero')}
                  style={{ 
                    touchAction: 'none',
                    minHeight: '28px',
                    minWidth: '8px',
                    zIndex: isResizing ? 50 : 10
                  }}
                >
                  <div className="w-0.5 h-3 bg-white rounded-full opacity-60" />
                </div>
              </div>
              )}

              {/* Price Column Header */}
              {tableSettings.columnVisibility.price && (
                <div className="relative" style={{ width: `${columnWidths.prix}%`, minWidth: '70px' }}>
                   <div className="h-7 px-1 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">{t('price')}</span>
                  </div>
                {/* Professional Resize Handle */}
                <div 
                  className={cn(
                    "absolute top-0 right-0 w-2 h-7 cursor-col-resize touch-manipulation flex items-center justify-center",
                    "hover:bg-blue-300 bg-gray-400 opacity-40 hover:opacity-70 transition-all duration-200",
                    "border-l border-gray-300",
                    isResizing && resizingColumn === 'prix' && "bg-blue-400 opacity-80"
                  )}
                  onMouseDown={(e) => handleResizeStart(e, 'prix')}
                  onTouchStart={(e) => handleResizeStart(e, 'prix')}
                  style={{ 
                    touchAction: 'none',
                    minHeight: '28px',
                    minWidth: '8px',
                    zIndex: isResizing ? 50 : 10
                  }}
                >
                  <div className="w-0.5 h-3 bg-white rounded-full opacity-60" />
                </div>
              </div>
              )}

              {/* Status Column Header */}
              {tableSettings.columnVisibility.status && (
                <div className="relative" style={{ width: `${columnWidths.status}%`, minWidth: '90px' }}>
                   <div className="h-7 px-1 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">{t('status')}</span>
                  </div>
                {/* Professional Resize Handle */}
                <div 
                  className={cn(
                    "absolute top-0 right-0 w-2 h-7 cursor-col-resize touch-manipulation flex items-center justify-center",
                    "hover:bg-blue-300 bg-gray-400 opacity-40 hover:opacity-70 transition-all duration-200",
                    "border-l border-gray-300",
                    isResizing && resizingColumn === 'status' && "bg-blue-400 opacity-80"
                  )}
                  onMouseDown={(e) => handleResizeStart(e, 'status')}
                  onTouchStart={(e) => handleResizeStart(e, 'status')}
                  style={{ 
                    touchAction: 'none',
                    minHeight: '28px',
                    minWidth: '8px',
                    zIndex: isResizing ? 50 : 10
                  }}
                >
                  <div className="w-0.5 h-3 bg-white rounded-full opacity-60" />
                </div>
              </div>
              )}

              {/* Comment Column Header */}
              {tableSettings.columnVisibility.comment && (
                <div className="flex-1" style={{ minWidth: '150px' }}>
                  <div className="h-7 px-1 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">{t('comment')}</span>
                  </div>
                </div>
              )}

              {/* Commission Column Header */}
              {tableSettings.columnVisibility.commission && (
                <div style={{ width: '50px', minWidth: '50px' }}>
                  <div className="h-7 px-1 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">{t('commission_short')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Data Rows */}
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={orders.map(order => order.id)} strategy={verticalListSortingStrategy}>
                <div 
                  className="flex-1"
                  style={{
                    fontSize: `${tableSettings.fontSize}px`,
                    fontWeight: tableSettings.fontWeight === 'bold' ? 'bold' : tableSettings.fontWeight === 'light' ? '300' : 'normal'
                  }}
                >
                  {orders.map((order, index) => {
                const isRecentlyScanned = recentlyScannedOrders.has(order.id);
                const isPermanentlyScanned = permanentlyScannedOrders.has(order.id);
                const isRejected = isRejectedStatus(order.statut);
                console.log(`Order ${order.code}: isScanned=${order.isScanned}, isRecentlyScanned=${isRecentlyScanned}, isPermanentlyScanned=${isPermanentlyScanned}, isRejected=${isRejected}`);
                
                // Enhanced row background logic with permanent state and temporary animation
                const getRowBackgroundClass = () => {
                  if (isRecentlyScanned) {
                    // Show red for rejected statuses, green for others during the 3-second highlight
                    return isRejected 
                      ? "bg-red-200 border-red-300 animate-pulse" 
                      : "bg-green-200 border-green-300 animate-pulse";
                  } else if (isPermanentlyScanned) {
                    // Permanent light blue background for previously scanned orders
                    return "bg-blue-50 border-blue-200";
                  } else {
                    return index % 2 === 0 ? "bg-white" : "bg-gray-50";
                  }
                };

                const rowBackgroundClass = getRowBackgroundClass();

                return (
                  <SortableOrderRow 
                    key={order.id} 
                    order={order} 
                    index={index}
                    isDragEnabled={isDragEnabled && openDropdownId === order.id} // Enable drag only when this order's dropdown is open
                    className={cn(
                      "border-b border-gray-300 transition-all duration-300",
                      rowBackgroundClass,
                      isDragEnabled && openDropdownId === order.id && "ring-2 ring-blue-400 bg-blue-50 shadow-md" // Enhanced visual indicator when drag is enabled
                    )}
                  >
                    <div className="flex relative">
                      {/* أيقونة السحب - تظهر فقط عندما يكون السحب مُفعّلاً */}
                      {isDragEnabled && openDropdownId === order.id && (
                        <div className="absolute -left-6 top-0 h-full flex items-center z-10">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <GripVertical className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    {/* Code Column Data */}
                    {tableSettings.columnVisibility.code && (
                      <div style={{ width: `${columnWidths.code}%`, minWidth: '80px' }}>
                         <div 
                           className={cn(
                              "h-7 px-1 py-1 border-b border-gray-300 flex items-center justify-between hover:bg-blue-50 transition-all duration-300 group",
                             rowBackgroundClass,
                             // تلوين خانة الكود بالأخضر عند مسح الطلبية
                             (order.isScanned || isPermanentlyScanned) && "bg-green-100 border-green-300"
                           )}
                           onTouchStart={(e) => handleLongPressStart(e, order.code)}
                           onTouchEnd={handleLongPressEnd}
                           onMouseDown={(e) => handleLongPressStart(e, order.code)}
                           onMouseUp={handleLongPressEnd}
                           onMouseLeave={handleLongPressEnd}
                         >
                           <span 
                             className={cn(
                               "truncate flex-1",
                               `text-${tableSettings.textAlignment.code}`,
                               // تلوين النص بالأخضر الداكن عند مسح الطلبية
                               (order.isScanned || isPermanentlyScanned) ? "text-green-800 font-medium" : "text-gray-800"
                             )}
                           >
                             {order.code}
                           </span>
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               copyToClipboard(order.code, 'الكود');
                             }}
                             className="opacity-0 group-hover:opacity-100 ml-1 p-1 hover:bg-blue-200 rounded transition-all duration-200"
                             title="نسخ الكود"
                           >
                             <Copy className="w-3 h-3 text-gray-600" />
                           </button>
                         </div>
                      </div>
                    )}

                    {/* Vendeur Column Data */}
                    {tableSettings.columnVisibility.destination && (
                      <div style={{ width: `${columnWidths.vendeur}%`, minWidth: '60px' }}>
                         <div 
                           className={cn(
                             "h-7 px-1 py-1 border-b border-gray-300 flex items-center justify-between hover:bg-blue-50 transition-all duration-300 group",
                             rowBackgroundClass
                           )}
                         >
                           <span className="truncate flex-1 text-gray-800">
                             {order.vendeur}
                           </span>
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               copyToClipboard(order.vendeur, 'اسم العميل');
                             }}
                             className="opacity-0 group-hover:opacity-100 ml-1 p-1 hover:bg-blue-200 rounded transition-all duration-200"
                             title="نسخ اسم العميل"
                           >
                             <Copy className="w-3 h-3 text-gray-600" />
                           </button>
                         </div>
                      </div>
                    )}

                    {/* Number Column Data */}
                    {tableSettings.columnVisibility.phone && (
                      <div style={{ width: `${columnWidths.numero}%`, minWidth: '100px' }}>
                         <div 
                             className={cn(
                               "h-7 px-1 py-1 border-b border-gray-300 flex items-center justify-between hover:bg-blue-50 transition-all duration-300 cursor-pointer relative group",
                               rowBackgroundClass,
                               editingCell === `${order.id}-numero` && "bg-white border-blue-500 shadow-sm"
                             )}
                             onDoubleClick={(e) => handlePhoneDoubleClick(e, order.numero, order.id)}
                         >
                         {editingCell === `${order.id}-numero` ? (
                           <div 
                             className="fixed inset-0 z-[100] bg-black/20 flex items-center justify-center"
                             onClick={handlePhoneBlur}
                           >
                             <div 
                               className="bg-white rounded-lg p-4 mx-4 w-full max-w-sm shadow-xl"
                               onClick={(e) => e.stopPropagation()}
                             >
                               <div className="text-center mb-3">
                                 <h3 className="text-lg font-semibold">تعديل رقم الهاتف</h3>
                               </div>
                               <input
                                 value={tempPhoneValue}
                                 onChange={(e) => handlePhoneChange(order.id, e.target.value)}
                                 onBlur={handlePhoneBlur}
                                 onKeyDown={(e) => handlePhoneKeyDown(e, order.id)}
                                 className="w-full h-12 px-3 text-base border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                                 placeholder="أدخل رقم الهاتف..."
                                 autoFocus
                                 type="tel"
                                 inputMode="tel"
                               />
                               <div className="flex gap-2 mt-4">
                                 <button
                                   onClick={handlePhoneBlur}
                                   className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                                 >
                                   حفظ
                                 </button>
                                 <button
                                   onClick={handlePhoneBlur}
                                   className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md text-sm font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                 >
                                   إلغاء
                                 </button>
                               </div>
                             </div>
                           </div>
                         ) : (
                           <>
                             <span 
                               className={cn(
                                 "truncate flex-1 font-mono text-gray-800 select-text",
                                 `text-${tableSettings.textAlignment.phone}`
                               )}
                             >
                               {order.numero}
                             </span>
                           </>
                         )}
                      </div>
                    </div>
                    )}

                    {/* Price Column Data */}
                    {tableSettings.columnVisibility.price && (
                      <div style={{ width: `${columnWidths.prix}%`, minWidth: '70px' }}>
                         <div 
                           className={cn(
                             "h-7 px-1 py-1 border-b border-gray-300 flex items-center justify-center hover:bg-blue-50 transition-all duration-300 cursor-pointer relative",
                             rowBackgroundClass,
                             editingCell === `${order.id}-prix` && "bg-white border-blue-500 shadow-sm"
                           )}
                           onDoubleClick={(e) => handlePriceDoubleClick(e, order.prix, order.id)}
                        >
                        {editingCell === `${order.id}-prix` ? (
                          <div 
                            className="fixed inset-0 z-[100] bg-black/20 flex items-center justify-center"
                            onClick={handlePriceBlur}
                          >
                            <div 
                              className="bg-white rounded-lg p-4 mx-4 w-full max-w-sm shadow-xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="text-center mb-3">
                                <h3 className="text-lg font-semibold">{t('price')}</h3>
                              </div>
                              <input
                                value={tempPriceValue}
                                onChange={(e) => handlePriceChange(order.id, e.target.value)}
                                onBlur={handlePriceBlur}
                                onKeyDown={(e) => handlePriceKeyDown(e, order.id)}
                                className="w-full h-12 px-3 text-base border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center"
                                placeholder="أدخل السعر..."
                                autoFocus
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                              />
                              <div className="flex gap-2 mt-4">
                                <button
                                  onClick={handlePriceBlur}
                                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                  حفظ
                                </button>
                                <button
                                  onClick={handlePriceBlur}
                                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md text-sm font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span 
                            className={cn(
                              "font-medium text-green-700",
                              `text-${tableSettings.textAlignment.price}`
                            )}
                          >
                            {formatPrice(order.prix)}
                          </span>
                        )}
                      </div>
                    </div>
                    )}

                    {/* Status Column Data - Updated to use confirmation dialog */}
                    {tableSettings.columnVisibility.status && (
                      <div style={{ width: `${columnWidths.status}%`, minWidth: '90px' }}>
                        <div 
                          className={cn(
                            "h-7 px-1 py-1 border-b border-gray-300 flex items-center justify-center hover:bg-blue-50 transition-all duration-300",
                          rowBackgroundClass
                        )}
                      >
                         <DropdownMenu 
                           open={openDropdownId === order.id} 
                           onOpenChange={(open) => {
                             if (open) {
                               setOpenDropdownId(order.id);
                               setIsDragEnabled(true); // تفعيل السحب والإفلات عند فتح القائمة
                             } else {
                               setOpenDropdownId(null);
                               setIsDragEnabled(false); // تعطيل السحب والإفلات عند إغلاق القائمة
                             }
                           }}
                         >
                           <DropdownMenuTrigger className="flex items-center justify-center w-full h-full focus:outline-none">
                             <div className="flex items-center gap-1">
                               {getStatusBadge(order.statut)}
                               <ChevronDown className="h-2 w-2 text-gray-500 flex-shrink-0" />
                             </div>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent className="bg-white shadow-lg border border-gray-300 rounded-md z-50 min-w-[120px]">
                             {getAvailableStatusOptions(order.statut).map((status) => (
                               <DropdownMenuItem
                                 key={status}
                                 onClick={() => {
                                   handleStatusChange(order.id, status);
                                   setOpenDropdownId(null);
                                 }}
                                 className="cursor-pointer hover:bg-gray-100 px-2 py-1 focus:bg-gray-100"
                               >
                                 {getStatusBadge(status)} 
                               </DropdownMenuItem>
                             ))}
                           </DropdownMenuContent>
                         </DropdownMenu>
                      </div>
                    </div>
                    )}

                     {/* Comment Column Data - Google Sheets Style - Mobile Optimized */}
                     {tableSettings.columnVisibility.comment && (
                       <div className="flex-1" style={{ minWidth: '150px' }}>
                        {editingComment === order.id ? (
                          <div className="relative">
                            {/* أزرار الأولوية محسنة للهاتف */}
                            <div className="absolute -top-20 left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
                              <div className="flex gap-3 justify-center">
                                {[
                                  { num: 1, color: "bg-red-500", label: "عاجل", icon: "🔥" },
                                  { num: 2, color: "bg-orange-500", label: "مهم", icon: "🚨" },
                                  { num: 3, color: "bg-yellow-500", label: "عادي", icon: "⭐" },
                                  { num: 4, color: "bg-blue-500", label: "متأخر", icon: "📅" },
                                  { num: 5, color: "bg-gray-500", label: "أخير", icon: "📦" }
                                ].map((priority) => {
                                  const isSelected = (tempCommentValue || '').startsWith(`${priority.num}. `);
                                  return (
                                    <button
                                      key={priority.num}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addPriorityToComment(order.id, priority.num, tempCommentValue || '');
                                      }}
                                      onTouchStart={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      onTouchEnd={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addPriorityToComment(order.id, priority.num, tempCommentValue || '');
                                      }}
                                      className={cn(
                                        "w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white text-xs font-bold transition-all duration-200 shadow-md touch-manipulation border-2 border-white/20",
                                        priority.color,
                                        isSelected 
                                          ? "scale-110 ring-2 ring-white/80 shadow-lg animate-pulse" 
                                          : "hover:scale-105 active:scale-95 hover:shadow-lg"
                                      )}
                                      type="button"
                                      title={priority.label}
                                      style={{ touchAction: 'manipulation' }}
                                    >
                                      <span className="text-sm leading-none mb-0.5">{priority.icon}</span>
                                      <span className="text-xs font-bold leading-none">{priority.num}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* حقل الإدخال المحسن للهاتف */}
                            <div className="relative">
                              <textarea
                                value={tempCommentValue}
                                onChange={(e) => handleCommentChange(order.id, e.target.value)}
                                onBlur={handleCommentBlur}
                                onKeyDown={(e) => handleCommentKeyDown(e, order.id)}
                                className={cn(
                                  "w-full px-2 py-1 border-2 border-blue-500 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300",
                                  "min-h-[28px] max-h-[80px] overflow-y-auto",
                                  "text-right" // نص عربي
                                )}
                                placeholder={t('write_comment')}
                                autoFocus
                                style={{ 
                                  fontSize: '16px', // منع التكبير على iOS
                                  lineHeight: '1.3'
                                }}
                                rows={1}
                                onFocus={(e) => {
                                  // وضع المؤشر في نهاية النص وإلغاء أي تحديد
                                  const target = e.target as HTMLTextAreaElement;
                                  // استخدام setTimeout للتأكد من تنفيذ الكود بعد تحديث الـ DOM
                                  setTimeout(() => {
                                    const length = target.value.length;
                                    target.setSelectionRange(length, length);
                                  }, 0);
                                }}
                                onInput={(e) => {
                                  // تكيف الارتفاع مع المحتوى
                                  const target = e.target as HTMLTextAreaElement;
                                  target.style.height = 'auto';
                                  target.style.height = Math.min(target.scrollHeight, 80) + 'px';
                                }}
                              />
                              
                              {/* مؤشر حالة الحفظ */}
                              <div className="absolute -bottom-5 left-0 text-xs text-green-600 flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                يحفظ تلقائياً...
                              </div>
                            </div>
                          </div>
                        ) : (
                           <div 
                             className={cn(
                               "h-7 px-1 py-1 border-b border-gray-300 flex items-center cursor-pointer transition-all duration-300 relative",
                               `text-${tableSettings.textAlignment.comment}`,
                               rowBackgroundClass,
                               "hover:bg-blue-50 active:bg-blue-100 touch-manipulation" // تحسينات اللمس
                             )}
                             onDoubleClick={() => handleCommentClick(order)}
                             onTouchStart={(e) => {
                               // للدبل تاب على الهاتف
                               const now = Date.now();
                               const target = e.currentTarget;
                               const lastTap = target.dataset.lastTap ? parseInt(target.dataset.lastTap) : 0;
                               
                               if (now - lastTap < 300) {
                                 e.preventDefault();
                                 handleCommentClick(order);
                               } else {
                                 target.dataset.lastTap = now.toString();
                                 // إضافة الضغط المطول للنسخ
                                 handleLongPressStart(e, order.commentaire || '');
                               }
                             }}
                             onTouchEnd={handleLongPressEnd}
                             onMouseDown={(e) => handleLongPressStart(e, order.commentaire || '')}
                             onMouseUp={handleLongPressEnd}
                             onMouseLeave={handleLongPressEnd}
                           >
                             {(() => {
                               const displayComment = order.commentaire || '';
                               const priorityMatch = displayComment.match(/^(\d+)\.\s*/);
                               const priority = priorityMatch ? parseInt(priorityMatch[1]) : null;
                               const textWithoutPriority = displayComment.replace(/^\d+\.\s*/, '');
                               
                               return (
                                 <div className="flex items-center gap-2 w-full">
                                   {priority && priority >= 1 && priority <= 5 && (
                                     <div className={cn(
                                       "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-md border-2",
                                       priority === 1 && "bg-red-500 text-white border-red-600 animate-pulse",
                                       priority === 2 && "bg-orange-500 text-white border-orange-600",
                                       priority === 3 && "bg-yellow-500 text-white border-yellow-600", 
                                       priority === 4 && "bg-blue-500 text-white border-blue-600",
                                       priority === 5 && "bg-gray-500 text-white border-gray-600"
                                     )}>
                                       {priority}
                                     </div>
                                   )}
                                   <span className={cn(
                                     "truncate flex-1 text-sm",
                                     priority ? "text-gray-900 font-medium" : "text-gray-600",
                                     priority === 1 && "text-red-700 font-semibold"
                                   )}>
                                     {textWithoutPriority || `📝 ${t('click_to_comment')}`}
                                   </span>
                                  {priority === 1 && (
                                    <div className="flex-shrink-0 text-red-500 animate-bounce">
                                      <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                               );
                             })()}
                           </div>
                         )}
                       </div>
                       )}

                      {/* Commission Column Data */}
                      {tableSettings.columnVisibility.commission && (
                        <div style={{ width: '50px', minWidth: '50px' }}>
                           <div 
                             className="h-full flex items-center justify-center px-1 py-1 text-sm cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                             onDoubleClick={(e) => {
                               e.preventDefault();
                               e.stopPropagation();
                               setEditingCell(`${order.id}-commission`);
                             }}
                             onTouchStart={(e) => handleLongPressStart(e, (order.commission || defaultCommission).toString())}
                             onTouchEnd={handleLongPressEnd}
                             onMouseDown={(e) => handleLongPressStart(e, (order.commission || defaultCommission).toString())}
                             onMouseUp={handleLongPressEnd}
                             onMouseLeave={handleLongPressEnd}
                          >
                            {editingCell === `${order.id}-commission` ? (
                              <input
                                type="number"
                                value={(order.commission && order.commission > 0) ? order.commission : defaultCommission || 0}
                                onChange={(e) => onUpdateCommission(order.id, parseFloat(e.target.value) || 0)}
                                onBlur={() => setEditingCell(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setEditingCell(null);
                                  }
                                }}
                                className="w-full text-center text-xs border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
                                autoFocus
                                style={{ fontSize: '12px' }}
                              />
                            ) : (
                              <span className="text-xs text-center">{(order.commission && order.commission > 0) ? order.commission : defaultCommission || 0}</span>
                            )}
                          </div>
                        </div>
                      )}
                     </div>
                   </SortableOrderRow>
                );
              })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Editing Overlay - Prevents zoom/pan when editing */}
        {editingCell && (
          <div 
            className="absolute inset-0 bg-transparent z-30 pointer-events-auto"
            onClick={() => {
              setEditingCell(null);
            }}
          />
        )}

        {/* Resizing Overlay - Shows feedback during column resizing */}
        {isResizing && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-10 z-40 pointer-events-none flex items-center justify-center">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
              تغيير حجم العمود: {resizingColumn}
            </div>
          </div>
        )}

        {/* Phone Actions Popup */}
        {phoneActionsPopup.isOpen && (
          <>
            {/* Backdrop للإغلاق عند النقر خارج القائمة */}
            <div 
              className="absolute inset-0 z-[60] bg-transparent"
              onClick={closePhoneActionsPopup}
            />
            
            {/* قائمة الأيقونات - محسنة للهاتف */}
            <div 
              className="absolute z-[999] bg-white rounded-lg shadow-xl border border-gray-200 p-1"
              style={{
                left: phoneActionsPopup.position?.x || 0,
                top: (phoneActionsPopup.position?.y || 0) - 60,
                transform: 'translateX(-50%)',
                minWidth: '140px',
                position: 'absolute'
              }}
            >
              {/* الأيقونات */}
              <div className="flex gap-1 justify-center">
                {/* أيقونة الاتصال */}
                <button
                  onClick={() => handlePhoneCall(phoneActionsPopup.phoneNumber)}
                  className="p-1 hover:bg-green-50 rounded-md transition-all duration-200 group"
                  title="اتصال"
                >
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
                    <Phone className="w-2.5 h-2.5 text-white" />
                  </div>
                </button>

                {/* أيقونة واتساب */}
                <button
                  onClick={() => {
                    const order = orders.find(o => o.id === phoneActionsPopup.orderId);
                    const orderCode = order?.code || '';
                    handleWhatsAppMessage(phoneActionsPopup.phoneNumber, orderCode);
                  }}
                  className="p-1 hover:bg-green-50 rounded-md transition-all duration-200 group"
                  title="واتساب"
                >
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
                    <MessageCircle className="w-2.5 h-2.5 text-white" />
                  </div>
                </button>

                {/* أيقونة رسالة نصية */}
                <button
                  onClick={() => {
                    const order = orders.find(o => o.id === phoneActionsPopup.orderId);
                    const orderCode = order?.code || '';
                    handleSMSMessage(phoneActionsPopup.phoneNumber, orderCode);
                  }}
                  className="p-1 hover:bg-blue-50 rounded-md transition-all duration-200 group"
                  title="رسالة"
                >
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Send className="w-2.5 h-2.5 text-white" />
                  </div>
                </button>

                {/* أيقونة تحرير */}
                <button
                  onClick={() => handleEditPhone(phoneActionsPopup.orderId)}
                  className="p-1 hover:bg-orange-50 rounded-md transition-all duration-200 group"
                  title="تحرير"
                >
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                    <Edit2 className="w-2.5 h-2.5 text-white" />
                  </div>
                </button>
              </div>

              {/* سهم يشير للأسفل */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-4 h-4 bg-white border-b border-r border-gray-200 rotate-45"></div>
              </div>
            </div>
          </>
        )}

      </div>

      {/* نافذة تأكيد التسليم */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && handleCancelConfirmation()}>
        <AlertDialogContent className="max-w-xs mx-4 rounded-2xl border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm animate-scale-in">
          <AlertDialogHeader className="text-center px-4 pt-6 pb-2">
            {/* أيقونة التسليم المحسنة */}
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
              <svg className="w-7 h-7 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            
            <AlertDialogTitle className="text-lg font-bold text-gray-800 mb-2" dir={isRTL ? 'rtl' : 'ltr'}>
              {t('confirm_delivery')}
            </AlertDialogTitle>
            
            <AlertDialogDescription className="text-sm text-gray-600" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="space-y-3">
                <p className="font-medium text-sm">
                  {t('confirm_delivery_question')}
                </p>
                
                {/* عرض رقم الطلب بتصميم محسن */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl shadow-md">
                  <div className="text-xs font-medium opacity-90 mb-1">رقم الطلب</div>
                  <div className="text-xl font-bold tracking-wider">
                    {confirmDialog.orderCode}
                  </div>
                </div>
                
                {/* تحذير الأرشفة بتصميم محسن */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-3 border-amber-400 p-3 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-amber-800 text-xs font-medium">
                      {t('archive_warning')}
                    </p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="flex flex-col gap-2 px-4 pb-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <AlertDialogCancel 
              onClick={handleCancelConfirmation}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-lg font-medium py-3 px-4 text-sm transition-all duration-200"
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelivery} 
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 rounded-lg font-bold py-3 px-4 text-sm shadow-md transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>{t('confirm_delivery_action')}</span>
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Copy Indicator */}
      {copyIndicator.isVisible && (
        <div 
          className="fixed z-[200] pointer-events-none"
          style={{
            left: copyIndicator.position.x - 25,
            top: copyIndicator.position.y,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-black/80 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <Copy className="w-4 h-4" />
            <span className="text-sm font-medium">اضغط للنسخ</span>
          </div>
          <button
            onClick={handleCopyClick}
            className="absolute inset-0 pointer-events-auto"
            aria-label="نسخ المحتوى"
          />
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-t border-gray-300">
          <p className="text-sm">لا توجد طلبات للعرض</p>
          <p className="text-xs mt-1">استخدم زر "طلب جديد" لإضافة أول طلب لك</p>
        </div>
      )}

      {/* Custom scrollbar styles - Enhanced for mobile */}
      <style>{`
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"] {
          scrollbar-width: ${showScrollbar ? 'thin' : 'none'};
        }
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"]::-webkit-scrollbar {
          height: ${showScrollbar ? '8px' : '0px'};
          width: 8px;
        }
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"]::-webkit-scrollbar-track {
          background: ${showScrollbar ? 'rgba(0, 0, 0, 0.05)' : 'transparent'};
          border-radius: 10px;
        }
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"]::-webkit-scrollbar-thumb {
          background: ${showScrollbar ? 'linear-gradient(45deg, hsl(210 100% 14%), hsl(210 100% 24%))' : 'transparent'};
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"]::-webkit-scrollbar-thumb:hover {
          background: ${showScrollbar ? 'linear-gradient(45deg, hsl(210 100% 24%), hsl(210 100% 34%))' : 'transparent'};
          background-clip: content-box;
        }
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"]::-webkit-scrollbar-thumb:active {
          background: ${showScrollbar ? 'linear-gradient(45deg, hsl(210 100% 34%), hsl(210 100% 44%))' : 'transparent'};
          background-clip: content-box;
        }
        
        /* Force scrollbar visibility on mobile */
        @media (max-width: 768px) {
          div[data-scrollbar="show"]::-webkit-scrollbar {
            height: 10px !important;
            width: 10px !important;
          }
          div[data-scrollbar="show"]::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, hsl(210 100% 14%), hsl(210 100% 24%)) !important;
            border-radius: 12px !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            background-clip: padding-box !important;
          }
          div[data-scrollbar="show"]::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.08) !important;
            border-radius: 12px !important;
            margin: 2px !important;
          }
        }
      `}</style>

    </div>
  );
};

export default OrdersTable;
