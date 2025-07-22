import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'fr';

interface Translations {
  ar: Record<string, string>;
  fr: Record<string, string>;
}

const translations: Translations = {
  ar: {
    // Header & Navigation
    'settings': 'الإعدادات',
    'search': 'البحث',
    'add': 'إضافة طلبية',
    'upload': 'رفع ملف',
    'scanner': 'الماسح الضوئي',
    'archive': 'الأرشيف',
    'menu': 'القائمة',
    'close': 'إغلاق',
    
    // Table Headers
    'code': 'الكود',
    'client': 'العميل/البائع',
    'phone': 'الرقم',
    'price': 'الثمن',
    'comment': 'التعليق',
    'status': 'الحالة',
    'destination': 'الوجهة',
    
    // Status
    'Confirmé': 'مؤكد',
    'En cours': 'قيد التنفيذ', 
    'Livré': 'تم التوصيل',
    'Reporté': 'مؤجل',
    'Annulé': 'ملغي',
    'Refusé': 'مرفوض',
    'Numéro erroné': 'رقم خاطئ',
    'Hors zone': 'خارج المنطقة',
    'Programmé': 'مبرمج',
    'Nouveau': 'جديد',
    'Pas de réponse': 'لا يجيب',
    
    // Menu Items
    'commission': 'العمولة',
    'delivery_percentage': 'نسبة التوصيل',
    'generate_invoice': 'توليد الفاتورة',
    'share_excel': 'مشاركة ملف إكسل',
    'clear_all_data': 'مسح جميع البيانات',
    'language': 'اللغة',
    'select_language': 'اختر اللغة',
    
    // Language names
    'arabic': 'العربية',
    'french': 'الفرنسية',
    
    // Messages
    'save_changes': 'حفظ التغييرات',
    'settings_saved': 'تم حفظ الإعدادات',
    'commission_updated': 'تم تحديث العمولة بنجاح',
    'excel_downloaded': 'تم تحميل ملف Excel',
    'file_downloaded_success': 'تم تحميل الملف بنجاح',
    'error': 'خطأ',
    'download_error': 'حدث خطأ أثناء التحميل',
    'no_delivered_orders': 'لا توجد طلبيات مسلمة',
    'no_delivered_orders_desc': 'لا توجد طلبيات مسلمة لإنشاء فاتورة',
    'invoice_generated': 'تم إنشاء الفاتورة بنجاح',
    'invoice_downloaded': 'تم تحميل الفاتورة',
    'invoice_error': 'حدث خطأ أثناء إنشاء الفاتورة',
    'data_deleted': 'تم حذف البيانات',
    'all_orders_deleted': 'تم حذف جميع الطلبيات بنجاح',
    'are_you_sure': 'هل أنت متأكد؟',
    'delete_confirmation': 'هذا الإجراء سيحذف جميع الطلبيات (النشطة والمؤرشفة). لا يمكن التراجع عن هذا الإجراء. ستبقى إعدادات العمولة محفوظة.',
    'cancel': 'إلغاء',
    'delete_all': 'حذف الكل',
    'enter_commission': 'أدخل قيمة العمولة',
    'orders_delivered': 'طلبيات تم توصيلها',
    'from': 'من',
    'create_invoice': 'إنشاء فاتورة للطلبيات',
    'share_excel_desc': 'مشاركة البيانات كملف إكسل',
    'delete_all_desc': 'حذف جميع الطلبيات',
     'write_comment': 'اكتب تعليق...',
     'click_to_comment': 'اضغط للتعليق',
     'commission_short': 'كم',
    'save': 'حفظ',
    'edit_comment': '',
    'to_save': 'للحفظ',
    'language_changed': 'تم تغيير اللغة',
    'language_changed_desc': 'تم تغيير اللغة بنجاح',
    
    // Toast Messages
    'order_added': 'تم إضافة الطلبية',
    'order_added_desc': 'تم إضافة الطلبية بنجاح',
    'order_archived': 'تم أرشفة الطلبية',
    'order_archived_desc': 'تم نقل الطلبية إلى الأرشيف',
    'status_updated': 'تم تحديث الحالة',
    'status_updated_desc': 'تم تغيير الحالة بنجاح',
    'order_found': 'تم العثور على الطلبية',
    'order_found_desc': 'تم تحديث الطلبية',
    'order_not_found': 'لم يتم العثور على الطلبية',
    'order_not_found_desc': 'الكود غير موجود في قائمة الطلبيات',
    'file_uploaded_success': 'تم تحميل الملف بنجاح',
    'file_uploaded_desc': 'تم إضافة طلبيات جديدة',
    'export_success': 'تم تصدير الملف بنجاح',
    'export_success_desc': 'تم تصدير الطلبيات إلى ملف',
    'no_orders': 'لا توجد طلبيات',
    'no_orders_desc': 'لا يوجد طلبيات لتصديرها',
    'export_error': 'خطأ في التصدير',
    'export_error_desc': 'حدث خطأ أثناء تصدير الملف',
    'data_cleared': 'تم مسح البيانات',
    'data_cleared_desc': 'تم مسح جميع الطلبيات بنجاح. يمكنك الآن البدء من جديد.',
    'search_placeholder': 'ابحث بالكود، العميل، أو الرقم...',
    'search_results': 'تم العثور على',
    'search_results_desc': 'طلبية من أصل',
    'orders': 'طلبية',
    
    // Dialog titles and buttons
    'add_new_order': 'إضافة طلبية جديدة',
    'upload_file': 'رفع ملف',
    'barcode_scanner': 'ماسح الباركود',
    'archived_orders': 'الطلبيات المؤرشفة',
    'table_settings': 'إعدادات الجدول',
    'scan_barcode': 'امسح الباركود',
    'upload_excel': 'رفع ملف إكسل',
    'view_archived': 'عرض المؤرشف',
    'configure_table': 'تكوين الجدول',
    
    // Form fields
    'order_code': 'كود الطلبية',
    'client_name': 'اسم العميل',
    'phone_number': 'رقم الهاتف',
    'order_price': 'سعر الطلبية',
    'order_status': 'حالة الطلبية',
    'order_comment': 'تعليق الطلبية',
    'add_order': 'إضافة الطلبية',
    'add_comment': 'إضافة تعليق',
    'shortcuts': 'اختصارات',
    'required_field': 'هذا الحقل مطلوب',
    
    // Scanner
    'scan_instruction': 'وجه الكاميرا نحو الباركود',
    'camera_permission': 'يرجى السماح للكاميرا',
    'scan_success': 'تم المسح بنجاح',
    'scan_failed': 'فشل المسح',
    
    // Table Settings
    'column_visibility': 'عرض الأعمدة',
    'font_size': 'حجم الخط',
    'font_weight': 'سمك الخط',
    'text_alignment': 'محاذاة النص',
    'editable_columns': 'للأعمدة القابلة للتحرير',
    'normal': 'عادي',
    'bold': 'عريض',
    'light': 'رفيع',
    'left': 'يسار',
    'center': 'وسط',
    'right': 'يمين'
  },
  fr: {
    // Header & Navigation
    'settings': 'Paramètres',
    'search': 'Recherche',
    'add': 'Ajouter commande',
    'upload': 'Télécharger fichier',
    'scanner': 'Scanner',
    'archive': 'Archive',
    'menu': 'Menu',
    'close': 'Fermer',
    
    // Table Headers
    'code': 'Code',
    'client': 'CL/Vendeur',
    'phone': 'Numéro',
    'price': 'Prix',
    'comment': 'Commentaire',
    'status': 'Statut',
    'destination': 'Destination',
    
    // Status
    'Confirmé': 'Confirmé',
    'En cours': 'En cours', 
    'Livré': 'Livré',
    'Reporté': 'Reporté',
    'Annulé': 'Annulé',
    'Refusé': 'Refusé',
    'Numéro erroné': 'Numéro erroné',
    'Hors zone': 'Hors zone',
    'Programmé': 'Programmé',
    'Nouveau': 'Nouveau',
    'Pas de réponse': 'Pas de réponse',
    
    // Menu Items
    'commission': 'Commission',
    'delivery_percentage': 'Pourcentage de livraison',
    'generate_invoice': 'Générer facture',
    'share_excel': 'Partager fichier Excel',
    'clear_all_data': 'Effacer toutes les données',
    'language': 'Langue',
    'select_language': 'Sélectionnez la langue',
    
    // Language names
    'arabic': 'العربية',
    'french': 'Français',
    
    // Messages
    'save_changes': 'Sauvegarder les modifications',
    'settings_saved': 'Paramètres sauvegardés',
    'commission_updated': 'Commission mise à jour avec succès',
    'excel_downloaded': 'Excel téléchargé',
    'file_downloaded_success': 'Le fichier a été téléchargé avec succès',
    'error': 'Erreur',
    'download_error': 'Une erreur est survenue lors du téléchargement',
    'no_delivered_orders': 'Aucune commande livrée',
    'no_delivered_orders_desc': 'Il n\'y a pas de commandes livrées pour générer une facture',
    'invoice_generated': 'Facture générée avec succès',
    'invoice_downloaded': 'La facture a été téléchargée',
    'invoice_error': 'Une erreur est survenue lors de la génération de la facture',
    'data_deleted': 'Données supprimées',
    'all_orders_deleted': 'Toutes les commandes ont été supprimées avec succès',
    'are_you_sure': 'Êtes-vous sûr ?',
    'delete_confirmation': 'Cette action supprimera toutes les commandes (actives et archivées). Cette action ne peut pas être annulée. Les paramètres de commission seront conservés.',
    'cancel': 'Annuler',
    'delete_all': 'Tout supprimer',
    'enter_commission': 'Entrez la valeur de la commission',
    'orders_delivered': 'commandes livrées',
    'from': 'sur',
    'create_invoice': 'Créer une facture pour les commandes',
    'share_excel_desc': 'Partager les données en fichier Excel',
    'delete_all_desc': 'Supprimer toutes les commandes',
     'write_comment': 'Écrire un commentaire...',
     'click_to_comment': 'Cliquer pour commenter',
     'commission_short': 'Cm',
    'save': 'Sauvegarder',
    'edit_comment': '',
    'to_save': 'pour sauvegarder',
    'language_changed': 'Langue modifiée',
    'language_changed_desc': 'La langue a été modifiée avec succès',
    
     // Toast Messages
     'order_added': 'Commande ajoutée',
     'order_added_desc': 'La commande a été ajoutée avec succès',
     'order_archived': '✅ Livraison réussie',
     'order_archived_desc': 'La commande a été livrée et archivée',
     'status_updated': 'Statut mis à jour',
     'status_updated_desc': 'Le statut a été modifié avec succès',
    'order_found': 'Commande trouvée',
    'order_found_desc': 'La commande a été mise à jour',
    'order_not_found': 'Commande non trouvée',
    'order_not_found_desc': 'Le code n\'existe pas dans la liste des commandes',
    'file_uploaded_success': 'Fichier téléchargé avec succès',
    'file_uploaded_desc': 'Nouvelles commandes ajoutées',
    'export_success': 'Fichier exporté avec succès',
    'export_success_desc': 'Les commandes ont été exportées vers un fichier',
    'no_orders': 'Aucune commande',
    'no_orders_desc': 'Il n\'y a pas de commandes à exporter',
    'export_error': 'Erreur d\'exportation',
    'export_error_desc': 'Une erreur s\'est produite lors de l\'exportation du fichier',
    'data_cleared': 'Données supprimées',
    'data_cleared_desc': 'Toutes les commandes ont été supprimées avec succès. Vous pouvez maintenant recommencer.',
    'search_placeholder': 'Rechercher par code, client ou numéro...',
    'search_results': 'Trouvé',
    'search_results_desc': 'commande(s) sur',
    'orders': 'commande(s)',
    
    // Delivery confirmation dialog
    'confirm_delivery': 'Confirmer la livraison',
    'confirm_delivery_question': 'Êtes-vous sûr de livrer la commande',
    'archive_warning': 'La commande sera déplacée vers les archives',
    'confirm_delivery_action': 'Confirmer la livraison',
    
    // Dialog titles and buttons
    'add_new_order': 'Ajouter nouvelle commande',
    'upload_file': 'Télécharger fichier',
    'barcode_scanner': 'Scanner de codes-barres',
    'archived_orders': 'Commandes archivées',
    'table_settings': 'Paramètres du tableau',
    'scan_barcode': 'Scanner le code-barres',
    'upload_excel': 'Télécharger fichier Excel',
    'view_archived': 'Voir les archives',
    'configure_table': 'Configurer le tableau',
    
    // Form fields
    'order_code': 'Code de commande',
    'client_name': 'Nom du client',
    'phone_number': 'Numéro de téléphone',
    'order_price': 'Prix de la commande',
    'order_status': 'Statut de la commande',
    'order_comment': 'Commentaire de la commande',
    'add_order': 'Ajouter la commande',
    'add_comment': 'Ajouter un commentaire',
    'shortcuts': 'Raccourcis',
    'required_field': 'Ce champ est requis',
    
    // Scanner
    'scan_instruction': 'Pointez la caméra vers le code-barres',
    'camera_permission': 'Veuillez autoriser l\'accès à la caméra',
    'scan_success': 'Scan réussi',
    'scan_failed': 'Échec du scan',
    
    // Table Settings
    'column_visibility': 'Visibilité des colonnes',
    'font_size': 'Taille de police',
    'font_weight': 'Épaisseur de police',
    'text_alignment': 'Alignement du texte',
    'editable_columns': 'colonnes modifiables',
    'normal': 'Normal',
    'bold': 'Gras',
    'light': 'Léger',
    'left': 'Gauche',
    'center': 'Centre',
    'right': 'Droite'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'ar';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};