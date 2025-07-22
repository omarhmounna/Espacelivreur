
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/pages/Index';

interface ArchivedOrdersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  archivedOrders: Order[];
}

const ArchivedOrdersDialog: React.FC<ArchivedOrdersDialogProps> = ({
  isOpen,
  onClose,
  archivedOrders
}) => {
  const { t } = useLanguage();
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col rounded-2xl border-0 shadow-xl bg-background">
        <DialogHeader className="text-center px-6 pt-8 pb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="5" x="2" y="3" rx="1"/>
              <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/>
              <path d="m9.5 17 5-5"/>
              <path d="m9.5 12 5 5"/>
            </svg>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground mb-2">
            الطلبيات المسلمة
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            عرض جميع الطلبيات التي تم تسليمها بنجاح
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto px-6">
          {archivedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-3">
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3h18v18H3z"/>
                  <path d="m9 9 6 6"/>
                  <path d="m15 9-6 6"/>
                </svg>
              </div>
              <p className="text-muted-foreground text-center">لا توجد طلبيات مسلمة بعد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-semibold">Code</TableHead>
                  <TableHead className="text-center font-semibold">Client/Vendeur</TableHead>
                  <TableHead className="text-center font-semibold">Numéro</TableHead>
                  <TableHead className="text-center font-semibold">Prix</TableHead>
                  <TableHead className="text-center font-semibold">Statut</TableHead>
                  <TableHead className="text-center font-semibold">Commentaire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="text-center font-mono text-sm">
                      {order.code}
                    </TableCell>
                    <TableCell className="text-center">
                      {order.vendeur}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {order.numero}
                    </TableCell>
                    <TableCell className="text-center text-green-600 font-medium">
                      {formatPrice(order.prix)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-600 hover:bg-green-700 text-white">
                        Livré
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {order.commentaire || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        
        <div className="border-t bg-muted/30 px-6 py-4 mt-4 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">{archivedOrders.length}</span>
              </div>
              <span className="text-sm text-muted-foreground">طلبية مسلمة</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-green-600">
                {formatPrice(archivedOrders.reduce((sum, order) => sum + order.prix, 0))}
              </span>
              <p className="text-xs text-muted-foreground">إجمالي القيمة</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArchivedOrdersDialog;
