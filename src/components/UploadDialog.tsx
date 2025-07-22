import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import * as XLSX from 'xlsx';
import type { Order } from '@/pages/Index';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (orders: Order[]) => void;
}

const UploadDialog: React.FC<UploadDialogProps> = ({ isOpen, onClose, onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const parseExcelFile = (file: File): Promise<Order[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          console.log('Raw Excel data:', jsonData);
          
          // Skip empty rows and header row
          const dataRows = jsonData.slice(1).filter((row: any) => row && row.length > 0);
          
          const orders: Order[] = dataRows.map((row: any, index: number) => {
            // Handle different column arrangements - try to detect columns automatically
            const rowData = Array.isArray(row) ? row : [];
            
            return {
              id: `excel_${Date.now()}_${index}`,
              code: rowData[0]?.toString() || `CMD${Math.floor(Math.random() * 1000) + 100}`,
              vendeur: rowData[1]?.toString() || 'Vendeur inconnu',
              numero: rowData[2]?.toString() || '0000000000',
              prix: parseFloat(rowData[3]) || 0,
              statut: 'Nouveau',
              commentaire: rowData[5]?.toString() || 'Importé depuis Excel'
            };
          }).filter(order => order.code && order.code !== ''); // Filter out empty rows
          
          console.log('Parsed orders:', orders);
          resolve(orders);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv'
    ];

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidFile = allowedTypes.includes(file.type) || ['xlsx', 'xls', 'csv'].includes(fileExtension || '');

    if (!isValidFile) {
      toast({
        title: "Type de fichier non supporté",
        description: "Veuillez télécharger un fichier Excel (.xlsx, .xls) ou CSV",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      let orders: Order[] = [];
      
      if (fileExtension === 'csv' || file.type === 'text/csv') {
        // Handle CSV files
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        const dataLines = lines.slice(1); // Skip header
        
        orders = dataLines.map((line, index) => {
          const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
          
          return {
            id: `csv_${Date.now()}_${index}`,
            code: columns[0] || `CMD${Math.floor(Math.random() * 1000) + 100}`,
            vendeur: columns[1] || 'Vendeur inconnu',
            numero: columns[2] || '0000000000',
            prix: parseFloat(columns[3]) || 0,
            statut: 'Nouveau',
            commentaire: columns[5] || 'Importé depuis CSV'
          };
        }).filter(order => order.code && order.code !== '');
      } else {
        // Handle Excel files
        orders = await parseExcelFile(file);
      }

      if (orders.length === 0) {
        toast({
          title: "Aucune donnée trouvée",
          description: "Le fichier ne contient pas de données valides ou est vide",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      console.log('Final orders to upload:', orders);
      
      // Call the onUpload function with the parsed orders
      onUpload(orders);
      
      setIsProcessing(false);
      onClose();

      toast({
        title: "Fichier importé avec succès",
        description: `${orders.length} commandes ont été importées depuis le fichier`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      setIsProcessing(false);
      
      toast({
        title: "Erreur lors de l'importation",
        description: "Impossible de lire le fichier. Vérifiez le format des données.",
        variant: "destructive"
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Télécharger fichier des commandes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isProcessing ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600">Traitement du fichier en cours...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Glissez le fichier ici ou cliquez pour sélectionner
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supporte les fichiers Excel (.xlsx, .xls) et CSV
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choisir un fichier
                </Button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Format attendu des colonnes:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Colonne A: Code
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Colonne B: Vendeur/Client
              </div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Colonne C: Numéro
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Colonne D: Prix
              </div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Colonne E: Statut
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Colonne F: Commentaire
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
