import React, { useEffect, useState } from 'react';

export default function EditLogsPage() {
  const [keys, setKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = () => {
    const found: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) as string;
        if (k && k.startsWith('sale_edit_log_')) found.push(k);
      }
    } catch (err) {
      console.warn('Error reading localStorage keys', err);
    }
    setKeys(found.sort().reverse());
    if (found.length === 0) setSelectedKey(null);
  };

  const loadKey = (k: string | null) => {
    setSelectedKey(k);
    if (!k) { setEntries([]); return; }
    try {
      const raw = localStorage.getItem(k);
      const parsed = raw ? JSON.parse(raw) : [];
      setEntries(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      console.warn('Failed to parse log', err);
      setEntries([]);
    }
  };

  const downloadCSV = () => {
    if (!selectedKey) return;
    const rows = entries.map(e => ({ timestamp: e.timestamp, productId: e.productId, field: e.field, oldValue: JSON.stringify(e.oldValue), newValue: JSON.stringify(e.newValue) }));
    const header = ['timestamp','productId','field','oldValue','newValue'];
    const csv = [header.join(',')].concat(rows.map(r => header.map(h => `"${(r as any)[h] || ''}"`).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAllToCSV = () => {
    // combine all keys into one CSV with key column
    const rows: any[] = [];
    keys.forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          parsed.forEach((e: any) => rows.push({ logKey: k, timestamp: e.timestamp, productId: e.productId, field: e.field, oldValue: JSON.stringify(e.oldValue), newValue: JSON.stringify(e.newValue) }));
        }
      } catch (_) {}
    });
    const header = ['logKey','timestamp','productId','field','oldValue','newValue'];
    const csv = [header.join(',')].concat(rows.map(r => header.map(h => `"${(r as any)[h] || ''}"`).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_sale_edit_logs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
      <h2 className="text-sm font-bold">سجلات تعديلات الفواتير (إدارية)</h2>

      <div className="flex gap-3 items-center">
        <button className="px-3 py-2 bg-white border rounded" onClick={loadKeys}>تحديث القائمة</button>
        <select className="text-xs p-2 border" value={selectedKey || ''} onChange={(e) => loadKey(e.target.value || null)}>
          <option value="">-- اختر سجل فاتورة --</option>
          {keys.map(k => <option key={k} value={k}>{k.replace('sale_edit_log_','')}</option>)}
        </select>
        <button className="px-3 py-2 bg-white border rounded" onClick={downloadCSV} disabled={!selectedKey}>تنزيل CSV</button>
        <button className="px-3 py-2 bg-white border rounded" onClick={exportAllToCSV} disabled={keys.length===0}>تنزيل جميع السجلات CSV</button>
      </div>

      <div className="max-h-96 overflow-auto font-mono text-xs bg-slate-50 p-3 rounded mt-3">
        {selectedKey ? (
          entries.length === 0 ? <div className="text-slate-400">السجل فارغ.</div> : (
            entries.map((e, i) => (
              <div key={i} className="mb-1">[{e.timestamp}] {e.productId} — {e.field}: {JSON.stringify(e.oldValue)} → {JSON.stringify(e.newValue)}</div>
            ))
          )
        ) : (
          <div className="text-slate-400">اختر سجلًا لعرض التفاصيل.</div>
        )}
      </div>
    </div>
  );
}
