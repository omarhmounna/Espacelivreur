
import * as XLSX from 'xlsx';
import { Order } from '@/pages/Index';

export const exportOrdersToExcel = (orders: Order[], archivedOrders: Order[]) => {
  // تحضير البيانات للطلبيات المسلمة (من الأرشيف)
  const deliveredData = archivedOrders.map(order => ({
    'الكود': order.code,
    'العميل': order.vendeur,
    'رقم الهاتف': order.numero,
    'السعر': order.prix,
    'العمولة': order.commission || 0,
    'الحالة': order.statut,
    'التعليق': order.commentaire
  }));

  // تحضير البيانات للطلبيات الملغية والمفقودة
  const nonDeliveredOrders = orders.filter(order => 
    order.statut === 'Annulé' || order.statut === 'Pas de réponse'
  );
  
  const nonDeliveredData = nonDeliveredOrders.map(order => ({
    'الكود': order.code,
    'العميل': order.vendeur,
    'رقم الهاتف': order.numero,
    'السعر': order.prix,
    'العمولة': order.commission || 0,
    'الحالة': order.statut,
    'التعليق': order.commentaire
  }));

  // دمج البيانات: المسلمة أولاً ثم الملغية
  const allData = [
    ...deliveredData,
    ...(deliveredData.length > 0 && nonDeliveredData.length > 0 ? [{}] : []), // سطر فارغ للفصل
    ...nonDeliveredData
  ];

  // إنشاء ورقة عمل Excel
  const worksheet = XLSX.utils.json_to_sheet(allData);
  
  // إنشاء كتاب العمل
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلبيات');
  
  // تحديد اسم الملف مع التاريخ الحالي
  const currentDate = new Date().toISOString().split('T')[0];
  const fileName = `طلبيات_${currentDate}.xlsx`;
  
  // تصدير الملف
  XLSX.writeFile(workbook, fileName);
  
  return fileName;
};

// للتوافق مع الكود الحالي
export const exportToExcel = exportOrdersToExcel;
