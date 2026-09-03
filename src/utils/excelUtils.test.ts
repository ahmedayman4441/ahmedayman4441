import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { buildCustomerPriceListSheet } from './excelUtils';
import type { Product } from '../types';

test('buildCustomerPriceListSheet creates a customer price list with code, name, and selling price', () => {
    const products: Product[] = [
      {
        id: 'P-100',
        name: 'شوكولاتة',
        category: 'حلويات',
        buyPrice: 10,
        sellPrice: 15,
        stock: 50,
        minStockAlert: 5,
      },
      {
        id: 'P-200',
        name: 'مياه',
        category: 'مشروبات',
        buyPrice: 5,
        sellPrice: 8,
        stock: 100,
        minStockAlert: 10,
      },
    ];

    const sheet = buildCustomerPriceListSheet(products);
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    assert.deepStrictEqual(rows[0], ['كود الصنف', 'اسم الصنف', 'سعر البيع للعملاء']);
    assert.strictEqual(rows[1][0], 'P-100');
    assert.strictEqual(rows[1][1], 'شوكولاتة');
    assert.strictEqual(rows[1][2], 15);
    assert.strictEqual(rows[2][2], 8);
});
