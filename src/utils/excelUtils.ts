import * as XLSX from 'xlsx';
import { Product, Sale, Customer } from '../types';

export interface ExpiryImportResult {
  products: Array<{ id: string; expiryDate?: string }>;
  customers: Array<{ id: string; expiryBalance: number; name?: string }>;
}

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
};

const writeWorkbook = (wb: XLSX.WorkBook, filename: string) => {
  XLSX.writeFile(wb, filename);
};

const buildDashboardSheet = (products: Product[], sales: Sale[], customers: Customer[]) => {
  const dashboardData = [
    ['برنامج المبيعات الذكي وتصدير الإكسيل'],
    ['تم التصدير بتاريخ:', formatDate(new Date().toISOString())],
    [],
    ['إحصائيات عامة للمبيعات والمخزون', '', '', ''],
    ['المؤشر', 'القيمة الحالية', 'معادلة إكسيل النشطة', 'التوضيح'],
    ['إجمالي عدد المنتجات', products.length, '=COUNTA(المنتجات!B2:B1000)', 'عدد الأصناف المسجلة بالمخزن'],
    ['إجمالي عدد العملاء', customers.length, '=COUNTA(العملاء!B2:B1000)', 'عدد العملاء المسجلين'],
    ['إجمالي المبيعات الفعلية', sales.reduce((sum, s) => sum + s.totalAmount, 0), '=SUM(المبيعات!E2:E5000)', 'مجموع المبالغ المحصلة من الفواتير'],
    ['إجمالي الأرباح المحققة', sales.reduce((sum, s) => sum + s.totalProfit, 0), '=SUM(المبيعات!H2:H5000)', 'صافي الربح من المبيعات الفعلية'],
    ['إجمالي القيمة الشرائية للمخزن', products.reduce((sum, p) => sum + (p.buyPrice * p.stock), 0), '=SUMPRODUCT(المنتجات!D2:D1000, المنتجات!F2:F1000)', 'رأس المال المستثمر في البضاعة الحالية'],
    ['إجمالي القيمة البيعية للمخزن', products.reduce((sum, p) => sum + (p.sellPrice * p.stock), 0), '=SUMPRODUCT(المنتجات!E2:E1000, المنتجات!F2:F1000)', 'القيمة البيعية المتوقعة للبضاعة الحالية'],
    ['الأرباح المتوقعة من البضاعة الحالية', products.reduce((sum, p) => sum + ((p.sellPrice - p.buyPrice) * p.stock), 0), '=J12-J11 (بيعي - شرائي)', 'صافي الأرباح المتوقع جنيها بعد بيع كامل المخزون'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(dashboardData);
  ws['!cols'] = [
    { wch: 30 },
    { wch: 18 },
    { wch: 35 },
    { wch: 45 }
  ];
  return ws;
};

const buildProductsSheet = (products: Product[]) => {
  const headers = ['كود المنتج', 'اسم المنتج', 'القسم', 'سعر الشراء', 'سعر البيع', 'الكمية الحالية', 'حد التنبيه', 'أرباح القطعة الواحدة', 'تاريخ الصلاحية'];
  const rows = products.map((p, idx) => {
    const rowNum = idx + 2;
    return [
      p.id,
      p.name,
      p.category || 'عام',
      p.buyPrice,
      p.sellPrice,
      p.stock,
      p.minStockAlert || 5,
      { t: 'n', f: `E${rowNum}-D${rowNum}` },
      p.expiryDate || ''
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 }
  ];
  return ws;
};

export const buildCustomerPriceListSheet = (products: Product[]) => {
  const headers = ['كود الصنف', 'اسم الصنف', 'سعر البيع للعملاء'];
  const rows = products.map((p) => [p.id, p.name, p.sellPrice]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 30 },
    { wch: 18 }
  ];
  return ws;
};

const buildSalesSheet = (sales: Sale[]) => {
  const headers = ['رقم الفاتورة', 'التاريخ والوقت', 'العميل', 'تفاصيل المنتجات والكميات', 'إجمالي الفاتورة', 'المدفوع', 'المتبقي (آجل)', 'صافي الربح'];
  const rows = sales.map((s, idx) => {
    const rowNum = idx + 2;
    const itemsDetails = s.items.map(i => `${i.productName} (${i.quantity} × ${i.sellPrice})`).join(' | ');
    return [
      s.id,
      formatDate(s.date),
      s.customerName || 'زبون عام',
      itemsDetails,
      s.totalAmount,
      s.paidAmount,
      { t: 'n', f: `E${rowNum}-F${rowNum}` },
      s.totalProfit
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 15 },
    { wch: 22 },
    { wch: 20 },
    { wch: 45 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 }
  ];
  return ws;
};

const buildCustomersSheet = (customers: Customer[]) => {
  const headers = ['كود العميل', 'اسم العميل', 'الهاتف', 'البريد الإلكتروني', 'العنوان', 'الرصيد', 'اكسبير', 'ملاحظات', 'تاريخ الإنشاء'];
  const rows = customers.map(c => [
    c.id,
    c.name,
    c.phone || '',
    c.email || '',
    c.address || '',
    c.balance ?? 0,
    c.expiryBalance ?? 0,
    c.notes || '',
    c.createdAt || ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 25 },
    { wch: 18 },
    { wch: 25 },
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
    { wch: 30 },
    { wch: 15 }
  ];
  return ws;
};

const buildExpirySheet = (products: Product[], customers: Customer[]) => {
  const headers = ['كود المنتج', 'اسم المنتج', 'تاريخ الصلاحية'];
  const productRows = products
    .filter(p => p.expiryDate)
    .map(p => [p.id, p.name, p.expiryDate || '']);

  const expiryCustomersHeaders = ['كود العميل', 'اسم العميل', 'اكسبير'];
  const customerRows = customers
    .filter(c => c.expiryBalance && c.expiryBalance > 0)
    .map(c => [c.id, c.name, c.expiryBalance]);

  const wsProductExpiry = XLSX.utils.aoa_to_sheet([headers, ...productRows]);
  wsProductExpiry['!cols'] = [
    { wch: 18 },
    { wch: 25 },
    { wch: 18 }
  ];

  const wsCustomerExpiry = XLSX.utils.aoa_to_sheet([expiryCustomersHeaders, ...customerRows]);
  wsCustomerExpiry['!cols'] = [
    { wch: 18 },
    { wch: 25 },
    { wch: 12 }
  ];

  return { wsProductExpiry, wsCustomerExpiry };
};

export const exportToExcel = (products: Product[], sales: Sale[], customers: Customer[] = []) => {
  const wb = XLSX.utils.book_new();
  const wsDashboard = buildDashboardSheet(products, sales, customers);
  const wsProducts = buildProductsSheet(products);
  const wsSales = buildSalesSheet(sales);

  XLSX.utils.book_append_sheet(wb, wsDashboard, 'الرئيسية');
  XLSX.utils.book_append_sheet(wb, wsProducts, 'المنتجات');
  XLSX.utils.book_append_sheet(wb, wsSales, 'المبيعات');

  if (customers.length > 0) {
    const wsCustomers = buildCustomersSheet(customers);
    XLSX.utils.book_append_sheet(wb, wsCustomers, 'العملاء');
  }

  const { wsProductExpiry, wsCustomerExpiry } = buildExpirySheet(products, customers);
  if (wsProductExpiry && XLSX.utils.sheet_to_json(wsProductExpiry).length > 1) {
    XLSX.utils.book_append_sheet(wb, wsProductExpiry, 'صلاحية المنتجات');
  }
  if (wsCustomerExpiry && XLSX.utils.sheet_to_json(wsCustomerExpiry).length > 1) {
    XLSX.utils.book_append_sheet(wb, wsCustomerExpiry, 'صلاحية العملاء');
  }

  const filename = `برنامج_المبيعات_${formatDate(new Date().toISOString())}.xlsx`;
  writeWorkbook(wb, filename);
};

export const exportProductsExcel = (products: Product[]) => {
  const wb = XLSX.utils.book_new();
  const wsProducts = buildProductsSheet(products);
  XLSX.utils.book_append_sheet(wb, wsProducts, 'المنتجات');
  writeWorkbook(wb, `المنتجات_${formatDate(new Date().toISOString())}.xlsx`);
};

export const exportCustomerPriceListExcel = (products: Product[]) => {
  const wb = XLSX.utils.book_new();
  const wsPriceList = buildCustomerPriceListSheet(products);
  XLSX.utils.book_append_sheet(wb, wsPriceList, 'قائمة الأسعار');
  writeWorkbook(wb, `قائمة_الأسعار_للعملاء_${formatDate(new Date().toISOString())}.xlsx`);
};

export const exportCustomersExcel = (customers: Customer[]) => {
  const wb = XLSX.utils.book_new();
  const wsCustomers = buildCustomersSheet(customers);
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'العملاء');
  writeWorkbook(wb, `العملاء_${formatDate(new Date().toISOString())}.xlsx`);
};

export const exportExpiryExcel = (products: Product[], customers: Customer[]) => {
  const wb = XLSX.utils.book_new();
  const { wsProductExpiry, wsCustomerExpiry } = buildExpirySheet(products, customers);
  XLSX.utils.book_append_sheet(wb, wsProductExpiry, 'صلاحية المنتجات');
  if (XLSX.utils.sheet_to_json(wsCustomerExpiry).length > 1) {
    XLSX.utils.book_append_sheet(wb, wsCustomerExpiry, 'صلاحية العملاء');
  }
  writeWorkbook(wb, `صلاحية_${formatDate(new Date().toISOString())}.xlsx`);
};

const parseSheetRows = (workbook: XLSX.WorkBook, expectedName: string, fallbackName?: string) => {
  const sheetName = workbook.SheetNames.includes(expectedName)
    ? expectedName
    : fallbackName && workbook.SheetNames.includes(fallbackName)
      ? fallbackName
      : undefined;

  if (!sheetName) return [] as any[][];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [] as any[][];
  return XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
};

const parseProductsSheet = (workbook: XLSX.WorkBook) => {
  const rawRows = parseSheetRows(workbook, 'المنتجات', workbook.SheetNames[0]);
  const importedProducts: Product[] = [];
  if (rawRows.length <= 1) return importedProducts;

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || !row[1]) continue;
    importedProducts.push({
      id: String(row[0] || `BAR-${Date.now()}-${i}`).trim(),
      name: String(row[1]).trim(),
      category: String(row[2] || 'عام').trim(),
      buyPrice: parseFloat(row[3]) || 0,
      sellPrice: parseFloat(row[4]) || 0,
      stock: parseInt(row[5]) || 0,
      minStockAlert: parseInt(row[6]) || 5,
      expiryDate: row[8] ? String(row[8]).trim() : undefined
    });
  }

  return importedProducts;
};

