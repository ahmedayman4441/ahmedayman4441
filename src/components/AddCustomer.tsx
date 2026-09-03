import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  UserPlus, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Save, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign
} from 'lucide-react';
import { Customer } from '../types';

interface AddCustomerProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onNavigate: (tab: string) => void;
}

export default function AddCustomer({ customers, onAddCustomer, onNavigate }: AddCustomerProps) {
  const generateCustomerCode = () => {
    return `CUST-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState(generateCustomerCode());
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBalance, setFormBalance] = useState('0');
  const [formNotes, setFormNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formName.trim()) return setError('اسم العميل مطلوب');
    if (!formCode.trim()) return setError('كود العميل مطلوب');
    if (!formPhone.trim()) return setError('رقم هاتف العميل مطلوب');

    // Check if the customer code is already used
    const codeExists = customers.some(
      c => c.id.trim().toLowerCase() === formCode.trim().toLowerCase()
    );
    if (codeExists) {
      return setError(`كود العميل "${formCode}" مستخدم بالفعل لعميل آخر. يرجى اختيار كود فريد.`);
    }

    const bal = parseFloat(formBalance);
    if (isNaN(bal)) return setError('الرصيد المالي يجب أن يكون رقماً صحيحاً أو عشرياً');

    const newCust: Customer = {
      id: formCode.trim(),
      name: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      address: formAddress.trim() || undefined,
      notes: formNotes.trim() || undefined,
      balance: bal,
      expiryBalance: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddCustomer(newCust);
    setSuccess(true);
    
    // reset form
    setFormName('');
    setFormCode(generateCustomerCode());
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormBalance('0');
    setFormNotes('');
  };

  return (
    <div className="space-y-8 animate-fade-in" id="add-customer-tab" dir="rtl">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="text-slate-900" size={24} />
            <span>تسجيل عميل جديد</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">إضافة عميل جديد للنظام لتمكينه من شراء البضائع والحسابات الآجلة</p>
        </div>
        <button 
          onClick={() => onNavigate('customers')}
          className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-4 py-2 rounded-lg transition-colors text-xs cursor-pointer"
        >
          <Users size={14} />
          <span>إلغاء والعودة لصفحة العملاء</span>
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
            <h2 className="text-base font-bold text-slate-900">تم تسجيل العميل بنجاح!</h2>
            <p className="text-xs text-slate-500 mt-1">تمت إضافة العميل الجديد وتوليد كود مميز له بنجاح.</p>
          </div>

          <div className="flex gap-4 pt-2">
            <button 
              onClick={() => setSuccess(false)}
              className="flex-1 py-2.5 rounded-lg text-slate-700 bg-slate-50 border border-slate-250 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
            >
              تسجيل عميل آخر
            </button>
            <button 
              onClick={() => onNavigate('customers')}
              className="flex-1 py-2.5 rounded-lg text-white bg-slate-900 hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              الذهاب لإدارة العملاء
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs max-w-2xl mx-auto overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <div className="p-2 bg-slate-900 rounded-md text-white">
              <UserPlus size={16} />
            </div>
            <h2 className="text-xs font-bold text-slate-900">إدخال بيانات العميل الجديد</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">اسم العميل بالكامل *</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: أحمد محمد علي"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-bold"
                />
              </div>

              {/* Customer Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex justify-between">
                  <span>كود العميل المخصص *</span>
                  <button
                    type="button"
                    onClick={() => setFormCode(generateCustomerCode())}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold transition-colors cursor-pointer"
                  >
                    توليد كود تلقائي
                  </button>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: CUST-101"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full text-left bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-3 py-2.5 rounded-lg outline-none transition-all font-mono font-bold"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">رقم الهاتف *</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    placeholder="01xxxxxxxxx"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full text-left bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs pl-3 pr-10 py-2.5 rounded-lg outline-none transition-all font-mono"
                  />
                  <div className="absolute right-3 top-3 text-slate-400">
                    <Phone size={14} />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">البريد الإلكتروني (اختياري)</label>
                <div className="relative">
                  <input 
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full text-left bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs pl-3 pr-10 py-2.5 rounded-lg outline-none transition-all font-mono"
                  />
                  <div className="absolute right-3 top-3 text-slate-400">
                    <Mail size={14} />
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">الرصيد المالي الافتتاحي (مدين أو دائن)</label>
                <div className="relative">
                  <input 
                    type="number"
                    step="any"
                    value={formBalance}
                    onChange={(e) => setFormBalance(e.target.value)}
                    className="w-full text-left bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs pl-3 pr-10 py-2.5 rounded-lg outline-none transition-all font-mono"
                  />
                  <div className="absolute right-3 top-3 text-slate-400">
                    <DollarSign size={14} />
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 block mt-1">الموجب يعني العميل مدين، السالب يعني العميل دائن (له رصيد مسبق)</span>
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">العنوان بالتفصيل (اختياري)</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="المحافظة، المدينة، الشارع..."
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs pl-3 pr-10 py-2.5 rounded-lg outline-none transition-all"
                  />
                  <div className="absolute right-3 top-3 text-slate-400">
                    <MapPin size={14} />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">ملاحظات وتنبيهات العميل</label>
                <div className="relative">
                  <textarea 
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={3}
                    placeholder="حد ائتماني خاص بالعميل أو ملاحظات تجارية..."
                    className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs p-3 rounded-lg outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Form actions */}
            <div className="pt-4 border-t border-slate-200 flex gap-4">
              <button 
                type="button"
                onClick={() => onNavigate('customers')}
                className="flex-1 py-2.5 rounded-lg text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                تراجع وإلغاء
              </button>
              <button 
                type="submit"
                className="flex-1 py-2.5 rounded-lg text-white bg-slate-900 hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer active:scale-98 flex items-center justify-center gap-2"
              >
                <Save size={14} />
                <span>حفظ وتسجيل العميل</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
