import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  DollarSign, 
  Layers, 
  AlertTriangle, 
  ArrowUpRight, 
  Calendar, 
  ShoppingCart,
  User,
  Calculator,
  Percent
} from 'lucide-react';
import { Product, Sale } from '../types';

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
};

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ products, sales, onNavigate }: DashboardProps) {
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState<string | null>(null);

  // Calculate metrics
  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.totalProfit, 0);
  
  const lowStockItems = products.filter(p => p.stock <= p.minStockAlert);
  const totalStockItemsCount = products.reduce((sum, p) => sum + p.stock, 0);
  const totalStockCost = products.reduce((sum, p) => sum + (p.buyPrice * p.stock), 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.sellPrice * p.stock), 0);
  const expectedProfit = totalStockValue - totalStockCost;

  // Simple Sales Chart Logic (Last 7 Days)
  const getSalesHistory = () => {
    const history: { [key: string]: { sales: number; profit: number } } = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      history[key] = { sales: 0, profit: 0 };
    }

    // Populate
    sales.forEach(s => {
      const day = s.date.split('T')[0];
      if (history[day]) {
        history[day].sales += s.totalAmount;
        history[day].profit += s.totalProfit;
      }
    });

    return Object.entries(history).map(([date, data]) => {
      const d = new Date(date);
      const dayLabel = d.toLocaleDateString('ar-EG', { weekday: 'short' });
      return {
        date: dayLabel,
        sales: data.sales,
        profit: data.profit
      };
    });
  };

  const chartData = getSalesHistory();
  const maxChartValue = Math.max(...chartData.map(d => Math.max(d.sales, d.profit, 100)));

  // Calculator logic
  const handleCalcBtn = (val: string) => {
    if (val === 'C') {
      setCalcInput('');
      setCalcResult(null);
    } else if (val === '=') {
      try {
        // Safe evaluation of basic expressions
        const sanitized = calcInput.replace(/[^-+*/().0-9]/g, '');
        // eslint-disable-next-line no-eval
        const res = eval(sanitized);
        setCalcResult(Number(res).toFixed(2));
      } catch {
        setCalcResult('خطأ');
      }
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  return (
    <div className="space-y-8" id="dashboard-tab" dir="rtl">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">اللوحة الرئيسية للأرباح والمبيعات</h1>
          <p className="text-xs text-slate-500 mt-1">نظرة عامة على نشاط متجرك وحالة مخزونك الحالي</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 self-start">
          <Calendar size={14} />
          <span>تاريخ اليوم: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Sales Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-between"
          id="kpi-sales"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-450">إجمالي المبيعات الفعلية</span>
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {totalSales.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-500">جنية</span>
            </div>
            <p className="text-[10px] text-slate-400">من واقع الفواتير المحفوظة</p>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
            <TrendingUp size={20} />
          </div>
        </motion.div>

        {/* Total Profit Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-between"
          id="kpi-profit"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-450">صافي الأرباح المحققة</span>
            <div className="text-xl font-bold text-emerald-750 tracking-tight">
              {totalProfit.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-500">جنية</span>
            </div>
            <p className="text-[10px] text-slate-400">الأرباح الفعلية الصافية</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg">
            <DollarSign size={20} />
          </div>
        </motion.div>

        {/* Total Products in Stock */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-between"
          id="kpi-products"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-450">إجمالي كمية المخزون</span>
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {totalStockItemsCount.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-500">قطعة</span>
            </div>
            <p className="text-[10px] text-slate-400">موزعة على {products.length} أصناف</p>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
            <Layers size={20} />
          </div>
        </motion.div>

        {/* Low Stock Warning Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className={`p-6 rounded-xl border flex items-center justify-between ${
            lowStockItems.length > 0 
              ? 'bg-amber-50/40 border-amber-200 text-amber-900' 
              : 'bg-white border-slate-200 text-slate-900'
          }`}
          id="kpi-warnings"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-450">نواقص تحتاج لإعادة طلب</span>
            <div className={`text-xl font-bold tracking-tight ${lowStockItems.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
              {lowStockItems.length.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-500">منتجات</span>
            </div>
            <p className="text-[10px] text-slate-400">وصلت للحد الأدنى المسموح</p>
          </div>
          <div className={`p-2.5 rounded-lg border ${lowStockItems.length > 0 ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <AlertTriangle size={20} />
          </div>
        </motion.div>
      </div>

      {/* Quick Services Links Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button 
          onClick={() => onNavigate('customers')}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 p-4 rounded-xl flex items-center justify-between text-right transition-all group cursor-pointer shadow-2xs"
        >
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-slate-950">نظام تسجيل وإدارة العملاء</h3>
            <p className="text-[10px] text-slate-400">تسجيل وتوليد كود مميز لكل عميل ومتابعة الحسابات</p>
          </div>
          <div className="p-2 bg-slate-50 group-hover:bg-slate-100 text-slate-800 rounded-lg transition-colors border border-slate-200">
            <User size={16} />
          </div>
        </button>

        <button 
          onClick={() => onNavigate('expiry')}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 p-4 rounded-xl flex items-center justify-between text-right transition-all group cursor-pointer shadow-2xs"
        >
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-slate-950">نظام الأكسباير والتواريخ</h3>
            <p className="text-[10px] text-slate-400">مراقبة المنتجات الصالحة، المنتهية والمقتربة من الانتهاء</p>
          </div>
          <div className="p-2 bg-amber-50 group-hover:bg-amber-100 text-amber-750 rounded-lg transition-colors border border-amber-100">
            <Calendar size={16} />
          </div>
        </button>

        <button 
          onClick={() => onNavigate('returns')}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 p-4 rounded-xl flex items-center justify-between text-right transition-all group cursor-pointer shadow-2xs"
        >
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-slate-950">نظام المرتجعات المالي</h3>
            <p className="text-[10px] text-slate-400">إرجاع بضائع فواتير المبيعات وتحديث stock تلقائياً</p>
          </div>
          <div className="p-2 bg-rose-50 group-hover:bg-rose-100 text-rose-700 rounded-lg transition-colors border border-rose-100">
            <ShoppingCart size={16} />
          </div>
        </button>
      </div>

      {/* Grid of Chart & Inventory Valuation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Chart Container (2 Cols on large screens) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">مؤشر مبيعات وأرباح الأسبوع الأخير</h2>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-900"></span> المبيعات</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300"></span> الأرباح</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100">
            {chartData.map((d, index) => {
              const salesHeight = maxChartValue > 0 ? (d.sales / maxChartValue) * 100 : 0;
              const profitHeight = maxChartValue > 0 ? (d.profit / maxChartValue) * 100 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] p-2 rounded-md shadow-sm z-10 transition-opacity pointer-events-none text-center min-w-[100px] font-mono border border-slate-800">
                    <div>بيع: {d.sales} ج.م</div>
                    <div className="text-emerald-400">ربح: {d.profit} ج.م</div>
                  </div>

                  {/* Columns */}
                  <div className="w-full max-w-[40px] flex items-end justify-center gap-1.5 h-full">
                    {/* Sales Bar */}
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(salesHeight, 3)}%` }}
                      transition={{ duration: 0.4, delay: index * 0.03 }}
                      className="w-1/2 bg-slate-900 rounded-t-sm hover:bg-slate-800 transition-colors"
                    />
                    {/* Profit Bar */}
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(profitHeight, 3)}%` }}
                      transition={{ duration: 0.4, delay: index * 0.03 + 0.08 }}
                      className="w-1/2 bg-slate-300 rounded-t-sm hover:bg-slate-400 transition-colors"
                    />
                  </div>
                  
                  {/* Label */}
                  <span className="text-[11px] text-slate-500 font-semibold truncate w-full text-center mt-1">{d.date}</span>
                </div>
              );
            })}
          </div>
          {sales.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs">
              لم تسجل أي مبيعات خلال هذا الأسبوع بعد. ابدأ بإضافة مبيعات جديدة لتنشيط الرسم البياني.
            </div>
          )}
        </div>

        {/* Inventory Value & Expected Profit */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">رأس المال وتقييم المخزون الحالي</h2>
          <p className="text-xs text-slate-400 leading-relaxed">إحصاءات قائمة على كميات المخازن المسجلة حالياً وأسعار الشراء والبيع الخاصة بها.</p>

          <div className="space-y-3 pt-2">
            {/* Cost Value */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/50 rounded-lg">
              <span className="text-xs text-slate-600 font-medium">تكلفة البضاعة (بسعر الشراء)</span>
              <span className="text-xs font-bold text-slate-900 font-mono">{totalStockCost.toLocaleString('ar-EG')} ج.م</span>
            </div>

            {/* Selling Value */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-200/30 rounded-lg">
              <span className="text-xs text-slate-600 font-medium">القيمة السوقية (بسعر البيع)</span>
              <span className="text-xs font-bold text-slate-900 font-mono">{totalStockValue.toLocaleString('ar-EG')} ج.م</span>
            </div>

            {/* Expected Profit */}
            <div className="flex items-center justify-between p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-lg">
              <span className="text-xs text-emerald-900 font-semibold">الأرباح المتوقعة عند تصفية المخزن</span>
              <span className="text-xs font-bold text-emerald-800 font-mono">+{expectedProfit.toLocaleString('ar-EG')} ج.م</span>
            </div>
          </div>

          <div className="pt-2">
            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>هامش الربح الإجمالي المتوقع:</span>
              <span className="font-mono text-slate-900 font-bold">
                {totalStockCost > 0 ? ((expectedProfit / totalStockCost) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-slate-900 h-full rounded-full" 
                style={{ width: `${Math.min(totalStockCost > 0 ? (expectedProfit / totalStockCost) * 100 : 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Lower Section: Low Stock Warning & Mobile Quick Calc */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Low Stock Warnings List */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              <span>نواقص المخزون والتحذيرات الحرجة</span>
            </h2>
            <button 
              onClick={() => onNavigate('products')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-0.5 border border-slate-200 px-2 py-1 rounded-md bg-white hover:bg-slate-50"
            >
              إدارة المخزن <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200/60 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{item.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">الترميز: {item.id} | القسم: {item.category}</p>
                  </div>
                  <div className="text-left">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-100">
                      الكمية: {item.stock} قطع
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1">حد الأمان: {item.minStockAlert} قطع</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                🎉 جميع الأصناف المسجلة كمياتها آمنة وضمن الحدود المحددة.
              </div>
            )}
          </div>
        </div>

        {/* Quick Excel/Sales Calculator for Mobile */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calculator size={16} className="text-slate-800" />
            <span>آلة حاسبة سريعة لحسابات البيع والأرباح</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">مثالية للحسابات الجانبية السريعة والنسب المئوية ومجموع البيع قبل تدوين الفاتورة.</p>

          <div className="bg-slate-900 p-4 rounded-lg text-left font-mono space-y-1">
            <div className="text-slate-400 text-[10px] text-right truncate overflow-x-auto select-all">{calcInput || '0'}</div>
            <div className="text-white text-xl font-bold text-right truncate overflow-x-auto select-all">
              {calcResult !== null ? calcResult : '0.00'}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {['7', '8', '9', '/'].map(btn => (
              <button 
                key={btn} 
                onClick={() => handleCalcBtn(btn)} 
                className="py-2 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors text-xs font-mono"
              >
                {btn}
              </button>
            ))}
            {['4', '5', '6', '*'].map(btn => (
              <button 
                key={btn} 
                onClick={() => handleCalcBtn(btn)} 
                className="py-2 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors text-xs font-mono"
              >
                {btn}
              </button>
            ))}
            {['1', '2', '3', '-'].map(btn => (
              <button 
                key={btn} 
                onClick={() => handleCalcBtn(btn)} 
                className="py-2 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors text-xs font-mono"
              >
                {btn}
              </button>
            ))}
            {['0', '.', '%', '+'].map(btn => (
              <button 
                key={btn} 
                onClick={() => handleCalcBtn(btn)} 
                className="py-2 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors text-xs font-mono"
              >
                {btn}
              </button>
            ))}
            <button 
              onClick={() => handleCalcBtn('C')} 
              className="col-span-2 py-2 text-center font-semibold text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-md transition-colors text-xs"
            >
              مسح (C)
            </button>
            <button 
              onClick={() => handleCalcBtn('=')} 
              className="col-span-2 py-2 text-center font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors text-xs"
            >
              إيجاد الناتج (=)
            </button>
          </div>
        </div>

      </div>

      {/* Recent Activity / Sales Log Summary */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart size={16} className="text-slate-700" />
            <span>آخر الفواتير والمبيعات المسجلة اليوم</span>
          </h2>
          <button 
            onClick={() => onNavigate('sales')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-0.5 border border-slate-200 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50"
          >
            سجل المبيعات بالكامل <ArrowUpRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 bg-slate-50/50">
                <th className="py-2.5 px-3 font-bold">رقم الفاتورة</th>
                <th className="py-2.5 font-semibold">التاريخ والوقت</th>
                <th className="py-2.5 font-semibold">العميل</th>
                <th className="py-2.5 font-semibold">الأصناف المبيعة</th>
                <th className="py-2.5 font-semibold text-left">القيمة الكلية</th>
                <th className="py-2.5 font-semibold text-left">الأرباح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.length > 0 ? (
                sales.slice(-5).reverse().map((sale) => (
                  <tr key={sale.id} className="text-slate-700 hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900">#{sale.id}</td>
                    <td className="py-3.5 text-slate-500">{formatDate(sale.date)}</td>
                    <td className="py-3.5 font-semibold flex items-center gap-1.5">
                      <User size={12} className="text-slate-400" />
                      <span>{sale.customerName || 'عميل عام'}</span>
                    </td>
                    <td className="py-3.5 max-w-[200px] truncate text-slate-500" title={sale.items.map(i => i.productName).join(' - ')}>
                      {sale.items.map(i => `${i.productName} (${i.quantity})`).join('، ')}
                    </td>
                    <td className="py-3.5 text-left font-bold text-slate-900">{sale.totalAmount.toLocaleString('ar-EG')} ج.م</td>
                    <td className="py-3.5 text-left font-semibold text-emerald-700">+{sale.totalProfit.toLocaleString('ar-EG')} ج.م</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    لا توجد فواتير مبيعات مسجلة حتى الآن. توجه لعلامة تبويب "تسجيل المبيعات" لإضافة فواتيرك.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
