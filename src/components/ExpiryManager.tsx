import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Search, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Clock,
  X,
  Save,
  Undo2,
  ShoppingBag,
  User
} from 'lucide-react';
import { Product, Customer } from '../types';

interface ExpiryManagerProps {
  products: Product[];
  customers: Customer[];
  onUpdateProduct: (product: Product) => void;
  onNavigate: (tab: string) => void;
}

export default function ExpiryManager({ 
  products, 
  customers,
  onUpdateProduct, 
  onNavigate
}: ExpiryManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expired' | 'expiring_soon' | 'valid'>('all');
  
  // Expiry edit states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper to calculate days remaining
  const getExpiryDetails = (dateStr?: string) => {
    if (!dateStr) return { status: 'none', days: 0, text: 'لا يوجد تاريخ انتهاء' };

    const expDate = new Date(dateStr);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        status: 'expired', 
        days: diffDays, 
        text: `منتهي الصلاحية منذ ${Math.abs(diffDays)} يوم` 
      };
    } else if (diffDays === 0) {
      return { 
        status: 'expired', 
        days: 0, 
        text: 'ينتهي اليوم!' 
      };
    } else if (diffDays <= 30) {
      return { 
        status: 'expiring_soon', 
        days: diffDays, 
        text: `ينتهي خلال ${diffDays} يوم` 
      };
    } else {
      return { 
        status: 'valid', 
        days: diffDays, 
        text: `صالح لـ ${diffDays} يوم` 
      };
    }
  };

  // Products with expiry information
  const productsWithExpiry = products.filter(p => p.expiryDate);

  // Filter logic
  const filteredProducts = productsWithExpiry.filter(p => {
    // Search filter
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.includes(searchTerm);
    if (!matchesSearch) return false;

    // Status filter
    const details = getExpiryDetails(p.expiryDate);
    if (filterType === 'expired') return details.status === 'expired';
    if (filterType === 'expiring_soon') return details.status === 'expiring_soon';
    if (filterType === 'valid') return details.status === 'valid';
    
    return true;
  });

  // Global counts
  const expiredCount = productsWithExpiry.filter(p => getExpiryDetails(p.expiryDate).status === 'expired').length;
  const expiringSoonCount = productsWithExpiry.filter(p => getExpiryDetails(p.expiryDate).status === 'expiring_soon').length;
  const validCount = productsWithExpiry.filter(p => getExpiryDetails(p.expiryDate).status === 'valid').length;
  const customersWithExpiry = customers.filter(c => (c.expiryBalance || 0) > 0);

  const handleEditExpiryClick = (p: Product) => {
    setEditingProduct(p);
    setNewExpiryDate(p.expiryDate || '');
  };

  const handleSaveExpiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updated: Product = {
      ...editingProduct,
      expiryDate: newExpiryDate || undefined
    };

    onUpdateProduct(updated);
    setEditingProduct(null);
  };

  // Discard expired stock handler
  const handleDiscardStock = (p: Product) => {
    if (confirm(`هل أنت متأكد من رغبتك في إعدام (تصفير كمية) الصنف المنتهي الصلاحية "${p.name}"؟`)) {
      const updated: Product = {
        ...p,
        stock: 0
      };
      onUpdateProduct(updated);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="expiry-manager-tab" dir="rtl">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="text-slate-900" size={24} />
            <span>نظام مراقبة صلاحية المنتجات</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">تتبع تواريخ الانتهاء للأصناف الغذائية أو التجميلية وتجنب تلف البضائع</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={() => onNavigate('expiry_customer')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl border border-indigo-700 shadow-xs transition-all text-xs font-semibold cursor-pointer"
          >
            <User size={16} />
            <span>عرض اكسبير العملاء</span>
          </button>
          <button 
            onClick={() => onNavigate('expired-return')}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl border border-rose-700 shadow-xs transition-all text-xs font-semibold cursor-pointer"
          >
            <Undo2 size={16} />
            <span>تسجيل إكسير مرتجع من العميل</span>
          </button>
        </div>
      </div>



      {/* Expiry Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {/* Total with Expiry */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold text-slate-400 block">منتجات مسجل لها صلاحية</span>
            <span className="text-xl font-bold text-slate-900">{productsWithExpiry.length}</span>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg">
            <ShoppingBag size={18} />
          </div>
        </div>

        {/* Expired Status */}
        <button 
          onClick={() => setFilterType('expired')}
          className={`text-right p-4 rounded-xl flex items-center justify-between transition-all border ${
            filterType === 'expired' 
              ? 'bg-rose-50/80 border-rose-200 ring-2 ring-rose-500/20' 
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          } cursor-pointer`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-rose-500 block">أصناف منتهية الصلاحية</span>
            <span className="text-xl font-bold text-rose-700">{expiredCount}</span>
          </div>
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg border border-rose-200 animate-pulse">
            <AlertOctagon size={18} />
          </div>
        </button>

        {/* Expiring soon Status */}
        <button 
          onClick={() => setFilterType('expiring_soon')}
          className={`text-right p-4 rounded-xl flex items-center justify-between transition-all border ${
            filterType === 'expiring_soon' 
              ? 'bg-amber-50/80 border-amber-200 ring-2 ring-amber-500/20' 
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          } cursor-pointer`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-500 block">أصناف تقترب من الانتهاء (30 يوم)</span>
            <span className="text-xl font-bold text-amber-700">{expiringSoonCount}</span>
          </div>
          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg border border-amber-200">
            <AlertTriangle size={18} />
          </div>
        </button>

        {/* Safe Expiry */}
        <button 
          onClick={() => setFilterType('valid')}
          className={`text-right p-4 rounded-xl flex items-center justify-between transition-all border ${
            filterType === 'valid' 
              ? 'bg-emerald-50/80 border-emerald-200 ring-2 ring-emerald-500/20' 
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          } cursor-pointer`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-500 block">أصناف صالحة وآمنة</span>
            <span className="text-xl font-bold text-emerald-700">{validCount}</span>
          </div>
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200">
            <CheckCircle2 size={18} />
          </div>
        </button>

        <button 
          onClick={() => onNavigate('expiry_customer')}
          className="text-right p-4 rounded-xl flex items-center justify-between transition-all border bg-slate-50 hover:bg-slate-100 border-slate-200 shadow-2xs cursor-pointer"
        >
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold text-slate-400 block">عملاء لديهم اكسبير مسجل</span>
            <span className="text-xl font-bold text-indigo-700">{customersWithExpiry.length}</span>
          </div>
          <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200">
            <User size={18} />
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-1/2">
          <input 
            type="text"
            placeholder="ابحث بالاسم أو الباركود للأصناف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs pl-4 pr-10 py-2.5 rounded-lg outline-none transition-all"
          />
          <div className="absolute right-3 top-3 text-slate-400">
            <Search size={14} />
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setFilterType('all')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              filterType === 'all' 
                ? 'bg-slate-900 border-slate-900 text-white' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-650'
            }`}
          >
            عرض الكل ({productsWithExpiry.length})
          </button>
          <button 
            onClick={() => setFilterType('expired')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              filterType === 'expired' 
                ? 'bg-rose-600 border-rose-600 text-white' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-rose-600'
            }`}
          >
            منتهية الصلاحية ({expiredCount})
          </button>
          <button 
            onClick={() => setFilterType('expiring_soon')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              filterType === 'expiring_soon' 
                ? 'bg-amber-500 border-amber-500 text-white' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-amber-600'
            }`}
          >
            قاربت على الانتهاء ({expiringSoonCount})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-4 px-4 text-right">كود المنتج</th>
                <th className="py-4 px-4 text-right">اسم الصنف</th>
                <th className="py-4 px-4 text-right">القسم</th>
                <th className="py-4 px-4 text-center">الكمية المتوفرة حالياً</th>
                <th className="py-4 px-4 text-center">تاريخ انتهاء الصلاحية</th>
                <th className="py-4 px-4 text-center">حالة الصلاحية</th>
                <th className="py-4 px-4 text-center">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                    {productsWithExpiry.length === 0 
                      ? "لا يوجد أي أصناف مسجل لها تواريخ انتهاء صلاحية حالياً. لتفعيل هذا الخيار، أضف تاريخ انتهاء صلاحية للمنتج عند تسجيله أو تعديله."
                      : "لا يوجد نتائج تطابق عوامل الفلترة أو البحث."
                    }
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const details = getExpiryDetails(p.expiryDate);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">{p.id}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">{p.name}</td>
                      <td className="py-4 px-4 text-slate-500">{p.category}</td>
                      <td className="py-4 px-4 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded ${p.stock === 0 ? 'bg-slate-100 text-slate-450' : 'bg-slate-50 text-slate-800'}`}>
                          {p.stock} قطعة
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-semibold text-slate-900">{p.expiryDate}</td>
                      <td className="py-4 px-4 text-center font-semibold">
                        {details.status === 'expired' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                            <span>{details.text}</span>
                          </span>
                        )}
                        {details.status === 'expiring_soon' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>{details.text}</span>
                          </span>
                        )}
                        {details.status === 'valid' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{details.text}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => handleEditExpiryClick(p)}
                            className="p-1.5 text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="تعديل تاريخ الصلاحية"
                          >
                            <Clock size={13} />
                          </button>
                          {details.status === 'expired' && p.stock > 0 && (
                            <button 
                              onClick={() => handleDiscardStock(p)}
                              className="p-1.5 text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                              title="إعدام المخزون التالف"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Expiry Modal */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white rounded-xl w-full max-w-md border border-slate-200 shadow-xl overflow-hidden relative my-8 text-right p-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-900 rounded-lg text-white">
                    <Calendar size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">تعديل صلاحية المنتج</h3>
                </div>
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveExpiry} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">اسم المنتج</label>
                  <input 
                    type="text"
                    disabled
                    value={editingProduct.name}
                    className="w-full text-right bg-slate-100 border border-slate-200 text-slate-500 text-xs px-3 py-2.5 rounded-lg outline-none font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">كود الباركود</label>
                  <input 
                    type="text"
                    disabled
                    value={editingProduct.id}
                    className="w-full text-left bg-slate-100 border border-slate-200 text-slate-500 text-xs px-3 py-2.5 rounded-lg outline-none font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">تاريخ انتهاء الصلاحية الجديد</label>
                  <input 
                    type="date"
                    required
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-mono font-bold"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 py-2 rounded-lg text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    تراجع وإلغاء
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 rounded-lg text-white bg-slate-900 hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>حفظ التعديل</span>
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