const parseCustomersSheet = (workbook: XLSX.WorkBook) => {
  const rawRows = parseSheetRows(workbook, 'العملاء');
  const importedCustomers: Customer[] = [];
  if (rawRows.length <= 1) return importedCustomers;

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || !row[1]) continue;
    importedCustomers.push({
      id: String(row[0] || `CUST-${Date.now()}-${i}`).trim(),
      name: String(row[1] || 'عميل جديد').trim(),
      phone: String(row[2] || '').trim(),
      email: String(row[3] || '').trim(),
      address: String(row[4] || '').trim(),
      balance: parseFloat(row[5]) || 0,
      expiryBalance: parseFloat(row[6]) || 0,
      notes: String(row[7] || '').trim(),
      createdAt: String(row[8] || new Date().toISOString().split('T')[0])
    });
  }

  return importedCustomers;
};

const parseExpiryProductsSheet = (workbook: XLSX.WorkBook) => {
  const rawRows = parseSheetRows(workbook, 'صلاحية المنتجات', 'المنتجات');
  const importedExpiry: ExpiryImportResult['products'] = [];
  if (rawRows.length <= 1) return importedExpiry;

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || !row[0]) continue;
    const expiryDate = row[2] ? String(row[2]).trim() : row[8] ? String(row[8]).trim() : undefined;
    if (!expiryDate) continue;
    importedExpiry.push({
      id: String(row[0]).trim(),
      expiryDate
    });
  }

  return importedExpiry;
};

