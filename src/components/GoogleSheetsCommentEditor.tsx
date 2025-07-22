import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Order } from '@/pages/Index';

interface GoogleSheetsCommentEditorProps {
  selectedOrder: Order | null;
  onSave: (comment: string) => void;
  onCancel: () => void;
  onCommentChange?: (comment: string) => void; // إضافة خاصية جديدة للتحديث المباشر
}

const GoogleSheetsCommentEditor: React.FC<GoogleSheetsCommentEditorProps> = ({
  selectedOrder,
  onSave,
  onCancel,
  onCommentChange
}) => {
  const { t, isRTL } = useLanguage();
  const [comment, setComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedOrder) {
      setComment(selectedOrder.commentaire || '');
      // Focus textarea after a short delay to ensure it's rendered
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [selectedOrder]);

  const handleSave = () => {
    onSave(comment);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  if (!selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold">{selectedOrder.code.charAt(0)}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold">{selectedOrder.code}</h3>
                <p className="text-blue-100 text-sm">{selectedOrder.vendeur}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* أزرار الأولوية */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5">
            <div className="text-center mb-4">
              <h4 className="text-lg font-bold text-gray-800 mb-1">🎯 أولوية التسليم</h4>
              <p className="text-sm text-gray-600">اختر مستوى الأولوية للطلبية</p>
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              {[
                { num: 1, color: "red", label: "عاجل جداً", icon: "🔥", bg: "bg-red-500", hover: "hover:bg-red-600" },
                { num: 2, color: "orange", label: "مهم", icon: "🚨", bg: "bg-orange-500", hover: "hover:bg-orange-600" },
                { num: 3, color: "yellow", label: "عادي", icon: "⭐", bg: "bg-yellow-500", hover: "hover:bg-yellow-600" },
                { num: 4, color: "blue", label: "متأخر", icon: "📅", bg: "bg-blue-500", hover: "hover:bg-blue-600" },
                { num: 5, color: "gray", label: "غير مهم", icon: "📦", bg: "bg-gray-500", hover: "hover:bg-gray-600" }
              ].map((priority) => {
                const isSelected = comment.startsWith(`${priority.num}. `);
                return (
                  <div key={priority.num} className="flex flex-col items-center">
                    <button
                      onClick={() => {
                        const priorityText = `${priority.num}. `;
                        const newComment = comment.startsWith(priorityText) 
                          ? comment.substring(priorityText.length)
                          : priorityText + comment.replace(/^\d+\.\s*/, '');
                         setComment(newComment);
                         onCommentChange?.(newComment);
                      }}
                      className={cn(
                        "w-16 h-16 rounded-full flex flex-col items-center justify-center text-white font-bold transition-all duration-300 relative overflow-hidden shadow-lg",
                        isSelected 
                          ? `${priority.bg} scale-110 shadow-xl ring-4 ring-white animate-pulse` 
                          : `${priority.bg} opacity-70 ${priority.hover} hover:scale-105 hover:opacity-100`
                      )}
                      type="button"
                    >
                      <span className="text-xl leading-none mb-1">{priority.icon}</span>
                      <span className="text-sm font-bold leading-none">{priority.num}</span>
                      {isSelected && (
                        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                      )}
                    </button>
                    <span className={cn(
                      "text-xs mt-2 font-medium text-center transition-colors px-2",
                      isSelected ? "text-gray-900 font-bold" : "text-gray-600"
                    )}>
                      {priority.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* نافذة الكتابة */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              💬 التعليق
            </label>
            <Textarea
              ref={textareaRef}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                onCommentChange?.(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="اكتب تعليقك هنا... يمكنك الضغط على Ctrl+Enter للحفظ"
              className={cn(
                "min-h-[120px] max-h-[200px] resize-none text-base w-full",
                "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "border-2 border-gray-300 rounded-xl",
                "text-right p-4"
              )}
              style={{ fontSize: '16px' }}
            />
          </div>
          
          {/* أزرار الحفظ والإلغاء */}
          <div className="flex gap-3 justify-center pt-4 border-t border-gray-200">
            <Button
              onClick={onCancel}
              variant="outline"
              className="h-12 px-8 text-base rounded-xl border-2"
              size="lg"
            >
              إلغاء
            </Button>
            
            <Button
              onClick={handleSave}
              className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg"
              size="lg"
            >
              <Check className="h-5 w-5 mr-2" />
              حفظ التعليق
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsCommentEditor;