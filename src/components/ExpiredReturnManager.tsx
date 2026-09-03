import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User,
  Receipt,
  Undo2,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  Package,
  Calculator
} from 'lucide-react';
import { Product, Sale, Customer, RefundTransaction } from '../types';

interface ExpiredReturnManagerProps {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  onAddRefund: (refund: RefundTransaction) => void;
  onUpdateCustomer: (updatedCustomer: Customer) => void;
  onNavigate: (tab: string) => void;
}

export default function ExpiredReturnManager({ 
  products,
  customers,
  sales,
  onAddRefund,
  onUpdateCustomer,
  onNavigate
}: ExpiredReturnManagerProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [returnQuantity, setReturnQuantity] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processError, setProcessError] = useState('');

  const customerSales = selectedCustomer 
    ? sales.filter(s => 
        (s.customerName === selectedCustomer.name || s.customerCode === selectedCustomer.id) && 
        !s.isRefunded
      ) 
    : [];

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    const qty = parseFloat(returnQuantity) || 0;
    return qty * selectedProduct.sellPrice;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessError('');
    setSuccessMessage('');

    if (!selectedCustomer) return setProcessError('يرجى اختيار العميل أولاً');
    if (!selectedProduct) return setProcessError('يرجى اختيار الصنف المرتجع');
    
    const qty = parseFloat(returnQuantity);
    if (isNaN(qty) || qty <= 0) return setProcessError('يرجى إدخال كمية صحيحة');

    const totalRefunded = calculateTotal();
    
    // Check if customer has sales (existing invoices)
    if (customerSales.length > 0) {
      // User didn't specify which invoice, so let's add to expiryBalance (store as credit for next invoice)
      // The user's wording was a bit ambiguous, so let's do the safe thing: always add to expiryBalance
      // (since we already have auto-deduct in SalesManager)
      const updatedCustomer = {
        ...selectedCustomer,
        expiryBalance: (selectedCustomer.expiryBalance || 0) + totalRefunded
      };
      onUpdateCustomer(updatedCustomer);

      // Also, let's create a RefundTransaction for record keeping!
      const newRefund: RefundTransaction = {
        id: `EXP-${Math.floor(100000 + Math.random() * 900000)}`,
        saleId: customerSales[0].id, // use first sale as reference for record
        date: new Date().toISOString().split('T')[0],
        customerName: selectedCustomer.name,
        items: [
          {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: qty,
            sellPrice: selectedProduct.sellPrice,
            total: totalRefunded
          }
        ],
        totalRefunded: totalRefunded,
        reason: 'إكسير منتهي الصلاحية'
      };
      onAddRefund(newRefund);

      setSuccessMessage(`تمت العملية بنجاح! تم إضافة ${totalRefunded.toFixed(2)} ج.م كرصيد إكسير للعميل!`);
    } else {
      // No existing sales, add to expiryBalance!
      const updatedCustomer = {
        ...selectedCustomer,
        expiryBalance: (selectedCustomer.expiryBalance || 0) + totalRefunded
      };
      onUpdateCustomer(updatedCustomer);

      setSuccessMessage(`تمت العملية بنجاح! تم إضافة ${totalRefunded.toFixed(2)} ج.م كرصيد إكسير للعميل!`);
    }

    // Reset form!
    setSelectedCustomer(null);
    setSelectedProduct(null);
    setReturnQuantity('');
  };

  return (
    <div className="space-y-6 animate-fade-in dir-rtl" id="expired-return-manager-tab">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Undo2 className="text-rose-600" size={24} />
            <span>تسجيل إكسير مرتجع من العميل</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">تسجيل مرتجع لأصناف منتهية الصلاحية</p>
        </div>
        <button 
          onClick={() => onNavigate('expiry')}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 shadow-xs transition-all text-xs font-semibold cursor-pointer"
        >
          ← العودة لنظام الأكسير
        </button>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main content area */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Customer */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User size={16} />
              <span>الخطوة الأولى: اختيار العميل</span>
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">اختر العميل من القائمة</label>
                <select
                  value={selectedCustomer?.id || ""}
                  onChange={(e) => {
                    const chosen = customers.find(c => c.id === e.target.value);
                    setSelectedCustomer(chosen || null);
                    setSelectedProduct(null);
                    setReturnQuantity('');
                  }}
                  className="w-full text-right bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-slate-900 focus:bg-white cursor-pointer font-bold"
                >
                  <option value="">-- اختر العميل --</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} (هاتف: {customer.phone}) {customer.expiryBalance > 0 && `(رصيد إكسير: ${customer.expiryBalance.toFixed(2)} ج.م)`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Select Product and Quantity (only if customer is selected) */}
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag size={16} />
                  <span>الخطوة الثانية: اختيار الصنف والكمية</span>
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setSelectedProduct(null);
                    setReturnQuantity('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  ← تغيير العميل
                </button>
              </div>

              {processError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{processError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Product */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">اختر الصنف</label>
                  <div className="relative">
                    <select
                      value={selectedProduct?.id || ""}
                      onChange={(e) => {
                        const chosen = products.find(p => p.id === e.target.value);
                        setSelectedProduct(chosen || null);
                      }}
                      className="w-full text-right bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-slate-900 focus:bg-white cursor-pointer font-bold"
                    >
                      <option value="">-- اختر الصنف --</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} (كود: {product.id}, سعر: {product.sellPrice.toFixed(2)} ج.م)
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-3 text-slate-400">
                      <Package size={14} />
                    </div>
                  </div>
                </div>

                {/* Enter Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">الكمية المرتجعة</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={returnQuantity}
                      onChange={(e) => setReturnQuantity(e.target.value)}
                      className="w-full text-right bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-slate-900 focus:bg-white font-mono"
                      placeholder="أدخل الكمية"
                    />
                    <div className="absolute left-3 top-3 text-slate-400">
                      <Calculator size={14} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Show Total if product and quantity are selected */}
              {selectedProduct && parseFloat(returnQuantity) > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-600">إجمالي قيمة الإكسير المرتجع:</span>
                    <span className="font-bold font-mono text-rose-600 text-lg">{calculateTotal().toFixed(2)} ج.م</span>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  سيتم إضافة القيمة كرصيد إكسير للعميل ليتم خصمها تلقائياً من فاتورة مبيعات لاحقة!
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setSelectedProduct(null);
                      setReturnQuantity('');
                      setProcessError('');
                    }}
                    className="px-5 py-2.5 rounded-lg text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg text-white bg-rose-600 hover:bg-rose-700 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    تسجيل الإكسير المرتجع
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
