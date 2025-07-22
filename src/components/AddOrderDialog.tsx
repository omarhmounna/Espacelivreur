
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Order } from '@/pages/Index';

interface AddOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (order: Partial<Order>) => void;
  defaultCommission?: number;
}

const AddOrderDialog: React.FC<AddOrderDialogProps> = ({ isOpen, onClose, onAdd, defaultCommission = 0 }) => {
  const { t } = useLanguage();
  // Update form data when defaultCommission changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      commission: defaultCommission.toString()
    }));
  }, [defaultCommission]);

  const [formData, setFormData] = useState({
    code: '',
    vendeur: '',
    numero: '',
    prix: '',
    statut: 'Nouveau',
    commentaire: '',
    commission: defaultCommission.toString()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.vendeur || !formData.prix) {
      return;
    }

    onAdd({
      ...formData,
      prix: parseFloat(formData.prix) || 0,
      commission: parseFloat(formData.commission) || defaultCommission
    });

    // Reset form
    setFormData({
      code: '',
      vendeur: '',
      numero: '',
      prix: '',
      statut: 'Nouveau',
      commentaire: '',
      commission: defaultCommission.toString()
    });

    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl border-0 shadow-xl bg-background p-0">
        {/* Compact Header */}
        <DialogHeader className="text-center px-4 pt-6 pb-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20"/>
              <path d="m5 9 7 7 7-7"/>
            </svg>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">{t('add_new_order')}</DialogTitle>
        </DialogHeader>

        {/* Compact Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 px-4 py-4 space-y-4">
            {/* Row 1: Code & Client */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="code" className="text-xs font-medium text-gray-700">{t('order_code')} *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="CMD001"
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="vendeur" className="text-xs font-medium text-gray-700">{t('client_name')} *</Label>
                <Input
                  id="vendeur"
                  value={formData.vendeur}
                  onChange={(e) => handleInputChange('vendeur', e.target.value)}
                  placeholder="أحمد محمد"
                  className="h-9 text-sm"
                  required
                />
              </div>
            </div>

            {/* Row 2: Phone & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="numero" className="text-xs font-medium text-gray-700">{t('phone_number')}</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  placeholder="123456789"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="prix" className="text-xs font-medium text-gray-700">{t('order_price')} *</Label>
                <Input
                  id="prix"
                  type="number"
                  step="0.01"
                  value={formData.prix}
                  onChange={(e) => handleInputChange('prix', e.target.value)}
                  placeholder="250.00"
                  className="h-9 text-sm"
                  required
                />
              </div>
            </div>

            {/* Row 3: Commission */}
            <div className="space-y-1">
              <Label htmlFor="commission" className="text-xs font-medium text-gray-700">{t('commission')}</Label>
              <Input
                id="commission"
                type="number"
                step="0.01"
                value={formData.commission}
                onChange={(e) => handleInputChange('commission', e.target.value)}
                placeholder="0.00"
                className="h-9 text-sm"
              />
            </div>

            {/* Row 4: Status */}
            <div className="space-y-1">
              <Label htmlFor="statut" className="text-xs font-medium text-gray-700">{t('order_status')}</Label>
              <Select
                value={formData.statut}
                onValueChange={(value) => handleInputChange('statut', value)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-lg border border-gray-300 rounded-md z-50">
                  <SelectItem value="Nouveau">{t('Nouveau')}</SelectItem>
                  <SelectItem value="Confirmé">{t('Confirmé')}</SelectItem>
                  <SelectItem value="En cours">{t('En cours')}</SelectItem>
                  <SelectItem value="Annulé">{t('Annulé')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 5: Comment */}
            <div className="space-y-1">
              <Label htmlFor="commentaire" className="text-xs font-medium text-gray-700">{t('order_comment')}</Label>
              <Textarea
                id="commentaire"
                value={formData.commentaire}
                onChange={(e) => handleInputChange('commentaire', e.target.value)}
                placeholder={t('write_comment')}
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 flex gap-2 p-4 border-t bg-white/95 backdrop-blur">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1 h-10 text-sm font-medium rounded-lg border-gray-300 hover:bg-gray-50"
            >
              {t('cancel')}
            </Button>
            <Button 
              type="submit"
              className="flex-1 h-10 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md"
            >
              <span className="flex items-center justify-center gap-1">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20"/>
                  <path d="m5 9 7 7 7-7"/>
                </svg>
                {t('add_order')}
              </span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderDialog;
