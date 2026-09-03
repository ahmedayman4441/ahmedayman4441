import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Layers, 
  Barcode, 
  TrendingUp, 
  X, 
  Filter, 
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { Product } from '../types';

interface ProductManagerProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onNavigate?: (tab: string) => void;
  onEditProduct?: (product: Product) => void;
}

export default function ProductManager({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onNavigate,
  onEditProduct
}: ProductManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  
  // Sort State
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'sellPrice' | 'id'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formBuyPrice, setFormBuyPrice] = useState('');
  const [formSellPrice, setFormSellPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinStockAlert, setFormMinStockAlert] = useState('5');
  const [formDescription, setFormDescription] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isModalOpen) {
      barcodeInputRef.current?.focus();
    }
  }, [isModalOpen]);

  // Form Error state
  const [error, setError] = useState('');

  // Categories list
  const categories = ['الكل', ...Array.from(new Set(products.map(p => p.category || 'عام')))];

  const handleOpenAddModal = () => {
    setError('');
    setEditingProduct(null);
    setFormId(`BAR-${Math.floor(100000 + Math.random() * 900000)}`); // prefilled barcode
    setFormName('');
    setFormCategory('عام');
    setFormBuyPrice('');
    setFormSellPrice('');
    setFormStock('');
    setFormMinStockAlert('5');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setError('');
    setEditingProduct(product);
    setFormId(product.id);
    setFormName(product.name);
    setFormCategory(product.category || 'عام');
    setFormBuyPrice(product.buyPrice.toString());
    setFormSellPrice(product.sellPrice.toString());
    setFormStock(product.stock.toString());
    setFormMinStockAlert(product.minStockAlert.toString());
    setFormDescription(product.description || '');
    setIsModalOpen(true);
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

    if (isNaN(buy) || buy < 0) return setError('سعر الشراء يجب أن يكون رقم أكبر من أو يساوي الصفر');
    if (isNaN(sell) || sell < 0) return setError('سعر البيع يجب أن يكون رقم أكبر من أو يساوي الصفر');
    if (sell < buy) return setError('تنبيه: سعر البيع أقل من سعر الشراء (خسارة!)');
    if (isNaN(stock) || stock < 0) return setError('الكمية يجب أن تكون رقم صحيح أكبر من أو يساوي الصفر');
    if (isNaN(minAlert) || minAlert < 0) return setError('حد الأمان يجب أن يكون رقم صحيح');

    // Check duplicate ID (only for new products)
    if (!editingProduct && products.some(p => p.id === formId)) {
      return setError('كود المنتج هذا مسجل مسبقاً لمنتج آخر!');
    }

    const payload: Product = {
      id: formId.trim(),
      name: formName.trim(),
      category: formCategory.trim() || 'عام',
      buyPrice: buy,
      sellPrice: sell,
      stock: stock,
      minStockAlert: minAlert,
      description: formDescription.trim(),
    };

    if (editingProduct) {
      onUpdateProduct(payload);
    } else {
      onAddProduct(payload);
    }

    setIsModalOpen(false);
  };

  const handleSort = (field: 'name' | 'stock' | 'sellPrice' | 'id') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filtered and Sorted products
  const filteredProducts = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'ar');
      } else if (sortBy === 'stock') {
        comparison = a.stock - b.stock;
      } else if (sortBy === 'sellPrice') {
        comparison = a.sellPrice - b.sellPrice;
      } else if (sortBy === 'id') {
        comparison = a.id.localeCompare(b.id);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="space-y-8 animate-fade-in" id="products-tab" dir="rtl">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">مخزن وقائمة المنتجات</h1>
          <p className="text-xs text-slate-500 mt-1">تعديل الأسعار وتحديث كميات البضائع ومتابعة نسب الأرباح المتوقعة</p>
        </div>
        <button 
          onClick={() => {
            if (onNavigate) {
              onNavigate('add-product');
            } else {
              handleOpenAddModal();
            }
          }}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-xs active:scale-98 cursor-pointer"
        >
          <Plus size={15} />
          <span>إضافة منتج جديد للمخزن</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 right-3 flex items-center text-slate-450">
            <Search size={15} />
          </span>
          <input 
            type="text"
            placeholder="ابحث باسم المنتج، الكود أو التصنيف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-10 py-2.5 rounded-lg outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 shrink-0">تصنيف القسم:</span>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-slate-900 focus:bg-white cursor-pointer"
          >
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Short Summary Stats */}
        <div className="flex items-center justify-end gap-3 text-xs text-slate-600 font-semibold bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
          <span>عدد الأصناف المطابقة:</span>
          <span className="text-slate-900 font-bold font-mono text-sm">{filteredProducts.length}</span>
        </div>
      </div>

      {/* Products Table (Desktop) / Mobile List Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Mobile Grid Layout for mobile screens */}
        <div className="block lg:hidden divide-y divide-slate-150">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <div key={p.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block text-[10px] font-bold text-slate-650 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded mb-1 font-mono">
                      {p.id}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                    <p className="text-xs text-slate-400">القسم: {p.category}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => onEditProduct?.(p)}
                      className="p-2 text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={() => onDeleteProduct(p.id)}
                      className="p-2 text-rose-700 bg-rose-50 border border-rose-100 rounded-md hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 border border-slate-200/50 p-2 rounded-md">
                    <span className="block text-[9px] text-slate-400">سعر الشراء</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">{p.buyPrice} ج.م</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/50 p-2 rounded-md">
                    <span className="block text-[9px] text-slate-500 font-semibold">سعر البيع</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">{p.sellPrice} ج.م</span>
                  </div>
                  <div className={`p-2 rounded-md border ${p.stock <= p.minStockAlert ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-800 animate-available-pulse'}`}>
                    <span className={`block text-[10px] font-semibold ${p.stock <= p.minStockAlert ? 'text-amber-900' : 'text-emerald-800'}`}>
                      {p.stock <= p.minStockAlert ? 'مخزون منخفض' : 'متوفر'}
                    </span>
                    <span className="block text-[9px] text-slate-450">الكمية</span>
                    <span className="text-xs font-bold font-mono flex items-center justify-center gap-0.5">
                      {p.stock}
                      {p.stock <= p.minStockAlert && <AlertTriangle size={10} className="text-amber-600 inline" />}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">هامش الربح المتوقع:</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    +{p.sellPrice - p.buyPrice} ج.م ({(p.buyPrice > 0 ? ((p.sellPrice - p.buyPrice) / p.buyPrice) * 100 : 0).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              لا توجد منتجات مطابقة لعملية البحث الحالية.
            </div>
          )}
        </div>

        {/* Desktop Table view */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 bg-slate-50/50">
                <th className="py-3 px-4 font-bold cursor-pointer select-none" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">
                    <span>كود المنتج / الباركود</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>
                <th className="py-3 font-bold cursor-pointer select-none" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>اسم الصنف</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>
                <th className="py-3 font-bold">التصنيف</th>
                <th className="py-3 font-bold text-left">سعر الشراء</th>
                <th className="py-3 font-bold text-left cursor-pointer select-none" onClick={() => handleSort('sellPrice')}>
                  <div className="flex items-center gap-1 justify-end">
                    <span>سعر البيع</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>
                <th className="py-3 font-bold text-left cursor-pointer select-none" onClick={() => handleSort('stock')}>
                  <div className="flex items-center gap-1 justify-end">
                    <span>المخزون الحالي</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>
                <th className="py-3 font-bold text-left">صافي الربح للمنتج</th>
                <th className="py-3 px-4 font-bold text-center">خيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const profit = p.sellPrice - p.buyPrice;
                  const profitPercent = p.buyPrice > 0 ? (profit / p.buyPrice) * 100 : 0;
                  const isLow = p.stock <= p.minStockAlert;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-slate-550">{p.id}</td>
                      <td className="py-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        {p.description && <div className="text-[10px] text-slate-400 mt-0.5 font-normal">{p.description}</div>}
                      </td>
                      <td className="py-4">
                        <span className="inline-block bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {p.category || 'عام'}
                        </span>
                      </td>
                      <td className="py-4 text-left font-mono font-medium text-slate-500">{p.buyPrice.toFixed(2)} ج.م</td>
                      <td className="py-4 text-left font-mono font-bold text-slate-900">{p.sellPrice.toFixed(2)} ج.م</td>
                      <td className="py-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${isLow ? 'text-amber-800 bg-amber-50 border border-amber-200' : 'text-emerald-800 bg-emerald-50 border border-emerald-200 animate-available-pulse'}`}>
                            {isLow ? 'مخزون منخفض' : 'متوفر'}
                          </span>
                          <span className={`font-mono font-bold ${isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                            {p.stock}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-left">
                        <div className="font-mono font-bold text-emerald-700">+{profit.toFixed(2)} ج.م</div>
                        <div className="font-mono text-[9px] text-slate-400">نسبة: {profitPercent.toFixed(1)}%</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => onEditProduct?.(p)}
                            className="p-1.5 text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="تعديل المنتج"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                            title="حذف المنتج"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                    لا توجد منتجات مسجلة بالمخزن تطابق الفلترة الحالية. اضغط على "إضافة منتج جديد" للبدء.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Add / Edit Product */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white rounded-xl w-full max-w-lg border border-slate-200 shadow-xl overflow-hidden relative my-8 animate-fade-in"
            >
              {/* Modal Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-900 rounded-md text-white">
                    <Barcode size={16} />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {editingProduct ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد للمخزن'}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-semibold">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Barcode / ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">كود المنتج / الباركود</label>
                    <input 
                      ref={barcodeInputRef}
                      type="text"
                      required
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      disabled={!!editingProduct} // Cannot edit barcode
                      className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-mono font-bold disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="أدخل باركود الصنف"
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">الكمية الافتتاحية الحالية</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-mono"
                      placeholder="0"
                    />
                  </div>

                  {/* Buy Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">سعر الشراء (جنية)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
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
                  <div>
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
                    <span className="text-[10px] text-slate-400 block mt-1">سينبهك النظام إذا نقص المخزون عن هذا الحد</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">ملاحظات / وصف إضافي (اختياري)</label>
                  <textarea 
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all resize-none"
                    placeholder="ملاحظات تفصيلية..."
                  />
                </div>

                {/* Profit calculation hint */}
                {formBuyPrice && formSellPrice && (
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between text-xs text-slate-700">
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
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-semibold text-xs transition-colors"
                  >
                    إلغاء التغييرات
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 rounded-lg text-white bg-slate-900 hover:bg-slate-800 font-semibold text-xs active:scale-98 transition-colors"
                  >
                    {editingProduct ? 'حفظ التحديثات' : 'إضافة المنتج الجديد'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
