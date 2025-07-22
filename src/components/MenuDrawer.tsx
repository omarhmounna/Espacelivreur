
import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Receipt, Percent, DollarSign, ChevronRight, Trash2, Share2, Languages, LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { generateInvoicePDF, Order } from '@/utils/pdfGenerator';
import { exportOrdersToExcel } from '@/utils/excelExport';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  commission: number;
  onCommissionChange: (value: number) => void;
  totalOrders: number;
  deliveredOrders: number;
  archivedOrders: Order[];
  orders: Order[];
  onClearAllData: () => void;
  onShare: () => void;
}

const MenuDrawer: React.FC<MenuDrawerProps> = ({ 
  isOpen, 
  onClose, 
  commission, 
  onCommissionChange,
  totalOrders,
  deliveredOrders,
  archivedOrders,
  orders,
  onClearAllData,
  onShare
}) => {
  const [tempCommission, setTempCommission] = useState(commission);
  const { toast } = useToast();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { user, signOut } = useAuth();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    toast({
      title: t('language_changed'),
      description: t('language_changed_desc'),
    });
  };

  const handleSaveCommission = () => {
    onCommissionChange(tempCommission);
    toast({
      title: t('settings_saved'),
      description: t('commission_updated'),
    });
  };

  const handleDownloadExcel = () => {
    try {
      const fileName = exportOrdersToExcel(orders, archivedOrders);
      toast({
        title: t('excel_downloaded'),
        description: `${t('file_downloaded_success')} ${fileName}`,
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('download_error'),
        variant: 'destructive'
      });
    }
  };

  const handleGenerateInvoice = () => {
    console.log('Generate invoice clicked');
    console.log('Archived orders:', archivedOrders);
    console.log('Commission:', commission);
    
    try {
      if (archivedOrders.length === 0) {
        console.log('No delivered orders found');
        toast({
          title: t('no_delivered_orders'),
          description: t('no_delivered_orders_desc'),
          variant: 'destructive'
        });
        return;
      }

      console.log('Generating PDF...');
      const fileName = generateInvoicePDF(archivedOrders, commission);
      console.log('PDF generated successfully:', fileName);
      
      toast({
        title: t('invoice_generated'),
        description: `${t('invoice_downloaded')} ${fileName}`,
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: t('error'),
        description: t('invoice_error'),
        variant: 'destructive'
      });
    }
  };

  const handleClearAllData = () => {
    onClearAllData();
    toast({
      title: t('data_deleted'),
      description: t('all_orders_deleted'),
    });
    onClose();
  };

  // Calcul automatique du pourcentage de livraison
  const deliveryPercentage = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="text-center border-b pb-4 flex-shrink-0">
          <DrawerTitle className="text-xl font-bold text-gray-800">{t('settings')}</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* User Information */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{t('user_account')}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
              onClick={signOut}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <LogOut className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{t('logout')}</h3>
                  <p className="text-sm text-gray-500">{t('logout_desc')}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Language Settings */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Languages className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{t('language')}</h3>
                  <p className="text-sm text-gray-500">{t('select_language')}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="px-4 pb-4">
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-lg border border-gray-300 rounded-md z-50">
                  <SelectItem value="ar">{t('arabic')}</SelectItem>
                  <SelectItem value="fr">{t('french')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Commission Settings */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{t('commission')}</h3>
                  <p className="text-sm text-gray-500">{commission}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="px-4 pb-4 space-y-3">
              <Input
                type="number"
                value={tempCommission}
                onChange={(e) => setTempCommission(Number(e.target.value))}
                placeholder={t('enter_commission')}
                className="text-center"
              />
              <Button 
                onClick={handleSaveCommission} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                {t('save_changes')}
              </Button>
            </div>
          </div>

          {/* Delivery Percentage */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Percent className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{t('delivery_percentage')}</h3>
                  <p className="text-sm text-gray-500">
                    {deliveredOrders} {t('from')} {totalOrders} {t('orders_delivered')}
                  </p>
                </div>
              </div>
              <span className="text-lg font-semibold text-green-600">{deliveryPercentage}%</span>
            </div>
          </div>

          {/* Generate Invoice */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
              onClick={handleGenerateInvoice}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{t('generate_invoice')}</h3>
                  <p className="text-sm text-gray-500">{t('create_invoice')}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Share Excel File */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
              onClick={onShare}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Share2 className="h-5 w-5 text-blue-800" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{t('share_excel')}</h3>
                  <p className="text-sm text-gray-500">{t('share_excel_desc')}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Clear All Data */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{t('clear_all_data')}</h3>
                      <p className="text-sm text-gray-500">{t('delete_all_desc')}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('delete_confirmation')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllData} className="bg-red-600 hover:bg-red-700">
                    {t('delete_all')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <DrawerFooter className="border-t pt-4 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('close')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MenuDrawer;
