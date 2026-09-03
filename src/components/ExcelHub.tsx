import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Check, 
  AlertCircle, 
  Info,
  BookOpen
} from 'lucide-react';
import { Product, Sale, Customer } from '../types';
import { 
  exportToExcel,
  exportProductsExcel,
  exportCustomerPriceListExcel,
  exportCustomersExcel,
  exportExpiryExcel,
  importExcelData,
  ExpiryImportResult
} from '../utils/excelUtils';

type ImportMode = 'products' | 'customers' | 'expiry';

interface ExcelHubProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  onImportProducts: (imported: Product[]) => void;
  onImportCustomers: (imported: Customer[]) => void;
  onImportExpiry: (expiryData: ExpiryImportResult) => void;
}

const importModeLabels: Record<ImportMode, string> = {
  products: 'استيراد المنتجات',
  customers: 'استيراد العملاء',
  expiry: 'استيراد بيانات الاكسبير'
};

const importModeDescriptions: Record<ImportMode, string> = {
  products: 'قم بتحميل شيت يحتوي على صفحة باسم "المنتجات" تحتوي على الأعمدة الأساسية للمخزن.',
  customers: 'قم بتحميل شيت يحتوي على صفحة باسم "العملاء" مع بيانات العميل وأسعار الفواتير ورصيد الاكسبير.',
  expiry: 'قم بتحميل شيت يحتوي على صفحة "صلاحية المنتجات" و/أو "صلاحية العملاء" لتحديث تواريخ الصلاحية وبيانات الاكسبير.'
};