const parseExpiryCustomersSheet = (workbook: XLSX.WorkBook) => {
  const rawRows = parseSheetRows(workbook, 'صلاحية العملاء', 'العملاء');
  const importedExpiry: ExpiryImportResult['customers'] = [];
  if (rawRows.length <= 1) return importedExpiry;

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || !row[0]) continue;
    const expiryBalance = parseFloat(row[2] ?? row[6] ?? 0) || 0;
    importedExpiry.push({
      id: String(row[0]).trim(),
      name: String(row[1] || '').trim(),
      expiryBalance
    });
  }

  return importedExpiry;
};

export const importExcelData = (file: File): Promise<{
  products: Product[];
  customers: Customer[];
  expiryProducts: ExpiryImportResult['products'];
  expiryCustomers: ExpiryImportResult['customers'];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('فشل قراءة بيانات الملف');

        const workbook = XLSX.read(data, { type: 'binary' });
        const products = parseProductsSheet(workbook);
        const customers = parseCustomersSheet(workbook);
        const expiryProducts = parseExpiryProductsSheet(workbook);
        const expiryCustomers = parseExpiryCustomersSheet(workbook);

        resolve({ products, customers, expiryProducts, expiryCustomers });
      } catch (err: any) {
        reject(err?.message || 'حدث خطأ أثناء تحليل ملف الإكسيل');
      }
    };
    reader.onerror = () => reject('فشل قراءة الملف كلياً');
    reader.readAsBinaryString(file);
  });
};