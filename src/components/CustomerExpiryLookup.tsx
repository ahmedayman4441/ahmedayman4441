import React, { useState } from 'react';
import { Search, ArrowRight, X } from 'lucide-react';
import { Customer, Sale, RefundTransaction } from '../types';

interface CustomerExpiryLookupProps {
  customers: Customer[];
  sales: Sale[];
  refunds: RefundTransaction[];
  onNavigate: (tab: string) => void;
}

type LookupCustomer = {
  id: string;
  name: string;
  phone?: string;
  expiryBalance: number;
  source: 'registered' | 'sales';
};

export default function CustomerExpiryLookup({ customers, sales, refunds, onNavigate }: CustomerExpiryLookupProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const registeredCustomerNames = new Set(customers.map(c => c.name.trim()));
  const saleCustomers: LookupCustomer[] = [];
  const saleCustomerNames = new Set<string>();

  sales.forEach((sale, idx) => {
    const name = sale.customerName.trim();
    if (!name || registeredCustomerNames.has(name) || saleCustomerNames.has(name)) return;
    saleCustomerNames.add(name);
    saleCustomers.push({
      id: sale.customerCode || `sale-${idx}`,
      name,
      expiryBalance: 0,
      source: 'sales'
    });
  });

  const customerEntries: LookupCustomer[] = [
    ...customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      expiryBalance: customer.expiryBalance || 0,
      source: 'registered' as const
    })),
    ...saleCustomers
  ];

  const filteredCustomers = customerEntries.filter(customer => {
    const search = searchTerm.toLowerCase();
    const matchName = customer.name.toLowerCase().includes(search);
    const matchCode = customer.id.toLowerCase().includes(search);
    const matchPhone = customer.phone?.toLowerCase().includes(search);
    return matchName || matchCode || !!matchPhone;
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || null;
  const selectedLookupCustomer = customerEntries.find(c => c.id === selectedCustomerId) || null;
  const customerNameForSearch = selectedCustomer?.name || selectedLookupCustomer?.name || '';

  const customerRefunds = customerNameForSearch
    ? refunds.filter(refund => refund.customerName === customerNameForSearch)
    : [];
  const customerSales = customerNameForSearch
    ? sales.filter(s => {
        const nameMatches = s.customerName === customerNameForSearch
          || s.customerName.includes(customerNameForSearch)
          || customerNameForSearch.includes(s.customerName);
        const codeMatches = selectedCustomer ? s.customerCode === selectedCustomer.id : false;
        return nameMatches || codeMatches;
      })
    : [];
  const selectedDisplayCustomer = selectedCustomer || selectedLookupCustomer;

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowRight className="text-slate-900" size={24} />
            <span>عرض رصيد الإكسبير للعميل</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">اختر العميل لمعرفة رصيد الإكسير المتاح له وحالته الحالية.</p>
        </div>
        <button
          onClick={() => onNavigate('expiry')}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl border border-slate-900 shadow-xs transition-all text-xs font-semibold"
        >
          <X size={14} />
          <span>العودة إلى صفحة الأكسباير</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center gap-3 md:justify-between">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full md:max-w-xl">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم العميل أو الكود أو الهاتف"
              className="w-full text-right bg-transparent border-none outline-none text-xs text-slate-700"
            />
          </div>
          <div className="text-right text-xs text-slate-500">
            {filteredCustomers.length} عميل مطابق
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 text-slate-700 text-xs font-bold">قائمة العملاء</div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4">كود العميل</th>
                  <th className="py-3 px-4">اسم العميل</th>
                  <th className="py-3 px-4">الهاتف</th>
                  <th className="py-3 px-4 text-center">رصيد الإكسبير</th>
                  <th className="py-3 px-4 text-center">عرض</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className={`hover:bg-slate-50 transition-colors ${selectedCustomerId === customer.id ? 'bg-slate-50' : ''}`}>
                    <td className="py-3 px-4 font-mono text-slate-900">{customer.id}</td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">{customer.name}</td>
                    <td className="py-3 px-4 text-slate-700">{customer.phone}</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-700">{customer.expiryBalance.toFixed(2)} ج.م</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className="text-xs px-3 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                      >عرض</button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">لا يوجد عملاء مطابقون.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5">
          {selectedDisplayCustomer ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] text-slate-500 mb-2">العميل المختار</p>
                  <h2 className="text-lg font-bold text-slate-900">{selectedDisplayCustomer.name}</h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{selectedDisplayCustomer.id}</span>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">الهاتف</span>
                  <span className="font-semibold">{selectedCustomer.phone}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">الحساب الحالي</span>
                  <span className="font-semibold">{selectedCustomer.balance.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">رصيد الإكسبير المتاح</span>
                  <span className="text-indigo-700 font-bold text-sm">{selectedCustomer.expiryBalance.toFixed(2)} ج.م</span>
                </div>
                {selectedCustomer.notes && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-600 text-xs">
                    <span className="font-semibold text-slate-700">ملاحظات:</span> {selectedCustomer.notes}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">سجل منتجات الإكسباير</h3>
                  <span className="text-[11px] text-slate-400">اسم الصنف وكود الصنف</span>
                </div>

                {customerRefunds.length > 0 ? (
                  <div className="overflow-x-auto mt-3">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-semibold">
                          <th className="py-3 px-3">كود الصنف</th>
                          <th className="py-3 px-3">اسم الصنف</th>
                          <th className="py-3 px-3 text-center">الكمية</th>
                          <th className="py-3 px-3 text-right">سعر البيع</th>
                          <th className="py-3 px-3 text-right">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerRefunds.flatMap((refund) => refund.items).map((item, idx) => (
                          <tr key={`${selectedCustomer.id}-refund-${idx}`} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-mono text-slate-900">{item.productId}</td>
                            <td className="py-3 px-3 text-slate-900 font-semibold">{item.productName}</td>
                            <td className="py-3 px-3 text-center text-slate-700">{item.quantity}</td>
                            <td className="py-3 px-3 text-right font-mono text-slate-700">{item.sellPrice.toFixed(2)} ج.م</td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">{item.total.toFixed(2)} ج.م</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : customerSales.length > 0 ? (
                  <div className="overflow-x-auto mt-3">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-semibold">
                          <th className="py-3 px-3">كود الصنف</th>
                          <th className="py-3 px-3">اسم الصنف</th>
                          <th className="py-3 px-3 text-center">الكمية</th>
                          <th className="py-3 px-3 text-right">سعر البيع</th>
                          <th className="py-3 px-3 text-right">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerSales.flatMap((sale) => sale.items).map((item, idx) => (
                          <tr key={`${selectedCustomer.id}-sale-${idx}`} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-mono text-slate-900">{item.productId}</td>
                            <td className="py-3 px-3 text-slate-900 font-semibold">{item.productName}</td>
                            <td className="py-3 px-3 text-center text-slate-700">{item.quantity}</td>
                            <td className="py-3 px-3 text-right font-mono text-slate-700">{item.sellPrice.toFixed(2)} ج.م</td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">{item.total.toFixed(2)} ج.م</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 text-slate-500 text-xs">
                    لا يوجد منتجات مرتبطة برصيد الإكسبير لهذا العميل حتى الآن.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs">
              اختر عميل من القائمة اليسرى لعرض رصيد الإكسبير الخاص به.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
