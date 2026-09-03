import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  PlusCircle, 
  Barcode, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  Plus 
} from 'lucide-react';
import { Product } from '../types';

interface AddProductProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onNavigate: (tab: string) => void;
}

export default function AddProduct({ products, onAddProduct, onNavigate }: AddProductProps) {
  // Form State
  const [formId, setFormId] = useState(`BAR-${Math.floor(100000 + Math.random() * 900000)}`); // prefilled barcode
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('عام');
  const [formBuyPrice, setFormBuyPrice] = useState('');
  const [formSellPrice, setFormSellPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinStockAlert, setFormMinStockAlert] = useState('5');
  const [formDescription, setFormDescription] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const generateNewBarcode = () => {
    setFormId(`BAR-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formId.trim()) return setError('كود المنتج أو الباركود مطلوب');
    if (!formName.trim()) return setError('اسم المنتج مطلوب');
    
    const buy = parseFloat(formBuyPrice);
    const sell = parseFloat(formSellPrice);
    const stock = parseInt(formStock);
    const minAlert = parseInt(formMinStockAlert);

    // Make buyPrice optional, default to 0 if not provided/NaN
    const finalBuy = isNaN(buy) || buy < 0 ? 0 : buy;
    if (isNaN(sell) || sell < 0) return setError('سعر البيع يجب أن يكون رقم أكبر من أو يساوي الصفر');
    if (formBuyPrice && !isNaN(parseFloat(formBuyPrice)) && sell < parseFloat(formBuyPrice)) {
      // Only show this warning if user actually provided buyPrice
      return setError('تنبيه: سعر البيع أقل من سعر الشراء (خسارة!)');
    }
    // Make stock optional, default to 0 if not provided/NaN
    const finalStock = isNaN(stock) || stock < 0 ? 0 : stock;
    if (isNaN(minAlert) || minAlert < 0) return setError('حد الأمان يجب أن يكون رقم صحيح');

    // Check duplicate ID
    if (products.some(p => p.id === formId.trim())) {
      return setError('كود المنتج هذا مسجل مسبقاً لمنتج آخر!');
    }

    const payload: Product = {
      id: formId.trim(),
      name: formName.trim(),
      category: formCategory.trim() || 'عام',
      buyPrice: finalBuy,
      sellPrice: sell,
      stock: finalStock,
      minStockAlert: minAlert,
      description: formDescription.trim(),
      expiryDate: formExpiryDate || undefined,
    };

    onAddProduct(payload);
    setLastAddedProduct(payload);
    setSuccess(true);
  };

  const handleResetForm = () => {
    setFormId(`BAR-${Math.floor(100000 + Math.random() * 900000)}`);
    setFormName('');
    setFormCategory('عام');
    setFormBuyPrice('');
    setFormSellPrice('');
    setFormStock('');
    setFormMinStockAlert('5');
    setFormDescription('');
    setFormExpiryDate('');
    setError('');
    setSuccess(false);
    setLastAddedProduct(null);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="add-product-tab" dir="rtl">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="text-slate-900" size={24} />
            <span>إضافة منتج جديد</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">تسجيل صنف جديد في المخزن وتحديد سعره والحد الأدنى للكميات</p>
        </div>
        <button 
          onClick={() => onNavigate('products')}
          className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-4 py-2 rounded-lg transition-colors text-xs cursor-pointer"
        >
          <Layers size={14} />
          <span>الذهاب للمخزن والمستودع</span>
        </button>
      </div>

      {success ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center max-w-xl mx-auto space-y-6 my-4"
        >
          <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
            <CheckCircle size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">تمت إضافة المنتج بنجاح!</h2>
            <p className="text-xs text-slate-500 mt-1">تم إدراج الصنف الجديد وتحديث قاعدة بيانات المخزن بنجاح.</p>
          </div>

          {lastAddedProduct && (
            <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-4 text-right space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200/40 pb-2">
                <span className="text-slate-500">اسم المنتج:</span>
                <span className="font-bold text-slate-900">{lastAddedProduct.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/40 pb-2">
                <span className="text-slate-500">الباركود / الكود:</span>
                <span className="font-mono font-semibold text-slate-900">{lastAddedProduct.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/40 pb-2">
                <span className="text-slate-500">سعر الشراء / البيع:</span>
                <span className="font-mono text-slate-900">{lastAddedProduct.buyPrice} / {lastAddedProduct.sellPrice} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الكمية الافتتاحية:</span>
                <span className="font-bold text-slate-900">{lastAddedProduct.stock} قطعة</span>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button 
              onClick={handleResetForm}
              className="flex-1 py-2.5 rounded-lg text-white bg-slate-900 hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              <span>إضافة منتج آخر</span>
            </button>
            <button 
              onClick={() => onNavigate('products')}
              className="flex-1 py-2.5 rounded-lg text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
            >
              انتقل لجدول المخزن
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs max-w-2xl mx-auto overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <div className="p-2 bg-slate-900 rounded-md text-white">
              <Barcode size={16} />
            </div>
            <h2 className="text-xs font-bold text-slate-900">تعبئة بيانات الصنف الجديد</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Barcode / ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">كود المنتج / الباركود</label>
                <div className="flex gap-2">
                  <input 
                    ref={barcodeInputRef}
                    autoFocus
                    type="text"
                    required
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="flex-1 text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-mono font-bold"
                    placeholder="أدخل باركود الصنف"
                  />
                  <button
                    type="button"
                    onClick={generateNewBarcode}
                    className="px-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="توليد باركود تلقائي"
                  >
                    توليد عشوائي
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">اسم المنتج</label>
                <input 
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-bold"
                  placeholder="مثال: آيفون 15 برو ماكس"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">القسم / التصنيف</label>
                <input 
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all"
                  placeholder="أجهزة، ملابس، إكسسوارات..."
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">الكمية الافتتاحية الحالية (اختياري)</label>
                <input 
                  type="number"
                  min="0"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-mono"
                  placeholder="0"
                />
              </div>

              {/* Buy Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">سعر الشراء (جنية) (اختياري)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={formBuyPrice}
                  onChange={(e) => setFormBuyPrice(e.target.value)}
                  className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-mono"
                  placeholder="0.00"
                />
              </div>

              {/* Sell Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">سعر البيع الافتراضي (جنية)</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={formSellPrice}
                  onChange={(e) => setFormSellPrice(e.target.value)}
                  className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-mono"
                  placeholder="0.00"
                />
              </div>

              {/* Min Stock Alert */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">حد تنبيه نواقص المخزن</label>
                <input 
                  type="number"
                  required
                  min="0"
                  value={formMinStockAlert}
                  onChange={(e) => setFormMinStockAlert(e.target.value)}
                  className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-mono"
                  placeholder="5"
                />
                <span className="text-[10px] text-slate-400 block mt-1">سينبهك النظام إذا نقص المخزون في المستودع عن هذا الحد</span>
              </div>

              {/* Expiry Date */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">تاريخ انتهاء الصلاحية (اختياري)</label>
                <input 
                  type="date"
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-mono"
                />
                <span className="text-[10px] text-slate-400 block mt-1">اتركه فارغاً إذا كان المنتج ليس له تاريخ انتهاء صلاحية</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">ملاحظات / وصف إضافي (اختياري)</label>
              <textarea 
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all resize-none"
                placeholder="ملاحظات ومواصفات تفصيلية أخرى عن المنتج..."
              />
            </div>

            {/* Profit calculation hint */}
            {formBuyPrice && formSellPrice && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between text-xs text-slate-700">
                <span className="font-semibold">صافي الربح التقديري للقطعة:</span>
                <span className="font-mono font-bold text-slate-900">
                  {Math.max(0, parseFloat(formSellPrice) - parseFloat(formBuyPrice)).toFixed(2)} جنية
                  ({(parseFloat(formBuyPrice) > 0 ? ((parseFloat(formSellPrice) - parseFloat(formBuyPrice)) / parseFloat(formBuyPrice)) * 100 : 0).toFixed(1)}%)
                </span>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={handleResetForm}
                className="px-5 py-2.5 rounded-lg text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                إعادة ضبط الحقول
              </button>
              <button 
                type="submit"
                className="px-6 py-2.5 rounded-lg text-white bg-slate-900 hover:bg-slate-800 font-semibold text-xs transition-colors shadow-xs cursor-pointer active:scale-98"
              >
                تسجيل وحفظ المنتج
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
