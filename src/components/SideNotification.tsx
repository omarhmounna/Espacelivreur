import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle, Settings, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SideNotificationProps {
  isVisible: boolean;
  type: 'success' | 'error' | 'info' | 'warning' | 'update' | 'delivered';
  title: string;
  description: string;
  onClose: () => void;
  duration?: number;
  statusName?: string;
}

const SideNotification: React.FC<SideNotificationProps> = ({
  isVisible,
  type,
  title,
  description,
  onClose,
  duration = 3000,
  statusName
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible && !isAnimating) return null;

  const getStatusIcon = () => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return AlertCircle;
      case 'info': return Info;
      case 'warning': return AlertTriangle;
      case 'update': return Settings;
      case 'delivered': return Package;
      default: return Info;
    }
  };

  const StatusIcon = getStatusIcon();

  const getBellColors = () => {
    // If statusName is provided, use it to determine color
    if (statusName) {
      const status = statusName.toLowerCase();
      
      if (status === 'livré') {
        return {
          bg: "bg-green-500 hover:bg-green-600",
          indicator: "bg-green-600"
        };
      }
      
      if (status === 'nouveau') {
        return {
          bg: "bg-blue-500 hover:bg-blue-600",
          indicator: "bg-blue-600"
        };
      }
      
      if (status === 'annulé' || status === 'refusé') {
        return {
          bg: "bg-red-500 hover:bg-red-600",
          indicator: "bg-red-600"
        };
      }
      
      if (status === 'pas de réponse') {
        return {
          bg: "bg-yellow-500 hover:bg-yellow-600",
          indicator: "bg-yellow-600"
        };
      }
      
      if (status === 'reporté' || status === 'reporter') {
        return {
          bg: "bg-cyan-500 hover:bg-cyan-600",
          indicator: "bg-cyan-600"
        };
      }
      
      if (status === 'mes numéros erroné' || status === 'hors zone') {
        return {
          bg: "bg-orange-500 hover:bg-orange-600",
          indicator: "bg-orange-600"
        };
      }
    }

    // Fallback to type-based colors
    switch (type) {
      case 'success': 
        return {
          bg: "bg-emerald-500 hover:bg-emerald-600",
          indicator: "bg-emerald-600"
        };
      case 'error': 
        return {
          bg: "bg-red-500 hover:bg-red-600",
          indicator: "bg-red-600"
        };
      case 'info': 
        return {
          bg: "bg-blue-500 hover:bg-blue-600",
          indicator: "bg-blue-600"
        };
      case 'warning': 
        return {
          bg: "bg-yellow-500 hover:bg-yellow-600",
          indicator: "bg-yellow-600"
        };
      case 'update': 
        return {
          bg: "bg-yellow-500 hover:bg-yellow-600",
          indicator: "bg-yellow-600"
        };
      case 'delivered': 
        return {
          bg: "bg-green-500 hover:bg-green-600",
          indicator: "bg-green-600"
        };
      default: 
        return {
          bg: "bg-gray-500 hover:bg-gray-600",
          indicator: "bg-gray-600"
        };
    }
  };

  const colors = getBellColors();

  return (
    <>
      {/* Bell Icon */}
      <div
        className={cn(
          "fixed top-6 left-6 z-50 transition-all duration-300 ease-in-out cursor-pointer",
          isAnimating && isVisible 
            ? "translate-x-0 opacity-100 animate-pulse" 
            : "-translate-x-full opacity-0"
        )}
        onClick={handleClose}
      >
        <div className={cn(
          "relative p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200",
          colors.bg
        )}>
          <Bell className="h-6 w-6 text-white animate-bounce" />
          
          {/* Status indicator */}
          <div className={cn(
            "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
            colors.indicator
          )}>
            <StatusIcon className="h-2.5 w-2.5 text-white" />
          </div>
        </div>
      </div>

    </>
  );
};

export default SideNotification;