export default function ExcelHub({
  products,
  sales,
  customers,
  onImportProducts,
  onImportCustomers,
  onImportExpiry
}: ExcelHubProps) {
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('products');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleExportFull = () => {
    try {
      exportToExcel(products, sales, customers);
    } catch (err) {
      alert('حدث خطأ أثناء تصدير شيت الإكسيل، يرجى المحاولة لاحقاً.');
    }
  };

  const handleExportProducts = () => {
    try {
      exportProductsExcel(products);
    } catch (err) {
      alert('حدث خطأ أثناء تصدير بيانات المنتجات.');
    }
  };

  const handleExportCustomerPriceList = () => {
    try {
      exportCustomerPriceListExcel(products);
    } catch (err) {
      alert('حدث خطأ أثناء تصدير قائمة الأسعار للعملاء.');
    }
  };

  const handleExportCustomers = () => {
    try {
      exportCustomersExcel(customers);
    } catch (err) {
      alert('حدث خطأ أثناء تصدير بيانات العملاء.');
    }
  };

  const handleExportExpiry = () => {
    try {
      exportExpiryExcel(products, customers);
    } catch (err) {
      alert('حدث خطأ أثناء تصدير بيانات الاكسبير.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = async (file: File) => {
    setImportError('');
    setImportSuccess('');

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      setImportError('عذراً، يجب اختيار ملف بصيغة إكسيل فقط (.xlsx أو .xls)');
      return;
    }

    try {
      const imported = await importExcelData(file);

      if (importMode === 'products') {
        if (imported.products.length === 0) {
          setImportError('لم يتم العثور على أي منتجات صالحة داخل شيت المنتجات.');
          return;
        }

        onImportProducts(imported.products);
        setImportSuccess(`تهانينا! تم استيراد ودمج ${imported.products.length} منتجاً بنجاح في المخزن.`);
      } else if (importMode === 'customers') {
        if (imported.customers.length === 0) {
          setImportError('لم يتم العثور على أي عملاء صالحين داخل شيت العملاء.');
          return;
        }

        onImportCustomers(imported.customers);
        setImportSuccess(`تم استيراد ${imported.customers.length} عميلًا بنجاح.`);
      } else if (importMode === 'expiry') {
        if (imported.expiryProducts.length === 0 && imported.expiryCustomers.length === 0) {
          setImportError('لم يتم العثور على أي بيانات صلاحية صالحة في الملف. يرجى التحقق من أسماء الشيت والمحتوى.');
          return;
        }

        onImportExpiry({
          products: imported.expiryProducts,
          customers: imported.expiryCustomers
        });

        const messages: string[] = [];
        if (imported.expiryProducts.length > 0) {
          messages.push(`تحديث صلاحية ${imported.expiryProducts.length} منتج`);
        }
        if (imported.expiryCustomers.length > 0) {
          messages.push(`تحديث اكسبير ${imported.expiryCustomers.length} عميل`);
        }

        setImportSuccess(`تم الاستيراد بنجاح: ${messages.join(' و ')}.`);
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setImportError(err || 'فشل تحليل شيت الإكسيل. يرجى التأكد من تطابق الأعمدة مع النموذج.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="excel-hub" dir="rtl">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl font-bold text-slate-900">بوابة تكامل ملفات الإكسيل (Excel)</h1>
        <p className="text-xs text-slate-500 mt-1">إدارة تصدير واستيراد المخزن والعملاء وسجلات الصلاحية من داخل صفحة الإكسيل.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-2 bg-slate-900 text-white rounded-md w-fit">
              <FileSpreadsheet size={18} />
            </div>
            <h2 className="text-sm font-bold text-slate-900">خيارات التصدير</h2>
            <p className="text-xs text-slate-550 leading-relaxed">
              يمكنك تصدير الملف الكامل أو تصدير بيانات محددة للمخزن والعملاء وبيانات صلاحية المخزون والعملاء.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                onClick={handleExportFull}
                className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs transition-all"
              >
                تصدير الملف الكامل
              </button>
              <button
                onClick={handleExportProducts}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-semibold text-xs transition-all border border-slate-200"
              >
                تصدير بيانات المخزن
              </button>
              <button
                onClick={handleExportCustomerPriceList}
                className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-all"
              >
                تصدير قائمة الأسعار للعملاء
              </button>
              <button
                onClick={handleExportCustomers}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-semibold text-xs transition-all border border-slate-200"
              >
                تصدير بيانات العملاء
              </button>
              <button
                onClick={handleExportExpiry}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-semibold text-xs transition-all border border-slate-200"
              >
                تصدير بيانات الاكسبير
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-900">المحتوى المصدّر:</div>
            <div>• الملف الكامل يحتوي على صفحات خاصة بالمبيعات والمنتجات والعملاء.</div>
            <div>• صفحة المنتجات تتضمن الكمية وسعر الشراء وسعر البيع وحد التنبيه.</div>
            <div>• قائمة الأسعار الخاصة بالعملاء تتضمن كود الصنف واسم الصنف وسعر البيع فقط للإرسال المباشر.</div>
            <div>• صفحة العملاء تتضمن بيانات الاتصال والرصيد وبيانات الاكسبير.</div>
            <div>• صفحة صلاحية المنتجات لتحديث تواريخ الانتهاء مباشرة.</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-2 bg-slate-900 text-white rounded-md w-fit">
              <Upload size={18} />
            </div>
            <h2 className="text-sm font-bold text-slate-900">خيارات الاستيراد</h2>
            <p className="text-xs text-slate-550 leading-relaxed">
              اختر نوع البيانات التي تريد استيرادها ثم قم برفع ملف الإكسيل المطلوب.</p>

            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(importModeLabels) as ImportMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setImportMode(mode)}
                  className={`text-[11px] py-2 rounded-xl font-semibold transition-all ${
                    importMode === mode
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {importModeLabels[mode]}
                </button>
              ))}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
              {importModeDescriptions[importMode]}
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <Upload size={20} className="mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-800">اسحب شيت الإكسيل هنا أو اضغط للتصفح</p>
              <p className="text-[10px] text-slate-400 mt-1">يدعم صيغ xlsx, xls فقط</p>
            </div>

            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>{importError}</span>
              </div>
            )}
            {importSuccess && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                <Check size={14} className="shrink-0 text-slate-900" />
                <span>{importSuccess}</span>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 mt-3 text-center flex items-center justify-center gap-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Info size={12} className="text-slate-400" />
            <span>الملاحظات: احرص على أن تتطابق أسماء الشيت مع التعليمات المُعروضة أعلاه.</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
          <BookOpen size={15} className="text-slate-900" />
          <span>خطوات تشغيل برنامج المبيعات بكفاءة تامة على جوالك</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
          <div className="space-y-2 p-4 bg-slate-50/50 rounded-lg border border-slate-200">
            <div className="w-6 h-6 rounded bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">١</div>
            <h3 className="font-bold text-slate-900 text-xs">تنزيل وتثبيت التطبيق على الموبايل</h3>
            <p className="text-slate-500 text-[11px]">
              قم بتحميل تطبيق <b>Microsoft Excel</b> الرسمي للـ Android أو الـ iPhone مجاناً من متجر التطبيقات لضمان دعم المعادلات العربية والتنسيقات.
            </p>
          </div>

          <div className="space-y-2 p-4 bg-slate-50/50 rounded-lg border border-slate-200">
            <div className="w-6 h-6 rounded bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">٢</div>
            <h3 className="font-bold text-slate-900 text-xs">تنزيل الملف المحسّن للموبايل</h3>
            <p className="text-slate-500 text-[11px]">
              اضغط على زر <b>تصدير الملف الكامل</b> أو اختر التصدير الخاص بالبيانات المطلوبة وافتح الملف مباشرة داخل تطبيق إكسيل الموبايل.
            </p>
          </div>

          <div className="space-y-2 p-4 bg-slate-50/50 rounded-lg border border-slate-200">
            <div className="w-6 h-6 rounded bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">٣</div>
            <h3 className="font-bold text-slate-900 text-xs">المزامنة العكسية عبر الاستيراد</h3>
            <p className="text-slate-500 text-[11px]">
              يمكن إعادة رفع ملفات المنتجات أو العملاء أو الاكسبير هنا لتحديث المخزن والسجلات دون الحاجة لإدخال البيانات يدوياً.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
