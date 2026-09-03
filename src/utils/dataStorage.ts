import type { Product, Sale, Customer, RefundTransaction, CompanySettings } from '../types';

export interface PersistedBackup {
  id: string;
  timestamp: string;
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  refunds: RefundTransaction[];
  companySettings: CompanySettings;
  editLogs?: Record<string, unknown[]>;
  description?: string;
}

export interface InitialAppData {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  refunds: RefundTransaction[];
  companySettings: CompanySettings;
  backups: PersistedBackup[];
}

const PRODUCTS_KEY = 'sales_app_products';
const SALES_KEY = 'sales_app_sales';
const CUSTOMERS_KEY = 'sales_app_customers';
const REFUNDS_KEY = 'sales_app_refunds';
const SETTINGS_KEY = 'sales_app_company_settings';
const BACKUPS_KEY = 'sales_app_backups';

export const makeDefaultCompanySettings = (): CompanySettings => ({
  companyName: 'الشركة الوطنية للمبيعات والتوريدات',
  mainWarehouse: 'فرع القاهرة والمحافظات',
  localBranch: 'نقطة بيع البيع السريع',
  commercialRegister: '١٠٢٩٣٨',
  taxNumber: '٤٥٦-٧٨٩-٠١٢',
  phone: '٠١٠٢٢٣٣٤٤٥٥',
  email: 'support@smartpos.com'
});

