
import React from 'react';
import OrdersTable from './OrdersTable';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    commission: 'left' | 'center' | 'right';
    comment: 'left' | 'center' | 'right';
  };
  coordinatesVisibility: boolean;
}

interface InteractiveTableProps {
  orders: Order[];
  onUpdateComment: (id: string, comment: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePhone: (id: string, phone: string) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onUpdateCommission: (id: string, commission: number) => void;
  onReorderOrders: (newOrders: Order[]) => void;
  tableSettings: TableSettings;
  defaultCommission?: number;
}

const InteractiveTable: React.FC<InteractiveTableProps> = ({ orders, onUpdateComment, onUpdateStatus, onUpdatePhone, onUpdatePrice, onUpdateCommission, onReorderOrders, tableSettings, defaultCommission }) => {
  return (
    <div className="w-full">
      <OrdersTable
        orders={orders}
        onUpdateComment={onUpdateComment}
        onUpdateStatus={onUpdateStatus}
        onUpdatePhone={onUpdatePhone}
        onUpdatePrice={onUpdatePrice}
        onUpdateCommission={onUpdateCommission}
        onReorderOrders={onReorderOrders}
        tableSettings={tableSettings}
        defaultCommission={defaultCommission}
      />
    </div>
  );
};

export default InteractiveTable;
