import React from 'react';
import { History, RotateCcw, Trash2, Clock, FileText, DollarSign, Users, Package, AlertTriangle, Download } from 'lucide-react';
import { Product, Sale, Customer, RefundTransaction, CompanySettings } from '../types';

interface Backup {
  id: string;
  timestamp: string;
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  refunds: RefundTransaction[];
  companySettings: CompanySettings;
  editLogs?: Record<string, any[]>;
  description?: string;
}

interface BackupManagerProps {
  backups: Backup[];
  onCreateBackup: () => void;
  onExportCurrentBackup: () => void;
  onRestore: (backup: Backup) => void;
  onDelete: (backupId: string) => void;
  onNavigate: (tab: string) => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({
  backups,
  onCreateBackup,
  onExportCurrentBackup,
  onRestore,
  onDelete,
  onNavigate
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const [showConfirmRestore, setShowConfirmRestore] = React.useState<Backup | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleDownloadBackup = (backup: Backup) => {
    try {
      const data = JSON.stringify(backup, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${backup.id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download backup', err);
      alert('حدث خطأ أثناء تنزيل النسخة الاحتياطية. راجع وحدة التحكم للمزيد.');
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text) as Backup;

      if (!imported || !imported.products || !imported.sales || !imported.customers) {
        alert('الملف غير صالح لا يحتوي على بيانات نسخ احتياطية صحيحة.');
        return;
      }

      onRestore(imported);
      onNavigate('dashboard');
      alert('تم استيراد النسخة الاحتياطية بنجاح.');
    } catch (error) {
      console.error('Failed to import backup', error);
      alert('حدث خطأ أثناء استيراد النسخة الاحتياطية. تأكد من أن الملف بصيغة JSON صحيحة.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History size={24} />
            سجل النسخ الاحتياطية
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            استعادة حالات سابقة للنظام، أو حذف النسخ غير المطلوبة
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onCreateBackup}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            <History size={16} />
            إنشاء نسخة احتياطية
          </button>
          <button
            onClick={onExportCurrentBackup}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Download size={16} />
            تصدير نسخة احتياطية
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 transition-colors"
          >
            <Download size={16} />
            استيراد نسخة احتياطية
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportBackup}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <FileText size={16} />
            <span className="text-xs font-semibold">عدد النسخ</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{backups.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <Package size={16} />
            <span className="text-xs font-semibold">أحدث عدد منتجات</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {backups[0]?.products.length || 0}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <DollarSign size={16} />
            <span className="text-xs font-semibold">أحدث عدد فواتير</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {backups[0]?.sales.length || 0}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <Users size={16} />
            <span className="text-xs font-semibold">أحدث عدد عملاء</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {backups[0]?.customers.length || 0}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-4 px-4 text-right">تاريخ النسخة</th>
                <th className="py-4 px-4 text-right">الوصف</th>
                <th className="py-4 px-4 text-center">المنتجات</th>
                <th className="py-4 px-4 text-center">الفواتير</th>
                <th className="py-4 px-4 text-center">العملاء</th>
                  <th className="py-4 px-4 text-center">المرتجعات</th>
                  <th className="py-4 px-4 text-center">سجلات التعديل</th>
                <th className="py-4 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                    لا توجد نسخ احتياطية بعد. سيتم إنشاؤها تلقائياً عند إجراء أي تغيير في النظام.
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock size={14} className="text-slate-400" />
                        <span className="font-semibold">{formatDate(backup.timestamp)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs">
                        {backup.description || 'نسخة احتياطية تلقائية'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-slate-600 font-mono">
                      {backup.products.length}
                    </td>
                    <td className="py-4 px-4 text-center text-slate-600 font-mono">
                      {backup.sales.length}
                    </td>
                    <td className="py-4 px-4 text-center text-slate-600 font-mono">
                      {backup.customers.length}
                    </td>
                    <td className="py-4 px-4 text-center text-slate-600 font-mono">
                      {backup.refunds.length}
                    </td>
                    <td className="py-4 px-4 text-center text-slate-600 font-mono">
                      {backup.editLogs ? Object.keys(backup.editLogs).length : 0}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setShowConfirmRestore(backup)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          <RotateCcw size={12} />
                          استعادة
                        </button>
                        <button
                          onClick={() => handleDownloadBackup(backup)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition-colors"
                        >
                          <Download size={12} />
                          تنزيل
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
                              onDelete(backup.id);
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 size={12} />
                          حذف
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

      {showConfirmRestore && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-amber-50 p-4 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-600" size={28} />
                <div>
                  <h3 className="font-bold text-amber-900">تأكيد استعادة النسخة الاحتياطية</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    ستتم استعادة جميع البيانات إلى الحالة التي كانت عليه في {formatDate(showConfirmRestore.timestamp)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">المنتجات</span>
                  <span className="font-bold text-lg">{showConfirmRestore.products.length}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">الفواتير</span>
                  <span className="font-bold text-lg">{showConfirmRestore.sales.length}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">العملاء</span>
                  <span className="font-bold text-lg">{showConfirmRestore.customers.length}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">المرتجعات</span>
                  <span className="font-bold text-lg">{showConfirmRestore.refunds.length}</span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-xs">
                ⚠️ سيتم استبدال جميع البيانات الحالية بالنسخة الاحتياطية المحددة، ولا يمكن التراجع عن هذا الإجراء.
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowConfirmRestore(null)}
                className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  onRestore(showConfirmRestore);
                  setShowConfirmRestore(null);
                  onNavigate('dashboard');
                }}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                تأكيد الاستعادة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManager;
