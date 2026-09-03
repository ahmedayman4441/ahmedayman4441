export interface Product {
  id: string; // Barcode or unique ID
  name: string;
  category: string;
  buyPrice: number; // سعر الشراء
  sellPrice: number; // سعر البيع
  stock: number; // الكمية المتوفرة
  minStockAlert: number; // حد التنبيه لنقص المخزون
  description?: string;
  expiryDate?: string; // YYYY-MM-DD optional expiry date
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  total: number;
  profit: number;
}

export interface Sale {
  id: string; // Invoice number
  date: string; // ISO date string or YYYY-MM-DD
  customerName: string;
  customerCode?: string; // Code of registered customer if applicable
  customerAddress?: string; // Address of customer
  items: SaleItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  totalProfit: number;
  discountAmount?: number;
  expiryDiscount?: number;
  notes?: string;
  isRefunded?: boolean; // Flag if fully refunded
}

export interface Customer {
  id: string; // Code e.g. CUST-123456
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  balance: number; // Account balance or credit limit
  expiryBalance: number; // Expiry refund balance
  createdAt: string;
}

export interface RefundTransaction {
  id: string; // REF-123456
  saleId: string; // Original invoice ID
  date: string; // ISO date string
  customerName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    sellPrice: number;
    total: number;
  }[];
  totalRefunded: number;
  reason: string;
}

export interface DashboardMetrics {
  totalSales: number;
  totalProfit: number;
  totalProductsCount: number;
  lowStockCount: number;
}

export interface CompanySettings {
  companyName: string;
  mainWarehouse: string;
  localBranch: string;
  taxNumber?: string;
  commercialRegister?: string;
  phone?: string;
  email?: string;
}


