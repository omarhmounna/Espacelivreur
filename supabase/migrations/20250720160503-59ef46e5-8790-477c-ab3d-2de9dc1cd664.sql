-- إضافة عمود الكوميسيون إلى جدول الطلبيات
ALTER TABLE public.orders ADD COLUMN commission numeric DEFAULT 0;

-- إضافة عمود الكوميسيون إلى جدول الطلبيات المؤرشفة
ALTER TABLE public.archived_orders ADD COLUMN commission numeric DEFAULT 0;

-- إضافة تعليق للعمود الجديد
COMMENT ON COLUMN public.orders.commission IS 'قيمة الكوميسيون أو ثمن التوصيل للطلبية';
COMMENT ON COLUMN public.archived_orders.commission IS 'قيمة الكوميسيون أو ثمن التوصيل للطلبية المؤرشفة';