const readJson = <T,>(key: string): T | null => {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const readArray = <T,>(key: string): T[] | null => {
  const parsed = readJson<T[]>(key);
  return Array.isArray(parsed) ? parsed : null;
};

const readObject = <T,>(key: string, fallback: T): T => {
  const parsed = readJson<T>(key);
  return parsed && typeof parsed === 'object' ? parsed : fallback;
};

const isLikelyDemoSeed = (products: Product[], sales: Sale[], customers: Customer[]): boolean => {
  const demoProductIds = ['BAR-1001', 'BAR-1002', 'BAR-1003'];
  const demoSaleIds = ['985421', '204125'];
  const demoCustomerNames = ['عميل نقدي افتراضي', 'المهندس كريم محمود'];

  return (
    products.some((product) => demoProductIds.includes(product.id)) ||
    sales.some((sale) => demoSaleIds.includes(sale.id)) ||
    customers.some((customer) => demoCustomerNames.includes(customer.name))
  );
};

const hasRealUserData = (products: Product[], sales: Sale[], customers: Customer[], refunds: RefundTransaction[]): boolean => {
  const hasAnyEntries = products.length > 0 || sales.length > 0 || customers.length > 0 || refunds.length > 0;
  if (!hasAnyEntries) return false;

  const hasNonDemoProduct = products.some((product) => !product.id.startsWith('BAR-100'));
  const hasNonDemoCustomer = customers.some((customer) => customer.name !== 'عميل نقدي افتراضي' && customer.name !== 'المهندس كريم محمود');
  const hasNonDemoSale = sales.some((sale) => !['985421', '204125'].includes(sale.id));

  return hasNonDemoProduct || hasNonDemoCustomer || hasNonDemoSale || refunds.length > 0;
};

const hasMeaningfulBackup = (backup?: PersistedBackup | null): backup is PersistedBackup => {
  if (!backup) return false;
  return backup.products.length > 0 || backup.sales.length > 0 || backup.customers.length > 0 || backup.refunds.length > 0;
};

export const loadInitialAppData = (): InitialAppData => {
  const defaultCompanySettings = makeDefaultCompanySettings();

  const storedProducts = readArray<Product>(PRODUCTS_KEY);
  const storedSales = readArray<Sale>(SALES_KEY);
  const storedCustomers = readArray<Customer>(CUSTOMERS_KEY);
  const storedRefunds = readArray<RefundTransaction>(REFUNDS_KEY);
  const storedBackups = readArray<PersistedBackup>(BACKUPS_KEY) ?? [];
  const storedSettings = readObject<CompanySettings>(SETTINGS_KEY, defaultCompanySettings);

  const seededProducts: Product[] = [
    {
      id: 'BAR-1001',
      name: 'آيفون ١٥ برو ماكس ٢٥٦ جيجا',
      category: 'أجهزة ذكية',
      buyPrice: 48000,
      sellPrice: 55000,
      stock: 12,
      minStockAlert: 3,
      description: 'نسخة الشرق الأوسط بضمان محلي عامين'
    },
    {
      id: 'BAR-1002',
      name: 'سماعة أبل AirPods Pro ٢',
      category: 'سماعات',
      buyPrice: 3800,
      sellPrice: 4500,
      stock: 20,
      minStockAlert: 5,
      description: 'سماعات لاسلكية تدعم عزل الضوضاء النشط'
    },
    {
      id: 'BAR-1003',
      name: 'شاحن مغناطيسي لاسلكي سريع',
      category: 'إكسسوارات',
      buyPrice: 650,
      sellPrice: 1200,
      stock: 4,
      minStockAlert: 5,
      description: 'قوة ١٥ واط متوافق بالكامل مع MagSafe'
    }
  ];

  const seededSales: Sale[] = [
    {
      id: '985421',
      date: new Date(Date.now() - 86400000).toISOString(),
      customerName: 'أحمد أيمن (عميل تجريبي)',
      items: [
        {
          productId: 'BAR-1002',
          productName: 'سماعة أبل AirPods Pro ٢',
          quantity: 1,
          buyPrice: 3800,
          sellPrice: 4500,
          total: 4500,
          profit: 700
        }
      ],
      totalAmount: 4500,
      paidAmount: 4500,
      remainingAmount: 0,
      totalProfit: 700,
      notes: 'فاتورة تجريبية أساسية'
    }
  ];

  const seededCustomers: Customer[] = [
    {
      id: 'CUST-1001',
      name: 'عميل نقدي افتراضي',
      phone: '01000000000',
      balance: 0,
      expiryBalance: 0,
      createdAt: '2026-07-01'
    },
    {
      id: 'CUST-1002',
      name: 'المهندس كريم محمود',
      phone: '01223456789',
      balance: 1500,
      expiryBalance: 0,
      createdAt: '2026-07-03',
      notes: 'عميل دائم مميز، لديه حساب آجل بقيمة 1500 جنيه'
    }
  ];

  const hasStoredMeaningfulData =
    (storedProducts && storedProducts.length > 0) ||
    (storedSales && storedSales.length > 0) ||
    (storedCustomers && storedCustomers.length > 0) ||
    (storedRefunds && storedRefunds.length > 0);

  const isDemoData = isLikelyDemoSeed(storedProducts ?? [], storedSales ?? [], storedCustomers ?? []);
  const hasUserData = hasRealUserData(storedProducts ?? [], storedSales ?? [], storedCustomers ?? [], storedRefunds ?? []);
  const latestBackup = storedBackups.find(hasMeaningfulBackup) ?? null;

  const shouldUseBackup = !hasStoredMeaningfulData && hasMeaningfulBackup(latestBackup);

  const shouldPreferStoredData = hasStoredMeaningfulData && (storedSales && storedSales.length > 0 || storedProducts && storedProducts.length > 0 || storedCustomers && storedCustomers.length > 0 || storedRefunds && storedRefunds.length > 0);

  if (shouldPreferStoredData && (!isDemoData || hasUserData || (storedSales && storedSales.length > 0))) {
    return {
      products: storedProducts ?? seededProducts,
      sales: storedSales ?? seededSales,
      customers: storedCustomers ?? seededCustomers,
      refunds: storedRefunds ?? [],
      companySettings: storedSettings ?? defaultCompanySettings,
      backups: storedBackups
    };
  }

  if (shouldUseBackup) {
    return {
      products: latestBackup!.products,
      sales: latestBackup!.sales,
      customers: latestBackup!.customers,
      refunds: latestBackup!.refunds,
      companySettings: latestBackup!.companySettings ?? defaultCompanySettings,
      backups: storedBackups
    };
  }

  return {
    products: seededProducts,
    sales: seededSales,
    customers: seededCustomers,
    refunds: [],
    companySettings: storedSettings ?? defaultCompanySettings,
    backups: storedBackups
  };
};
