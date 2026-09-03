import React, { useState } from 'react';
import { Building2, Save, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { CompanySettings } from '../types';

interface CompanySettingsProps {
  settings: CompanySettings;
  onUpdateSettings: (newSettings: CompanySettings) => void;
}

export default function CompanySettingsManager({ settings, onUpdateSettings }: CompanySettingsProps) {
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [mainWarehouse, setMainWarehouse] = useState(settings.mainWarehouse);
  const [localBranch, setLocalBranch] = useState(settings.localBranch);
  const [taxNumber, setTaxNumber] = useState(settings.taxNumber || '');
  const [commercialRegister, setCommercialRegister] = useState(settings.commercialRegister || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [email, setEmail] = useState(settings.email || '');

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!companyName.trim()) {
      setError('اسم الشركة/الجهة البائعة مطلوب');
      return;
    }
    if (!mainWarehouse.trim()) {
      setError('اسم المستودع الرئيسي مطلوب');
      return;
    }
    if (!localBranch.trim()) {
      setError('اسم الفرع المحلي المباشر مطلوب');
      return;
    }

    const updated: CompanySettings = {
      companyName: companyName.trim(),
      mainWarehouse: mainWarehouse.trim(),
      localBranch: localBranch.trim(),
      taxNumber: taxNumber.trim() || undefined,
      commercialRegister: commercialRegister.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    };

    onUpdateSettings(updated);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      {/* Title block */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="text-slate-900" size={24} />
          <span>بيانات الشركة والجهات البائعة</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          تعديل وتخصيص بيانات شركتك التي تظهر تلقائياً في فواتير البيع المطبوعة والملفات المصدرة.
        </p>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Visual Header */}
        <div className="bg-slate-900 p-6 text-white flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-lg">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-bold text-sm">هوية المنشأة للفواتير</h3>
            <p className="text-[10px] text-slate-300 mt-0.5">يتم تطبيق هذه البيانات فوراً على ترويسة ومذيل كافة فواتير العملاء</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>تم حفظ وتحديث بيانات الشركة بنجاح!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">الجهة البائعة / اسم الشركة *</label>
              <input 
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="مثال: الشركة الوطنية للمبيعات والتوريدات"
                className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-bold"
              />
            </div>

            {/* Main Warehouse */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">المستودع الرئيسي *</label>
              <input 
                type="text"
                required
                value={mainWarehouse}
                onChange={(e) => setMainWarehouse(e.target.value)}
                placeholder="مثال: فرع القاهرة والمحافظات"
                className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-medium"
              />
            </div>

            {/* Local Branch */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">الفرع المحلي المباشر *</label>
              <input 
                type="text"
                required
                value={localBranch}
                onChange={(e) => setLocalBranch(e.target.value)}
                placeholder="مثال: نقطة بيع البيع السريع"
                className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-medium"
              />
            </div>

            {/* Commercial Register */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">رقم السجل التجاري (اختياري)</label>
              <input 
                type="text"
                value={commercialRegister}
                onChange={(e) => setCommercialRegister(e.target.value)}
                placeholder="مثال: ١٠٢٩٣٨"
                className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-medium"
              />
            </div>

            {/* Tax Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">الرقم الضريبي / البطاقة الضريبية (اختياري)</label>
              <input 
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="مثال: ٤٥٦-٧٨٩-٠١٢"
                className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-medium"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">رقم الهاتف للتواصل</label>
              <input 
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: ٠١٠٢٢٣٣٤٤٥٥"
                className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-mono"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">البريد الإلكتروني للشركة</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="مثال: support@smartpos.com"
                className="w-full text-left bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-xs active:scale-98 cursor-pointer shadow-xs"
            >
              <Save size={15} />
              <span>حفظ التعديلات والتحديث الفوري</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
