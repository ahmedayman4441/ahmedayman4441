import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Undo2, 
  Search, 
  Barcode, 
  User, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Receipt,
  FileText,
  Clock,
  ChevronDown,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { Sale, Product, RefundTransaction, SaleItem } from '../types';

interface ReturnsManagerProps {
  sales: Sale[];
  products: Product[];
  refunds: RefundTransaction[];
  onAddRefund: (refund: RefundTransaction) => void;
  onUpdateRefund: (updatedRefund: RefundTransaction) => void;
  onDeleteRefund: (refundId: string) => void;
  onEditRefund: (refund: RefundTransaction) => void;
}

export default function ReturnsManager({ 
  sales, 
  products, 
  refunds, 
  onAddRefund,
  onUpdateRefund,
  onDeleteRefund,
  onEditRefund
}: ReturnsManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'history'>('create');
  
  // Search state
  const [invoiceSearchId, setInvoiceSearchId] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [searchError, setSearchError] = useState('');

  // Return quantities state (Map of productId -> quantity to return)
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('صنف تالف أو به عيب');
  const [successMessage, setSuccessMessage] = useState('');
  const [processError, setProcessError] = useState('');

  // Editing existing refund (modal) states
  const [editingRefund, setEditingRefund] = useState<RefundTransaction | null>(null);
  const [editingItems, setEditingItems] = useState<RefundTransaction['items']>([]);
  const [editingReason, setEditingReason] = useState('');

  // Handle Invoice Search
  const handleSearchInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSelectedSale(null);
    setReturnQuantities({});
    setSuccessMessage('');
    setProcessError('');

    if (!invoiceSearchId.trim()) {
      return setSearchError('يرجى كتابة رقم الفاتورة للبحث');
    }

    const foundSale = sales.find(s => s.id === invoiceSearchId.trim());
    if (!foundSale) {
      return setSearchError('عذراً، لم نجد أي فاتورة بهذا الرقم في السجلات!');
    }

    if (foundSale.isRefunded) {
      return setSearchError('هذه الفاتورة تم إرجاعها بالكامل مسبقاً!');
    }

    // Initialize return quantities to 0
    const initialQtys: Record<string, number> = {};
    foundSale.items.forEach(item => {
      initialQtys[item.productId] = 0;
    });

    setSelectedSale(foundSale);
    setReturnQuantities(initialQtys);
  };

  // Adjust return quantity
  const handleQtyChange = (productId: string, val: number, maxQty: number) => {
    const qty = Math.max(0, Math.min(maxQty, val));
    setReturnQuantities(prev => ({
      ...prev,
      [productId]: qty
    }));
  };

  // Process the Return
  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessError('');

    if (!selectedSale) return;

    // Filter items where return quantity > 0
    const itemsToReturn = selectedSale.items.map(item => {
      const qtyToReturn = returnQuantities[item.productId] || 0;
      return {
        productId: item.productId,
        productName: item.productName,
        quantity: qtyToReturn,
        sellPrice: item.sellPrice,
        total: qtyToReturn * item.sellPrice
      };
    }).filter(item => item.quantity > 0);

    if (itemsToReturn.length === 0) {
      return setProcessError('يرجى تحديد قطعة واحدة على الأقل لإرجاعها');
    }

    const totalRefundedAmount = itemsToReturn.reduce((sum, item) => sum + item.total, 0);

    const newRefund: RefundTransaction = {
      id: `RET-${Math.floor(100000 + Math.random() * 900000)}`,
      saleId: selectedSale.id,
      date: new Date().toISOString().split('T')[0],
      customerName: selectedSale.customerName || 'عميل نقدي',
      items: itemsToReturn,
      totalRefunded: totalRefundedAmount,
      reason: returnReason
    };

    onAddRefund(newRefund);
    
    setSuccessMessage(`تمت عملية الارتجاع بنجاح برقم: ${newRefund.id}. وتم إعادة المنتجات إلى المخزن.`);
    setSelectedSale(null);
    setReturnQuantities({});
    setInvoiceSearchId('');
  };

  return (
    <div className="space-y-6 animate-fade-in" id="returns-manager-tab" dir="rtl">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Undo2 className="text-slate-900" size={24} />
            <span>نظام المرتجعات والارتجاع المالي</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">معالجة الفواتير المرتجعة، وإعادة حساب مخزون المستودع، وتسجيل تقارير التالف</p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => {
              setActiveSubTab('create');
              setSuccessMessage('');
              setSearchError('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'create' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-550 hover:text-slate-900'
            }`}
          >
            تسجيل مرتجع جديد
          </button>
          <button 
            onClick={() => {
              setActiveSubTab('history');
              setSuccessMessage('');
              setSearchError('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-550 hover:text-slate-900'
            }`}
          >
            سجل حركة المرتجعات ({refunds.length})
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-3 animate-fade-in">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {activeSubTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Right Side: Invoice Search & Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Search size={15} />
                <span>البحث عن الفاتورة</span>
              </h2>

              <form onSubmit={handleSearchInvoice} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">كود الفاتورة / المبيعات</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="مثال: INV-123456"
                      value={invoiceSearchId}
                      onChange={(e) => setInvoiceSearchId(e.target.value)}
                      className="flex-1 text-left bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-mono font-bold"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      ابحث
                    </button>
                  </div>
                </div>

                {searchError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-[10px] font-semibold flex items-center gap-2">
                    <AlertTriangle size={12} className="shrink-0" />
                    <span>{searchError}</span>
                  </div>
                )}
              </form>

              {/* Invoice Quick Summary if selected */}
              {selectedSale && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-xs animate-fade-in">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Receipt size={14} />
                    <span>ملخص الفاتورة النشطة</span>
                  </h3>
                  <div className="space-y-2 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-500">العميل:</span>
                      <span className="font-bold text-slate-900">{selectedSale.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">تاريخ الفاتورة:</span>
                      <span className="text-slate-900 font-mono">{selectedSale.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">إجمالي القيمة:</span>
                      <span className="text-slate-900 font-bold font-mono">{selectedSale.totalAmount.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-[10px]">
                      <span className="text-slate-400">المدفوع / المتبقي:</span>
                      <span className="text-slate-700 font-mono">
                        {selectedSale.paidAmount.toFixed(2)} / {selectedSale.remainingAmount.toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-2xs text-xs space-y-3 leading-relaxed text-slate-600">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="text-amber-500" size={15} />
                <span>شروط وقواعد نظام الارتجاع</span>
              </h3>
              <p>1. لا يمكن ارتجاع كمية أكبر من الكمية الأصلية المباعة في الفاتورة.</p>
              <p>2. عند تأكيد الارتجاع، يقوم النظام تلقائياً بإعادة كميات السلع المرتجعة إلى المخزن ومجموع المنتج مباشرة.</p>
              <p>3. يتم تسجيل قيمة الارتجاع المالي كأرباح مستبعدة لضمان دقة الإحصائيات والأرباح في لوحة التحكم.</p>
            </div>
          </div>

          {/* Left Side: Items selection & Process Return */}
          <div className="lg:col-span-2">
            {selectedSale ? (
              <form onSubmit={handleProcessReturn} className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden space-y-6 p-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-xs font-bold text-slate-950 flex items-center gap-2">
                    <Barcode size={16} />
                    <span>تحديد الأصناف المرتجعة من الفاتورة</span>
                  </h2>
                  <span className="font-mono text-[10px] bg-slate-150 text-slate-700 px-2.5 py-1 rounded-full font-bold">
                    كود: {selectedSale.id}
                  </span>
                </div>

                {processError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <span>{processError}</span>
                  </div>
                )}

                {/* Items list inside invoice */}
                <div className="space-y-4">
                  {selectedSale.items.map(item => {
                    const returnQty = returnQuantities[item.productId] || 0;
                    return (
                      <div key={item.productId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border border-slate-150 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900">{item.productName}</h4>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{item.productId}</span>
                            <span>الكمية المشتراة: <b>{item.quantity}</b></span>
                            <span>سعر البيع: <b>{item.sellPrice.toFixed(2)} ج.م</b></span>
                          </div>
                        </div>

                        {/* Return Qty inputs */}
                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white p-1">
                            <button 
                              type="button"
                              onClick={() => handleQtyChange(item.productId, returnQty - 1, item.quantity)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded text-slate-500 font-bold transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <input 
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={returnQty}
                              onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value) || 0, item.quantity)}
                              className="w-12 text-center text-xs font-mono font-bold text-slate-900 outline-none bg-transparent"
                            />
                            <button 
                              type="button"
                              onClick={() => handleQtyChange(item.productId, returnQty + 1, item.quantity)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded text-slate-500 font-bold transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-left min-w-[80px]">
                            <span className="text-[10px] block text-slate-400">قيمة المرتجع</span>
                            <span className="text-xs font-bold font-mono text-rose-600">{(returnQty * item.sellPrice).toFixed(2)} ج.م</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Return Settings / Reason */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">سبب إرجاع البضاعة</label>
                    <select 
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all cursor-pointer font-semibold text-slate-700"
                    >
                      <option value="صنف تالف أو به عيب">صنف تالف أو به عيب مصنعي</option>
                      <option value="تغيير رأي العميل">تغيير رأي العميل (بضاعة سليمة)</option>
                      <option value="خطأ في تسجيل الصنف">خطأ في تسجيل الصنف بالبائع</option>
                      <option value="انتهاء تاريخ الصلاحية">انتهاء تاريخ الصلاحية</option>
                      <option value="أخرى">أسباب أخرى تفصيلية</option>
                    </select>
                  </div>

                  {/* Summary of Return refund */}
                  <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between text-xs border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px]">إجمالي الارتجاع المالي</span>
                      <span className="text-slate-900 font-bold">سيعاد نقداً للعميل</span>
                    </div>
                    <span className="font-mono font-black text-base text-rose-600">
                      {Object.keys(returnQuantities).reduce((sum, pId) => {
                        const item = selectedSale.items.find(i => i.productId === pId);
                        return sum + (item ? (returnQuantities[pId] || 0) * item.sellPrice : 0);
                      }, 0).toFixed(2)} ج.م
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setSelectedSale(null)}
                    className="px-5 py-2.5 rounded-lg text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    إلغاء وتراجع
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 rounded-lg text-white bg-slate-900 hover:bg-slate-800 font-semibold text-xs transition-colors shadow-xs cursor-pointer active:scale-98 flex items-center gap-2"
                  >
                    <Undo2 size={14} />
                    <span>تأكيد الارتجاع وإرجاع للمخزن</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 font-semibold space-y-4">
                <div className="mx-auto w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center border border-slate-100">
                  <Receipt size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">لا توجد فاتورة نشطة محددة</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    يرجى إدخال رقم الفاتورة والبحث عنها من لوحة البحث الجانبية للبدء في إجراءات ارتجاع السلع.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* History log of returns */
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-4 px-4 text-right">رقم المرتجع</th>
                  <th className="py-4 px-4 text-right">الفاتورة الأصلية</th>
                  <th className="py-4 px-4 text-right">اسم العميل</th>
                  <th className="py-4 px-4 text-right">المنتجات المسترجعة</th>
                  <th className="py-4 px-4 text-center">الارتجاع المالي</th>
                  <th className="py-4 px-4 text-right">سبب الارتجاع</th>
                  <th className="py-4 px-4 text-center">تاريخ الارتجاع</th>
                  <th className="py-4 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                      لا يوجد أي عمليات مرتجعات مسجلة مسبقاً في النظام.
                    </td>
                  </tr>
                ) : (
                  refunds.map(ref => (
                    <tr key={ref.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-rose-600">{ref.id}</td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-700">{ref.saleId}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">{ref.customerName}</td>
                      <td className="py-4 px-4 text-slate-800 max-w-[200px]">
                        <div className="space-y-1">
                          {ref.items.map((item, index) => (
                            <div key={index} className="text-[11px]">
                              - {item.productName} <span className="font-mono text-slate-500">(عدد {item.quantity})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-rose-600 font-mono">
                        {ref.totalRefunded.toFixed(2)} ج.م
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{ref.reason}</td>
                      <td className="py-4 px-4 text-center font-mono text-slate-500">{ref.date}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                {/* Edit Button */}
                <button 
                  onClick={() => onEditRefund(ref)}
                  className="p-1.5 text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="تعديل"
                >
                  <Edit size={13} />
                </button>
                          {/* Delete Button */}
                          <button 
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذه العملية المرتجعة؟')) {
                                onDeleteRefund(ref.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Refund Modal */}
      <AnimatePresence>
        {editingRefund && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white rounded-xl w-full max-w-2xl border border-slate-200 shadow-xl overflow-hidden relative my-8 text-right p-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-900 rounded-lg text-white">
                    <Edit size={14} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">تعديل عملية المرتجع</h3>
                </div>
                <button 
                  onClick={() => setEditingRefund(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  // Calculate new total refunded
                  const newTotal = editingItems.reduce((sum, item) => sum + item.total, 0);
                  onUpdateRefund({
                    ...editingRefund,
                    reason: editingReason,
                    items: editingItems,
                    totalRefunded: newTotal
                  });
                  setEditingRefund(null);
                  setSuccessMessage('تم تحديث عملية المرتجع بنجاح!');
                  // Clear success after a bit
                  setTimeout(() => setSuccessMessage(''), 3000);
                }} 
                className="space-y-4"
              >
                {/* Reason field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">سبب الارتجاع</label>
                  <select 
                    value={editingReason}
                    onChange={(e) => setEditingReason(e.target.value)}
                    className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all cursor-pointer font-semibold text-slate-700"
                  >
                    <option value="صنف تالف أو به عيب">صنف تالف أو به عيب مصنعي</option>
                    <option value="تغيير رأي العميل">تغيير رأي العميل (بضاعة سليمة)</option>
                    <option value="خطأ في تسجيل الصنف">خطأ في تسجيل الصنف بالبائع</option>
                    <option value="انتهاء تاريخ الصلاحية">انتهاء تاريخ الصلاحية</option>
                    <option value="أخرى">أسباب أخرى تفصيلية</option>
                  </select>
                </div>

                {/* Items list (editable quantities) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">المنتجات المسترجعة</label>
                  <div className="space-y-2">
                    {editingItems.map((item, index) => {
                      return (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{item.productName}</h4>
                            <div className="text-[10px] text-slate-500">
                              سعر البيع: {item.sellPrice.toFixed(2)} ج.م
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-slate-200 rounded-lg bg-white p-1">
                              <button 
                                type="button"
                                onClick={() => {
                                  const newItems = [...editingItems];
                                  const newQty = Math.max(1, newItems[index].quantity - 1);
                                  newItems[index] = {
                                    ...newItems[index],
                                    quantity: newQty,
                                    total: newQty * newItems[index].sellPrice
                                  };
                                  setEditingItems(newItems);
                                }}
                                className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded text-slate-500 font-bold transition-colors cursor-pointer"
                              >
                                -
                              </button>
                              <input 
                                type="number"
                                min={1}
                                value={editingItems[index].quantity}
                                onChange={(e) => {
                                  const newItems = [...editingItems];
                                  const qty = Math.max(1, parseInt(e.target.value) || 1);
                                  newItems[index] = {
                                    ...newItems[index],
                                    quantity: qty,
                                    total: qty * newItems[index].sellPrice
                                  };
                                  setEditingItems(newItems);
                                }}
                                className="w-12 text-center text-xs font-mono font-bold text-slate-900 outline-none bg-transparent"
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  const newItems = [...editingItems];
                                  const newQty = newItems[index].quantity + 1;
                                  newItems[index] = {
                                    ...newItems[index],
                                    quantity: newQty,
                                    total: newQty * newItems[index].sellPrice
                                  };
                                  setEditingItems(newItems);
                                }}
                                className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded text-slate-500 font-bold transition-colors cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <div className="text-left min-w-[80px]">
                              <span className="text-[10px] block text-slate-400">الإجمالي</span>
                              <span className="text-xs font-bold font-mono text-rose-600">{editingItems[index].total.toFixed(2)} ج.م</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-slate-500">إجمالي الارتجاع المالي بعد التعديل:</span>
                  <span className="text-lg font-mono font-bold text-rose-600">
                    {editingItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)} ج.م
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditingRefund(null)}
                    className="flex-1 py-2 rounded-lg text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    تراجع وإلغاء
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 rounded-lg text-white bg-slate-900 hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>حفظ التعديلات</span>
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
