
import React, { useState } from 'react';
import { 
  Edit, 
  X, 
  Save, 
  Undo2 
} from 'lucide-react';
import { RefundTransaction } from '../types';

interface EditRefundPageProps {
  refund: RefundTransaction;
  onUpdateRefund: (updatedRefund: RefundTransaction) => void;
  onBack: () => void;
}

export default function EditRefundPage({ refund, onUpdateRefund, onBack }: EditRefundPageProps) {
  const [editingReason, setEditingReason] = useState(refund.reason);
  const [editingItems, setEditingItems] = useState([...refund.items]);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Edit className="text-slate-900" size={24} />
            <span>تعديل عملية المرتجع</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">تعديل بيانات عملية الارتجاع المالي رقم {refund.id}</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 shadow-xs transition-all text-xs font-semibold cursor-pointer"
        >
          <Undo2 size={14} />
          <span>العودة إلى سجل المرتجعات</span>
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const newTotal = editingItems.reduce((sum, item) => sum + item.total, 0);
          onUpdateRefund({
            ...refund,
            reason: editingReason,
            items: editingItems,
            totalRefunded: newTotal
          });
          onBack();
        }}
        className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden p-6 space-y-6"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-900 rounded-lg text-white">
              <Edit size={14} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">تعديل العملية</h3>
          </div>
        </div>

        <div className="space-y-4">
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

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">المنتجات المسترجعة</label>
            <div className="space-y-2">
              {editingItems.map((item, index) => (
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
                      <span className="text-xs font-bold font-mono text-rose-600">
                        {editingItems[index].total.toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-500">إجمالي الارتجاع المالي بعد التعديل:</span>
            <span className="text-lg font-mono font-bold text-rose-600">
              {editingItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)} ج.م
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onBack}
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
        </div>
      </form>
    </div>
  );
}
