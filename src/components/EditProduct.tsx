import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Edit2, 
  Barcode, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  Save 
} from 'lucide-react';
import { Product } from '../types';

interface EditProductProps {
  product: Product;
  onUpdateProduct: (product: Product) => void;
  onNavigate: (tab: string) => void;
}

export default function EditProduct({ product, onUpdateProduct, onNavigate }: EditProductProps) {
  // Form State initialized with the selected product
  const [formId, setFormId] = useState(product.id);
  const [formName, setFormName] = useState(product.name);
  const [formCategory, setFormCategory] = useState(product.category || 'عام');
  const [formBuyPrice, setFormBuyPrice] = useState(product.buyPrice.toString());
  const [formSellPrice, setFormSellPrice] = useState(product.sellPrice.toString());
  const [formStock, setFormStock] = useState(product.stock.toString());
  const [formMinStockAlert, setFormMinStockAlert] = useState(product.minStockAlert.toString());
  const [formDescription, setFormDescription] = useState(product.description || '');
  const [formExpiryDate, setFormExpiryDate] = useState(product.expiryDate || '');

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Sync state if product changes
  useEffect(() => {
    setFormId(product.id);
    setFormName(product.name);
    setFormCategory(product.category || 'عام');
    setFormBuyPrice(product.buyPrice.toString());
    setFormSellPrice(product.sellPrice.toString());
    setFormStock(product.stock.toString());
    setFormMinStockAlert(product.minStockAlert.toString());
    setFormDescription(product.description || '');
    setFormExpiryDate(product.expiryDate || '');
    setError('');
    setSuccess(false);
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
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

    const payload: Product = {
      id: formId,
      name: formName.trim(),
      category: formCategory.trim() || 'عام',
      buyPrice: finalBuy,
      sellPrice: sell,
      stock: finalStock,
      minStockAlert: minAlert,
      description: formDescription.trim(),
      expiryDate: formExpiryDate || undefined,
    };

    onUpdateProduct(payload);
    setSuccess(true);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="edit-product-tab" dir="rtl">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Edit2 className="text-slate-900" size={24} />
            <span>تعديل بيانات الصنف</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">تحديث الأسعار وكميات المخزون وتفاصيل صنف "{product.name}"</p>
        </div>
        <button 
          onClick={() => onNavigate('products')}
          className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-4 py-2 rounded-lg transition-colors text-xs cursor-pointer"
        >
          <Layers size={14} />
          <span>إلغاء والعودة للمخزن</span>
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
            <h2 className="text-base font-bold text-slate-900">تم تعديل المنتج بنجاح!</h2>
            <p className="text-xs text-slate-500 mt-1">تم حفظ التغييرات وتحديث بيانات المنتج في المخزن بنجاح.</p>
          </div>

          <div className="flex gap-4 pt-2">
            <button 
              onClick={() => onNavigate('products')}
              className="flex-1 py-2.5 rounded-lg text-white bg-slate-900 hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              الذهاب للمخزن
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs max-w-2xl mx-auto overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <div className="p-2 bg-slate-900 rounded-md text-white">
              <Barcode size={16} />
            </div>
            <h2 className="text-xs font-bold text-slate-900">تعديل معلومات المنتج (كود: {product.id})</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Barcode / ID (Disabled) */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">كود المنتج / الباركود (غير قابل للتعديل)</label>
                <input 
                  type="text"
                  disabled
                  value={formId}
                  className="w-full text-right bg-slate-100 border border-slate-200 text-slate-450 text-xs px-3 py-2.5 rounded-lg outline-none font-mono font-bold cursor-not-allowed"
                />
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
                  placeholder="أدخل اسم المنتج"
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
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">الكمية الحالية المتوفرة بالمخزن (اختياري)</label>
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
                onClick={() => onNavigate('products')}
                className="px-5 py-2.5 rounded-lg text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                إلغاء والتراجع
              </button>
              <button 
                type="submit"
                className="px-6 py-2.5 rounded-lg text-white bg-slate-900 hover:bg-slate-800 font-semibold text-xs transition-colors shadow-xs cursor-pointer active:scale-98 flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
