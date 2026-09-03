import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Edit2, 
  Phone, 
  MapPin, 
  Mail, 
  Plus, 
  AlertTriangle, 
  CreditCard,
  FileText,
  CheckCircle,
  X
} from 'lucide-react';
import { Customer } from '../types';

interface CustomerManagerProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onEditCustomer: (customer: Customer) => void;
  onRegisterCustomerClick: () => void;
}

export default function CustomerManager({ 
  customers, 
  onAddCustomer, 
  onUpdateCustomer, 
  onDeleteCustomer,
  onEditCustomer,
  onRegisterCustomerClick
}: CustomerManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in" id="customer-manager-tab" dir="rtl">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-slate-900" size={24} />
            <span>نظام تسجيل وإدارة العملاء</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">تسجيل العملاء الدائمين وتوليد كود مميز لكل عميل لمتابعة الحسابات والآجل</p>
        </div>
        <button 
          onClick={onRegisterCustomerClick}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-xs active:scale-98 cursor-pointer"
        >
          <UserPlus size={15} />
          <span>تسجيل عميل جديد</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold text-slate-400 block">إجمالي العملاء المسجلين</span>
            <span className="text-xl font-bold text-slate-900">{customers.length}</span>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-900 border border-slate-200/60 rounded-lg">
            <Users size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold text-slate-400 block">إجمالي الحسابات المدينة (علي العملاء)</span>
            <span className="text-xl font-bold text-slate-900">
              {customers.reduce((acc, c) => c.balance > 0 ? acc + c.balance : acc, 0).toFixed(2)} ج.م
            </span>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg">
            <CreditCard size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold text-slate-400 block">الحسابات الدائنة (رصيد مسبق الدفع)</span>
            <span className="text-xl font-bold text-slate-900">
              {Math.abs(customers.reduce((acc, c) => c.balance < 0 ? acc + c.balance : acc, 0)).toFixed(2)} ج.م
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg">
            <CheckCircle size={18} />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
        <div className="relative">
          <input 
            type="text"
            placeholder="ابحث عن عميل بالاسم، الكود المولد أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs pl-4 pr-10 py-3 rounded-lg outline-none transition-all"
          />
          <div className="absolute right-3.5 top-3.5 text-slate-400">
            <Search size={15} />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-4 px-4 text-right">كود العميل</th>
                <th className="py-4 px-4 text-right">الاسم بالكامل</th>
                <th className="py-4 px-4 text-right">رقم الهاتف</th>
                <th className="py-4 px-4 text-right">البريد الإلكتروني</th>
                <th className="py-4 px-4 text-right">العنوان</th>
                <th className="py-4 px-4 text-center">الرصيد المالي الحالي</th>
                <th className="py-4 px-4 text-center">تاريخ التسجيل</th>
                <th className="py-4 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    لا يوجد عملاء مسجلين يطابقون بحثك.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">{cust.id}</td>
                    <td className="py-4 px-4 font-bold text-slate-900">{cust.name}</td>
                    <td className="py-4 px-4 text-slate-700">
                      <span className="flex items-center gap-1.5 justify-start">
                        <Phone size={12} className="text-slate-400" />
                        <span>{cust.phone}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-mono">
                      {cust.email ? (
                        <span className="flex items-center gap-1.5 justify-start">
                          <Mail size={12} className="text-slate-400" />
                          <span>{cust.email}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-500 max-w-[150px] truncate">
                      {cust.address ? (
                        <span className="flex items-center gap-1.5 justify-start">
                          <MapPin size={12} className="text-slate-400" />
                          <span>{cust.address}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center font-bold">
                      {cust.balance > 0 ? (
                        <span className="text-rose-600 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded font-mono">
                          {cust.balance.toFixed(2)} ج.م (مدين)
                        </span>
                      ) : cust.balance < 0 ? (
                        <span className="text-emerald-600 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded font-mono">
                          {Math.abs(cust.balance).toFixed(2)} ج.م (دائن)
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono">0.00 ج.م</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-slate-500">{cust.createdAt}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => onEditCustomer(cust)}
                          className="p-1.5 text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="تعديل العميل"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => onDeleteCustomer(cust.id)}
                          className="p-1.5 text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                          title="حذف العميل"
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

    </div>
  );
}
