import test from 'node:test';
import assert from 'node:assert/strict';
import { loadInitialAppData } from './dataStorage';

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  get length(): number {
    return this.store.size;
  }
}

test('loadInitialAppData keeps persisted sales even when they look like seeded demo data', () => {
  const storage = new LocalStorageMock();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage
  });

  storage.setItem('sales_app_products', JSON.stringify([
    {
      id: 'BAR-1001',
      name: 'منتج تجريبي',
      category: 'أجهزة',
      buyPrice: 100,
      sellPrice: 150,
      stock: 5,
      minStockAlert: 1,
      description: 'منتج تجريبي'
    }
  ]));

  storage.setItem('sales_app_sales', JSON.stringify([
    {
      id: '985421',
      date: '2026-07-23T10:00:00.000Z',
      customerName: 'عميل تجريبي',
      items: [],
      totalAmount: 150,
      paidAmount: 150,
      remainingAmount: 0,
      totalProfit: 50,
      notes: 'فاتورة محفوظة'
    }
  ]));

  storage.setItem('sales_app_customers', JSON.stringify([
    {
      id: 'CUST-1001',
      name: 'عميل نقدي افتراضي',
      phone: '01000000000',
      balance: 0,
      expiryBalance: 0,
      createdAt: '2026-07-23'
    }
  ]));

  const data = loadInitialAppData();

  assert.equal(data.sales.length, 1);
  assert.equal(data.sales[0].id, '985421');
  assert.equal(data.products.length, 1);
});
