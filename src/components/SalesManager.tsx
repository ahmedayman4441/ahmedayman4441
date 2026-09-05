import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  ShoppingCart, 
  User, 
  Search, 
  CheckCircle, 
  Printer, 
  FileText,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Tag,
  ExternalLink,
  Copy,
  Check,
  X as XIcon,
  Download,
  Trash2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Product, Sale, SaleItem, Customer, CompanySettings } from '../types';

interface SalesManagerProps {
  products: Product[];
  sales: Sale[];
  customers?: Customer[];
  companySettings?: CompanySettings;
  onAddSale: (sale: Sale) => void;
  onRefundSale: (id: string) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onUpdateSale?: (sale: Sale) => void;
}

export default function SalesManager({ 
  products, 
  sales, 
  customers = [],
  companySettings = {
    companyName: 'الشركة الوطنية للمبيعات والتوريدات',
    mainWarehouse: 'فرع القاهرة والمحافظات',
    localBranch: 'نقطة بيع البيع السريع',
    commercialRegister: '١٠٢٩٣٨',
    taxNumber: '٤٥٦-٧٨٩-٠١٢',
    phone: '٠١٠٢٢٣٣٤٤٥٥',
    email: 'support@smartpos.com'
  },
  onAddSale, 
  onRefundSale,
  onUpdateCustomer
  , onUpdateSale
}: SalesManagerProps) {
  // Receipt edit states
  const [isEditingReceipt, setIsEditingReceipt] = useState(false);
  const [receiptEditableItems, setReceiptEditableItems] = useState<SaleItem[]>([]);
  const [receiptEditLog, setReceiptEditLog] = useState<any[]>([]);
  const [receiptNewProductId, setReceiptNewProductId] = useState('');
  const [receiptNewProductQuantity, setReceiptNewProductQuantity] = useState('1');
  const [receiptEditCashDiscount, setReceiptEditCashDiscount] = useState('0');
  const [receiptEditExpiryDiscount, setReceiptEditExpiryDiscount] = useState('0');
  const [pdfExportScale, setPdfExportScale] = useState('86');
  // Navigation inside tab: 'pos' or 'history'
  const [salesSubTab, setSalesSubTab] = useState<'pos' | 'history'>('pos');

  // POS State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [typedProductCode, setTypedProductCode] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('1');
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(0);
  const [showInStockOnly, setShowInStockOnly] = useState(true);
  const [recentProductIds, setRecentProductIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const suggestionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!suggestionsVisible) return;
    const highlightedNode = suggestionRefs.current[highlightedSuggestion];
    if (highlightedNode) {
      highlightedNode.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedSuggestion, suggestionsVisible]);

  useEffect(() => {
    try {
      const storedRecent = localStorage.getItem('recentProducts');
      const storedSearches = localStorage.getItem('recentSearches');
      if (storedRecent) {
        setRecentProductIds(JSON.parse(storedRecent));
      }
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches));
      }
    } catch (err) {
      console.warn('Error reading recent search data', err);
    }
  }, []);

  const normalizeArabic = (value: string) => {
    return value
      .trim()
      .toLowerCase()
      .replace(/[ًٌٍَُِّْ]/g, '')
      .replace(/[إأآ]/g, 'ا')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/ء/g, '')
      .replace(/ـ/g, '')
      .replace(/[^ء-ي0-9a-zA-Z\s]/g, ' ')
      .replace(/\s+/g, ' ');
  };

  const normalizeSearch = (value: string) => normalizeArabic(value);

  const scoreProduct = (product: Product, query: string) => {
    const normalizedQuery = normalizeSearch(query);
    const normalizedName = normalizeSearch(product.name);
    const normalizedId = normalizeSearch(product.id);
    const normalizedCategory = normalizeSearch(product.category);
    const normalizedDescription = normalizeSearch(product.description || '');

    let score = 0;
    if (!normalizedQuery) return score;
    if (normalizedId === normalizedQuery) score += 120;
    if (normalizedName === normalizedQuery) score += 100;
    if (normalizedId.includes(normalizedQuery)) score += 80;
    if (normalizedName.includes(normalizedQuery)) score += 70;
    if (normalizedCategory.includes(normalizedQuery)) score += 40;
    if (normalizedDescription.includes(normalizedQuery)) score += 20;
    if (product.stock > 0) score += 5;
    return score;
  };

  const productMatchesSearch = (product: Product, query: string) => {
    if (!query) return true;
    return scoreProduct(product, query) > 0;
  };

  const updateRecentProducts = (productId: string) => {
    const next = [productId, ...recentProductIds.filter((id) => id !== productId)].slice(0, 8);
    setRecentProductIds(next);
    try {
      localStorage.setItem('recentProducts', JSON.stringify(next));
    } catch (err) {
      console.warn('Could not save recent products', err);
    }
  };

  const findExactProductMatch = (query: string) => {
    const normalizedQuery = normalizeSearch(query.trim());
    if (!normalizedQuery) return undefined;
    return products.find((p) => {
      const normalizedId = normalizeSearch(p.id);
      const normalizedName = normalizeSearch(p.name);
      return normalizedId === normalizedQuery || normalizedName === normalizedQuery;
    });
  };

  const addSelectedProductToCart = (quantity = 1, productIdToAdd?: string) => {
    const productId = productIdToAdd || selectedProductId;
    if (!productId) return false;
    const product = products.find((p) => p.id === productId);
    if (!product) return false;

    const qty = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
    if (qty > product.stock) {
      alert(`الكمية المطلوبة (${qty}) تتجاوز المخزون المتوفر (${product.stock}) لهذا المنتج!`);
      return false;
    }

    const buyPrice = product.buyPrice;
    const sellPrice = product.sellPrice;
    const existingItemIdx = cartItems.findIndex((item) => item.productId === product.id);
    const existingQty = existingItemIdx !== -1 ? cartItems[existingItemIdx].quantity : 0;
    const targetQty = existingQty + qty;

    if (targetQty > product.stock) {
      alert(`الكمية المطلوبة (${targetQty}) تتجاوز المخزون المتوفر (${product.stock}) لهذا المنتج!`);
      return false;
    }

    if (existingItemIdx !== -1) {
      const updatedCart = [...cartItems];
      const prevQty = updatedCart[existingItemIdx].quantity;
      const newQty = prevQty + qty;
      updatedCart[existingItemIdx] = {
        ...updatedCart[existingItemIdx],
        quantity: newQty,
        total: sellPrice * newQty,
        profit: (sellPrice - buyPrice) * newQty,
      };
      setCartItems(updatedCart);
      setCartOriginals((orig) => ({ ...orig, [product.id]: orig[product.id] || { sellPrice: product.sellPrice, quantity: existingQty + qty } }));
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        buyPrice,
        sellPrice,
        total: sellPrice * qty,
        profit: (sellPrice - buyPrice) * qty,
      };
      setCartItems([...cartItems, newItem]);
      setCartOriginals((orig) => ({ ...orig, [product.id]: { sellPrice: newItem.sellPrice, quantity: newItem.quantity } }));
    }

    updateRecentProducts(product.id);
    return true;
  };

  const updateRecentSearches = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recentSearches.filter((item) => item !== trimmed)].slice(0, 8);
    setRecentSearches(next);
    try {
      localStorage.setItem('recentSearches', JSON.stringify(next));
    } catch (err) {
      console.warn('Could not save recent searches', err);
    }
  };

  const filteredProducts = products
    .filter((product) => {
      if (showInStockOnly && product.stock <= 0) return false;
      return productMatchesSearch(product, typedProductCode);
    })
    .sort((a, b) => scoreProduct(b, typedProductCode) - scoreProduct(a, typedProductCode));

  const visibleSuggestions = suggestionsVisible ? filteredProducts.slice(0, 8) : [];
  // Keep originals for reset and an edit log for changes before checkout
  const [cartOriginals, setCartOriginals] = useState<Record<string, { sellPrice: number; quantity: number }>>({});
  const [editLog, setEditLog] = useState<any[]>([]);
  const [discountAmount, setDiscountAmount] = useState('0'); // Discount in EGP
  const [expiryDiscount, setExpiryDiscount] = useState(0); // Expiry discount for selected customer
  const [expiryDiscountApplied, setExpiryDiscountApplied] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  
  // Receipt view states
  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);
  const [saleToRefund, setSaleToRefund] = useState<Sale | null>(null);

  // Search in History
  const [historySearch, setHistorySearch] = useState('');

  // Sandbox / Iframe print handling
  const [showIframePrintModal, setShowIframePrintModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // POS Validation & calculations
  const currentProduct = products.find(p => p.id === selectedProductId);
  
  const handleAddToInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    let productId = selectedProductId;

    if (!productId && typedProductCode.trim()) {
      const exactMatch = findExactProductMatch(typedProductCode);
      if (exactMatch) {
        productId = exactMatch.id;
        setSelectedProductId(exactMatch.id);
      }
    }

    if (!productId) return;

    const qty = parseInt(selectedQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return alert('الكمية يجب أن تكون رقم صحيح أكبر من صفر');
    }

    if (addSelectedProductToCart(qty, productId)) {
      setSelectedProductId('');
      setTypedProductCode('');
      setSelectedQuantity('1');
      setSuggestionsVisible(false);
    }
  };

  const recordEdit = (entry: { productId: string; field: string; oldValue: any; newValue: any }) => {
    const e = { ...entry, timestamp: new Date().toISOString() };
    setEditLog(prev => [...prev, e]);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.productId !== productId));
  };

  // Update quantity for an item in cart (validates against available stock)
  const handleUpdateCartItemQuantity = (productId: string, newQty: number) => {
    if (isNaN(newQty) || newQty < 0) return;
    const product = products.find(p => p.id === productId);
    if (!product) return alert('المنتج غير موجود في المخزون');

    if (newQty > product.stock) {
      alert(`الكمية المطلوبة (${newQty}) تتجاوز المخزون المتوفر (${product.stock}) لهذا المنتج!`);
      return;
    }

    const updated = cartItems.map(item => {
      if (item.productId !== productId) return item;
      const quantity = Math.max(0, Math.floor(newQty));
      const sellPrice = item.sellPrice;
      const total = sellPrice * quantity;
      const profit = (sellPrice - item.buyPrice) * quantity;
      if (quantity !== item.quantity) recordEdit({ productId, field: 'quantity', oldValue: item.quantity, newValue: quantity });
      return { ...item, quantity, total, profit };
    });

    setCartItems(updated);
  };

  // Update unit sell price for an item in cart (updates totals and profit)
  const handleUpdateCartItemPrice = (productId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    const updated = cartItems.map(item => {
      if (item.productId !== productId) return item;
      const sellPrice = Number(newPrice);
      const quantity = item.quantity;
      const total = sellPrice * quantity;
      const profit = (sellPrice - item.buyPrice) * quantity;
      if (sellPrice !== item.sellPrice) recordEdit({ productId, field: 'sellPrice', oldValue: item.sellPrice, newValue: sellPrice });
      return { ...item, sellPrice, total, profit };
    });

    setCartItems(updated);
  };

  const subTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const discount = parseFloat(discountAmount) || 0;
  const totalDiscounts = discount + expiryDiscountApplied;
  const grandTotal = Math.max(0, subTotal - totalDiscounts);
  const finalPaidAmount = paidAmount === '' ? 0 : parseFloat(paidAmount) || 0;
  const remainingAmount = Math.max(0, grandTotal - finalPaidAmount);
  
  // Profit calculations
  const totalCartProfit = cartItems.reduce((sum, item) => sum + item.profit, 0) - totalDiscounts;

  const handleCheckout = () => {
    if (cartItems.length === 0) return alert('سلة الفاتورة فارغة!');
    
    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    const finalCustomerName = selectedCustomer ? selectedCustomer.name : (customerName.trim() || 'عميل عام');
    const finalCustomerCode = selectedCustomer ? selectedCustomer.id : undefined;
    const finalCustomerAddress = selectedCustomer ? selectedCustomer.address : undefined;
    const appliedExpiryDiscount = Math.min(expiryDiscount, Math.max(0, expiryDiscountApplied));

    const newSale: Sale = {
      id: invoiceId,
      date: new Date().toISOString(),
      customerName: finalCustomerName,
      customerCode: finalCustomerCode,
      customerAddress: finalCustomerAddress,
      items: cartItems,
      totalAmount: grandTotal,
      paidAmount: finalPaidAmount,
      remainingAmount,
      totalProfit: Math.max(0, totalCartProfit),
      discountAmount: parseFloat(discountAmount) || 0,
      expiryDiscount: appliedExpiryDiscount,
      notes: notes.trim()
    };

    if (selectedCustomer && appliedExpiryDiscount > 0) {
      const updatedCustomer: Customer = {
        ...selectedCustomer,
        expiryBalance: Math.max(0, selectedCustomer.expiryBalance - appliedExpiryDiscount)
      };
      onUpdateCustomer(updatedCustomer);
    }

    onAddSale(newSale);
    setActiveReceipt(newSale); // Show print receipt modal

    // Reset Form
    setCartItems([]);
    setCustomerName('');
    setSelectedCustomerId('');
    setDiscountAmount('0');
    setExpiryDiscount(0);
    setExpiryDiscountApplied(0);
    setPaidAmount('');
    setNotes('');
    // Save edit log associated with this sale id for audit
    try {
      localStorage.setItem(`sale_edit_log_${invoiceId}`, JSON.stringify(editLog));
    } catch (err) {
      console.warn('Failed to save edit log for sale', err);
    }

    // Clear edit tracking for next invoice
    setEditLog([]);
    setCartOriginals({});
  };

  // Edit logs viewer states
  const [showEditLogModal, setShowEditLogModal] = useState(false);
  const [savedLogKeys, setSavedLogKeys] = useState<string[]>([]);
  const [selectedLogKey, setSelectedLogKey] = useState<string | null>(null);
  const [selectedLogEntries, setSelectedLogEntries] = useState<any[]>([]);

  const loadSavedLogKeys = () => {
    const keys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) as string;
        if (k && k.startsWith('sale_edit_log_')) keys.push(k);
      }
    } catch (err) {
      console.warn('Error reading localStorage keys', err);
    }
    setSavedLogKeys(keys.sort().reverse());
  };

  const loadLogByKey = (key: string | null) => {
    if (!key) { setSelectedLogEntries([]); setSelectedLogKey(null); return; }
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      setSelectedLogEntries(Array.isArray(parsed) ? parsed : []);
      setSelectedLogKey(key);
    } catch (err) {
      console.warn('Failed to load log', err);
      setSelectedLogEntries([]);
      setSelectedLogKey(key);
    }
  };

  // Filter history
  const filteredSales = sales.filter(s => {
    return s.id.toLowerCase().includes(historySearch.toLowerCase()) ||
           s.customerName.toLowerCase().includes(historySearch.toLowerCase()) ||
           (s.notes && s.notes.toLowerCase().includes(historySearch.toLowerCase()));
  });

  const replaceOklchAndOklabWithRgb = (str: string): string => {
    if (typeof str !== 'string') return str;

    let result = str;

    if (result.includes('oklch')) {
      result = result.replace(/oklch\s*\(\s*([\d.%+-]+)\s+([\d.+-]+)\s+([\d.+-]+)(?:\s*[\/\s,]\s*([\d.%+-]+))?\s*\)/gi, (_match, p1, p2, p3, p4) => {
        const L = p1.endsWith('%') ? parseFloat(p1) / 100 : parseFloat(p1);
        const C = parseFloat(p2);
        const H = parseFloat(p3);
        let A = 1;
        if (p4 !== undefined) {
          A = p4.endsWith('%') ? parseFloat(p4) / 100 : parseFloat(p4);
        }

        const theta = (H * Math.PI) / 180;
        const a = C * Math.cos(theta);
        const b = C * Math.sin(theta);
        const l = L + 0.3963377774 * a + 0.2158037573 * b;
        const m = L - 0.1055613458 * a - 0.0638541728 * b;
        const s = L - 0.0894841775 * a - 1.2914855480 * b;
        const l_ = l * l * l;
        const m_ = m * m * m;
        const s_ = s * s * s;
        const r_lin = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
        const g_lin = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
        const b_lin = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;
        const toSRGB = (c: number) => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
        const out_r = Math.max(0, Math.min(255, Math.round(toSRGB(r_lin) * 255)));
        const out_g = Math.max(0, Math.min(255, Math.round(toSRGB(g_lin) * 255)));
        const out_b = Math.max(0, Math.min(255, Math.round(toSRGB(b_lin) * 255)));
        return A === 1 ? `rgb(${out_r}, ${out_g}, ${out_b})` : `rgba(${out_r}, ${out_g}, ${out_b}, ${A})`;
      });
    }

    if (result.includes('oklab')) {
      result = result.replace(/oklab\s*\(\s*([\d.%+-]+)\s+([\d.+-]+)\s+([\d.+-]+)(?:\s*[\/\s,]\s*([\d.%+-]+))?\s*\)/gi, (_match, p1, p2, p3, p4) => {
        const L = p1.endsWith('%') ? parseFloat(p1) / 100 : parseFloat(p1);
        const a = parseFloat(p2);
        const b = parseFloat(p3);
        let A = 1;
        if (p4 !== undefined) {
          A = p4.endsWith('%') ? parseFloat(p4) / 100 : parseFloat(p4);
        }

        const l = L + 0.3963377774 * a + 0.2158037573 * b;
        const m = L - 0.1055613458 * a - 0.0638541728 * b;
        const s = L - 0.0894841775 * a - 1.2914855480 * b;
        const l_ = l * l * l;
        const m_ = m * m * m;
        const s_ = s * s * s;
        const r_lin = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
        const g_lin = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
        const b_lin = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;
        const toSRGB = (c: number) => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
        const out_r = Math.max(0, Math.min(255, Math.round(toSRGB(r_lin) * 255)));
        const out_g = Math.max(0, Math.min(255, Math.round(toSRGB(g_lin) * 255)));
        const out_b = Math.max(0, Math.min(255, Math.round(toSRGB(b_lin) * 255)));
        return A === 1 ? `rgb(${out_r}, ${out_g}, ${out_b})` : `rgba(${out_r}, ${out_g}, ${out_b}, ${A})`;
      });
    }

    return result;
  };

  const handleExportPDF = async () => {
    if (!activeReceipt) return;

    const element = document.getElementById('printable-invoice');
    if (!element) return;

    setIsExportingPDF(true);
    const originalGetComputedStyle = window.getComputedStyle;

    try {
      if (typeof window !== 'undefined' && window.self !== window.top) {
        setShowIframePrintModal(true);
        return;
      }

      window.getComputedStyle = function (elt, pseudoElt) {
        const style = originalGetComputedStyle.call(this, elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'getPropertyValue') {
              return (propertyName: string) => replaceOklchAndOklabWithRgb(target.getPropertyValue(propertyName));
            }
            const value = (target as any)[prop];
            if (typeof value === 'function') {
              return value.bind(target);
            }
            if (typeof value === 'string') {
              return replaceOklchAndOklabWithRgb(value);
            }
            return value;
          }
        });
      };

      if (document.fonts && typeof document.fonts.ready?.then === 'function') {
        await document.fonts.ready;
      }

      await new Promise(resolve => setTimeout(resolve, 120));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: Math.max(element.scrollWidth, 1100),
        windowHeight: Math.max(element.scrollHeight, 1400)
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 28;
      const availableWidth = pageWidth - (margin * 2);
      const exportScale = Math.max(0.5, Math.min(1, Number(pdfExportScale) / 100));
      const renderedWidth = availableWidth * exportScale;
      const horizontalOffset = margin + ((availableWidth - renderedWidth) / 2);
      const ratio = renderedWidth / canvas.width;
      const imgHeight = canvas.height * ratio;

      if (imgHeight <= pageHeight - (margin * 2)) {
        pdf.addImage(imgData, 'PNG', horizontalOffset, margin, renderedWidth, imgHeight, undefined, 'FAST');
      } else {
        let offsetY = 0;
        let page = 0;
        const pageCanvasHeight = Math.max(1, Math.floor((pageHeight - (margin * 2)) / ratio));

        while (offsetY < canvas.height) {
          if (page > 0) {
            pdf.addPage();
          }

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(pageCanvasHeight, canvas.height - offsetY);
          const pageCtx = pageCanvas.getContext('2d');
          if (!pageCtx) throw new Error('Failed to create PDF page canvas');
          pageCtx.drawImage(canvas, 0, offsetY, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);
          pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', horizontalOffset, margin, renderedWidth, pageCanvas.height * ratio, undefined, 'FAST');
          offsetY += pageCanvas.height;
          page += 1;
        }
      }

      pdf.save(`فاتورة_رقم_${activeReceipt.id}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('تعذر إنشاء ملف PDF الآن. جرّب مرة أخرى أو استخدم خيار الطباعة المباشرة إذا بقيت المشكلة.');
    } finally {
      window.getComputedStyle = originalGetComputedStyle;
      setIsExportingPDF(false);
    }
  };

  if (activeReceipt) {
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    return (
      <div className="space-y-8 animate-fade-in text-right" dir="rtl">
        {/* Navigation & Action Bar on Screen (Hidden on Print) */}
        <div className="no-print receipt-action-bar flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="text-slate-950" size={24} />
              <span>مراجعة الفاتورة التفصيلية</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              مراجعة شاملة لبيانات الفاتورة والأصناف قبل الطباعة أو التصدير
            </p>
          </div>
          <div className="receipt-action-buttons flex flex-wrap items-center gap-2.5">
            {/* 1. Print Button */}
            <button 
              onClick={() => {
                if (isInIframe) {
                  setShowIframePrintModal(true);
                } else {
                  try {
                    window.focus();
                    window.print();
                  } catch (err) {
                    console.error("Print command failed: ", err);
                  }
                }
              }}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-lg transition-colors text-xs active:scale-98 cursor-pointer shadow-xs"
            >
              <Printer size={15} />
              <span>طباعة الفاتورة ورَقياً</span>
            </button>

            {/* 2. Programmatic PDF Export Button */}
            <button 
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className={`flex items-center justify-center gap-2 text-white font-bold px-4 py-2.5 rounded-lg transition-colors text-xs active:scale-98 cursor-pointer shadow-xs ${
                isExportingPDF 
                  ? 'bg-indigo-400 cursor-not-allowed opacity-80' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isExportingPDF ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري تصدير الـ PDF...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>تصدير الفاتورة PDF</span>
                </>
              )}
            </button>

            <label className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-900">
              <span>حجم PDF</span>
              <select
                value={pdfExportScale}
                onChange={(event) => setPdfExportScale(event.target.value)}
                disabled={isExportingPDF}
                className="bg-white border border-indigo-200 rounded-md px-2 py-1 font-mono text-xs outline-none"
                aria-label="حجم الفاتورة عند تصدير PDF"
              >
                <option value="60">60%</option>
                <option value="70">70%</option>
                <option value="80">80%</option>
                <option value="86">86%</option>
                <option value="90">90%</option>
                <option value="100">100%</option>
              </select>
            </label>

            {/* 3. Back Button */}
            <button 
              onClick={() => setActiveReceipt(null)}
              className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-4 py-2.5 rounded-lg transition-all text-xs cursor-pointer active:scale-98"
            >
              <ArrowRight size={15} />
              <span>العودة للأرشيف</span>
            </button>

            {/* 4. Edit Invoice Button */}
            {!isEditingReceipt ? (
              <button
                onClick={() => {
                  if (!activeReceipt) return;
                  setReceiptEditableItems(activeReceipt.items.map(it => ({ ...it })));
                  setReceiptEditLog([]);
                  setReceiptNewProductId('');
                  setReceiptNewProductQuantity('1');
                  setReceiptEditCashDiscount(String(activeReceipt.discountAmount || 0));
                  setReceiptEditExpiryDiscount(String(activeReceipt.expiryDiscount || 0));
                  setIsEditingReceipt(true);
                }}
                title="تعديل الفاتورة"
                className="flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-100 font-bold px-4 py-2.5 rounded-lg transition-colors text-xs"
              >
                <Tag size={15} />
                <span>تعديل الفاتورة</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    // Save changes
                    if (!activeReceipt) return;
                    const updatedItems = receiptEditableItems.map(it => ({ ...it }));
                    const totalItems = updatedItems.reduce((acc, it) => acc + (it.sellPrice * it.quantity), 0);
                    const cashDiscount = Math.max(0, Number(receiptEditCashDiscount) || 0);
                    const expiryDiscount = Math.max(0, Number(receiptEditExpiryDiscount) || 0);
                    const newTotal = Math.max(0, totalItems - cashDiscount - expiryDiscount);
                    const newProfit = updatedItems.reduce((acc, it) => acc + ((it.sellPrice - it.buyPrice) * it.quantity), 0) - cashDiscount - expiryDiscount;
                    const updatedSale: Sale = {
                      ...activeReceipt,
                      items: updatedItems,
                      totalAmount: newTotal,
                      totalProfit: newProfit,
                      discountAmount: cashDiscount,
                      expiryDiscount,
                      paidAmount: activeReceipt.paidAmount,
                      remainingAmount: Math.max(0, newTotal - activeReceipt.paidAmount)
                    };
                    try {
                      const key = `sale_edit_log_${activeReceipt.id}`;
                      const existing = JSON.parse(localStorage.getItem(key) || '[]');
                      const merged = Array.isArray(existing) ? [...existing, ...receiptEditLog] : [...receiptEditLog];
                      localStorage.setItem(key, JSON.stringify(merged));
                    } catch (e) {
                      console.warn('Failed to save receipt edit log', e);
                    }
                    if (onUpdateSale) onUpdateSale(updatedSale);
                    setActiveReceipt(updatedSale);
                    setIsEditingReceipt(false);
                    setReceiptEditLog([]);
                    setReceiptNewProductId('');
                    setReceiptNewProductQuantity('1');
                    setReceiptEditCashDiscount('0');
                    setReceiptEditExpiryDiscount('0');
                  }}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg transition-colors text-xs"
                >
                  <Check size={15} />
                  <span>حفظ التغييرات</span>
                </button>

                <button
                  onClick={() => {
                    // restore originals
                    if (!activeReceipt) return;
                    setReceiptEditableItems(activeReceipt.items.map(it => ({ ...it })));
                    setReceiptEditLog(prev => [...prev, { action: 'restore_originals', timestamp: new Date().toISOString() }]);
                  }}
                  title="استرجاع القيم الأصلية"
                  className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-4 py-2.5 rounded-lg transition-all text-xs"
                >
                  استعادة القيم الأصلية
                </button>

                <button
                  onClick={() => {
                    // cancel
                    setIsEditingReceipt(false);
                    setReceiptEditableItems([]);
                    setReceiptEditLog([]);
                    setReceiptEditCashDiscount('0');
                    setReceiptEditExpiryDiscount('0');
                  }}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-4 py-2.5 rounded-lg transition-all text-xs"
                >
                  إلغاء
                </button>
              </>
            )}
          </div>
        </div>

        {/* Custom modal for iframe sandbox print block */}
        <AnimatePresence>
          {showIframePrintModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden"
              >
                <div className="bg-amber-500 p-5 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={20} className="shrink-0" />
                    <h3 className="font-bold text-sm">قيود أمان المتصفح (حظر نوافذ الطباعة)</h3>
                  </div>
                  <button 
                    onClick={() => setShowIframePrintModal(false)}
                    className="text-white/80 hover:text-white cursor-pointer transition-colors p-1"
                  >
                    <XIcon size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    المتصفح يمنع استدعاء أمر الطباعة المباشر <strong>window.print()</strong> داخل إطار المعاينة الصغير (Sandbox Iframe) لحمايتك.
                  </p>
                  
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-right space-y-2">
                    <p className="text-xs font-bold text-slate-800">💡 الحل السريع والمباشر:</p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      يرجى فتح التطبيق في <strong>علامة تبويب كاملة ومستقلة</strong> عن طريق الضغط على زر "فتح في نافذة جديدة" المتواجد أعلى يمين شاشة المعاينة (أيقونة المربع وبداخله سهم مائل). هناك ستعمل الطباعة وتصدير PDF بكفاءة ١٠٠٪!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-500">رابط التطبيق المباشر:</label>
                    <div className="flex gap-2 font-mono">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer border border-slate-200 font-sans"
                      >
                        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                      </button>
                      <input 
                        type="text" 
                        readOnly 
                        value={window.location.href} 
                        className="w-full text-left bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg outline-none text-slate-500 truncate"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
                  <button
                    onClick={() => setShowIframePrintModal(false)}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs px-4 py-2.5 rounded-lg transition-all font-bold cursor-pointer"
                  >
                    إغلاق التنبيه
                  </button>
                  <button
                    onClick={() => {
                      window.open(window.location.href, '_blank');
                      setShowIframePrintModal(false);
                    }}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2.5 rounded-lg transition-all font-bold cursor-pointer shadow-xs active:scale-98"
                  >
                    <ExternalLink size={14} />
                    <span>الذهاب والطباعة فوراً</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Notice for iframe environments (Hidden on Print) */}
        {isInIframe && (
          <div className="no-print bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-900 text-xs leading-relaxed max-w-4xl mx-auto shadow-xs">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="font-bold">تنبيه لضمان عمل الطباعة وحفظ الـ PDF بشكل سليم:</p>
              <p>
                بما أنك تستعرض التطبيق حالياً داخل إطار المعاينة الجانبي، فقد تقوم سياسات الأمان في متصفحك بحظر نوافذ الطباعة (print dialogue).
              </p>
              <p className="font-semibold text-amber-950 mt-1">
                💡 الحل الأمثل: يرجى الضغط على زر "فتح في علامة تبويب جديدة" (الأيقونة ذات السهم أعلى يمين الشاشة) لفتح التطبيق بشكل كامل ومستقل، وستعمل ميزة الطباعة وحفظ PDF على الفور وبأعلى دقة!
              </p>
            </div>
          </div>
        )}

        {/* Printable Invoice Sheet Container */}
        <style dangerouslySetInnerHTML={{__html: `
          #printable-invoice, #printable-invoice * {
            letter-spacing: 0px !important;
            letter-spacing: normal !important;
          }

          #printable-invoice .invoice-unit-price {
            color: #000000 !important;
            font-weight: 800 !important;
          }

          @page {
            size: A4 portrait;
            margin: 5mm;
          }

          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }

            #printable-invoice {
              zoom: var(--invoice-print-scale);
              width: calc(100% / var(--invoice-print-scale)) !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 12px !important;
              border: 0 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            #printable-invoice .space-y-8 {
              row-gap: 10px !important;
            }

            #printable-invoice .space-y-6 {
              row-gap: 8px !important;
            }

            #printable-invoice table {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            #printable-invoice tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            #printable-invoice .no-print {
              display: none !important;
            }
          }
        `}} />
        <div 
          id="printable-invoice" 
          style={{ '--invoice-print-scale': String(Math.max(0.42, Math.min(1, 18 / Math.max(activeReceipt.items.length, 1)))) } as React.CSSProperties}
          className="bg-white rounded-xl border border-slate-250 shadow-md p-8 max-w-4xl mx-auto space-y-8"
        >
          {/* Invoice Corporate Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-6">
            <div className="space-y-2 text-right">
              <h2 className="text-xl font-black text-slate-900">{companySettings.companyName}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {companySettings.commercialRegister && `سجل تجاري رقم: ${companySettings.commercialRegister}`}
                {companySettings.commercialRegister && companySettings.taxNumber && ' / '}
                {companySettings.taxNumber && `بطاقة ضريبية رقم: ${companySettings.taxNumber}`}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {companySettings.phone && `الهاتف: ${companySettings.phone}`}
                {companySettings.phone && companySettings.email && ' / '}
                {companySettings.email && `البريد: ${companySettings.email}`}
              </p>
            </div>
            <div className="space-y-2 sm:text-left text-right min-w-[200px] sm:self-center">
              <div className="inline-block bg-slate-900 text-white font-black text-xs px-4 py-1.5 rounded-md uppercase">
                فاتورة بيع مبسطة
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1">
                رقم الفاتورة: <b className="text-slate-900 font-bold text-sm">#{activeReceipt.id}</b>
              </div>
              <div className="text-xs text-slate-500">
                تاريخ المعاملة: <b className="text-slate-900 font-mono font-medium">{new Date(activeReceipt.date).toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' })}</b>
              </div>
            </div>
          </div>

          {/* Customer & Merchant Metadata Grid */}
          <div id="invoice-parties" className="invoice-parties grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200/80">
            <div className="space-y-2.5 text-right">
              <h3 className="text-xs font-bold text-indigo-600 uppercase border-b border-indigo-100 pb-1.5">بيانات العميل (الطرف الثاني)</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-450 font-semibold">اسم العميل بالكامل:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.customerName}</span>
                </div>
                {activeReceipt.customerCode && (
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-semibold">كود العميل الموحد:</span>
                    <span className="font-mono font-bold text-indigo-600">{activeReceipt.customerCode}</span>
                  </div>
                )}
                {activeReceipt.customerAddress && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-450 font-semibold shrink-0">عنوان العميل:</span>
                    <span className="text-slate-800 font-medium text-left">{activeReceipt.customerAddress}</span>
                  </div>
                )}
                {/* Search for client phone if registerd */}
                {(() => {
                  const cust = customers.find(c => c.id === activeReceipt.customerCode);
                  if (cust && cust.phone) {
                    return (
                      <div className="flex justify-between">
                        <span className="text-slate-450 font-semibold">رقم هاتف العميل:</span>
                        <span className="font-mono text-slate-900">{cust.phone}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            <div className="space-y-2.5 text-right">
              <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-200 pb-1.5 font-sans">معلومات جهة البيع (الطرف الأول)</h3>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-450 font-semibold">الجهة البائعة:</span>
                  <span className="font-bold text-slate-900">{companySettings.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 font-semibold">المستودع الرئيسي:</span>
                  <span className="font-medium text-slate-800">{companySettings.mainWarehouse}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 font-semibold">الفرع المحلي المباشر:</span>
                  <span className="font-medium text-slate-800">{companySettings.localBranch}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div
            className="invoice-items-scroll w-full max-w-full border border-slate-200 rounded-xl overflow-x-auto overscroll-x-contain shadow-2xs"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
          >
            <table className="invoice-items-table min-w-[900px] w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold border-b border-slate-200">
                  <th className="py-3 px-4 font-bold text-right">#</th>
                  <th className="py-3 font-bold text-right">الصنف / اسم المنتج بالكامل</th>
                  <th className="py-3 font-bold text-center">سعر الوحدة</th>
                  <th className="py-3 font-bold text-center">الكمية</th>
                  <th className="py-3 px-4 font-bold text-left">المجموع الإجمالي</th>
                  <th className="invoice-action-column py-3 px-3 font-bold text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {(
                  // choose rows: editable items when editing, otherwise the activeReceipt items
                  (isEditingReceipt ? receiptEditableItems : activeReceipt.items)
                ).map((item, idx) => {
                  const editable = isEditingReceipt;
                  return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-450 font-mono">{idx + 1}</td>
                    <td className="py-3.5 font-bold text-slate-900">{item.productName}</td>
                    <td className="py-3.5 text-center font-mono text-slate-600">
                      {editable ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={Number(receiptEditableItems[idx].sellPrice).toFixed(2)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value || '0');
                            setReceiptEditableItems(prev => {
                              const next = [...prev];
                              const old = next[idx].sellPrice;
                              next[idx] = { ...next[idx], sellPrice: val, total: val * next[idx].quantity };
                              return next;
                            });
                            setReceiptEditLog(prev => [...prev, { productId: item.productId, field: 'sellPrice', oldValue: item.sellPrice, newValue: val, timestamp: new Date().toISOString() }]);
                          }}
                          className="w-24 text-center bg-slate-50 border border-slate-200 text-black font-bold text-xs px-2 py-1 rounded-md outline-none"
                        />
                      ) : (
                        <span className="invoice-unit-price">{item.sellPrice.toFixed(2)} ج.م</span>
                      )}
                    </td>
                    <td className="py-3.5 text-center font-mono font-bold text-slate-900">
                      {editable ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={receiptEditableItems[idx].quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value || '0');
                            setReceiptEditableItems(prev => {
                              const next = [...prev];
                              const old = next[idx].quantity;
                              next[idx] = { ...next[idx], quantity: val, total: next[idx].sellPrice * val, profit: (next[idx].sellPrice - next[idx].buyPrice) * val };
                              return next;
                            });
                            setReceiptEditLog(prev => [...prev, { productId: item.productId, field: 'quantity', oldValue: item.quantity, newValue: val, timestamp: new Date().toISOString() }]);
                          }}
                          className="w-20 text-center bg-slate-50 border border-slate-200 text-xs px-2 py-1 rounded-md outline-none font-bold"
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-left font-mono font-bold text-slate-950">{( (editable ? receiptEditableItems[idx].sellPrice : item.sellPrice) * (editable ? receiptEditableItems[idx].quantity : item.quantity) ).toFixed(2)} ج.م</td>
                    <td className="invoice-action-column bg-white py-3.5 px-2 text-center">
                      {editable && (
                        <button
                          onClick={() => {
                            // remove item at idx from editable items
                            const removed = receiptEditableItems[idx];
                            setReceiptEditableItems(prev => prev.filter((_, i) => i !== idx));
                            setReceiptEditLog(prev => [...prev, { action: 'delete_item', productId: removed.productId, oldValue: removed, timestamp: new Date().toISOString() }]);
                          }}
                          title="حذف الصنف من الفاتورة"
                          aria-label="حذف الصنف من الفاتورة"
                          className="inline-flex h-8 w-8 items-center justify-center text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-md transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          {isEditingReceipt && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl no-print">
              <div className="flex-1">
                <label className="block text-xs font-bold text-emerald-900 mb-1.5">إضافة صنف إلى الفاتورة</label>
                <select
                  value={receiptNewProductId}
                  onChange={(event) => setReceiptNewProductId(event.target.value)}
                  className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-xs outline-none"
                >
                  <option value="">اختر الصنف</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - المخزون: {product.stock}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-28">
                <label className="block text-xs font-bold text-emerald-900 mb-1.5">الكمية</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={receiptNewProductQuantity}
                  onChange={(event) => setReceiptNewProductQuantity(event.target.value)}
                  className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-xs text-center outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const product = products.find(item => item.id === receiptNewProductId);
                  const quantity = Math.floor(Number(receiptNewProductQuantity));
                  if (!product || !Number.isFinite(quantity) || quantity < 1) {
                    alert('اختر صنفًا وأدخل كمية صحيحة.');
                    return;
                  }

                  const existingItem = receiptEditableItems.find(item => item.productId === product.id);
                  const existingQuantity = existingItem?.quantity || 0;
                  if (existingQuantity + quantity > product.stock + existingQuantity) {
                    alert(`الكمية المطلوبة تتجاوز المخزون المتوفر (${product.stock}).`);
                    return;
                  }

                  setReceiptEditableItems(previousItems => {
                    const itemIndex = previousItems.findIndex(item => item.productId === product.id);
                    if (itemIndex >= 0) {
                      const nextItems = [...previousItems];
                      const nextQuantity = nextItems[itemIndex].quantity + quantity;
                      nextItems[itemIndex] = {
                        ...nextItems[itemIndex],
                        quantity: nextQuantity,
                        total: product.sellPrice * nextQuantity,
                        profit: (product.sellPrice - product.buyPrice) * nextQuantity
                      };
                      return nextItems;
                    }

                    return [...previousItems, {
                      productId: product.id,
                      productName: product.name,
                      quantity,
                      buyPrice: product.buyPrice,
                      sellPrice: product.sellPrice,
                      total: product.sellPrice * quantity,
                      profit: (product.sellPrice - product.buyPrice) * quantity
                    }];
                  });
                  setReceiptEditLog(previousLog => [...previousLog, {
                    action: 'add_item',
                    productId: product.id,
                    quantity,
                    timestamp: new Date().toISOString()
                  }]);
                  setReceiptNewProductId('');
                  setReceiptNewProductQuantity('1');
                }}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg transition-colors text-xs"
              >
                <Plus size={15} />
                إضافة الصنف
              </button>
            </div>
          )}

          {/* Financial calculations & Signature Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Notes & Terms */}
            <div className="space-y-4 text-right self-start">
              {activeReceipt.notes && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <b className="text-slate-800 block mb-1">ملاحظات وشروط الفاتورة:</b>
                  {activeReceipt.notes}
                </div>
              )}
              <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50 text-[10px] text-slate-500 leading-relaxed space-y-1">
                <p className="font-bold text-indigo-950">ملاحظات هامة للطباعة والاستلام:</p>
                <p>• تعتبر هذه الفاتورة مستند استلام سليم لكافة البضائع الموضحة أعلاه.</p>
                <p>• يُرجى مراجعة كافة الكميات والأسعار قبل مغادرة نقطة التوريد.</p>
              </div>
            </div>

            {/* Price Calculations Column */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-xs space-y-3">
              <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-2">
                <span className="font-semibold">إجمالي الأصناف والمنتجات:</span>
                <span className="font-mono font-bold text-slate-800">
                  {activeReceipt.items.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0).toFixed(2)} ج.م
                </span>
              </div>

              {isEditingReceipt && (
                <div className="space-y-3 border-b border-slate-200 pb-3 no-print">
                  <label className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-rose-700">خصم نقدي:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={receiptEditCashDiscount}
                      onChange={(event) => setReceiptEditCashDiscount(event.target.value)}
                      className="w-28 bg-white border border-rose-200 rounded-md px-2 py-1 text-center font-mono outline-none"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-amber-700">خصم الإكسباير:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={receiptEditExpiryDiscount}
                      onChange={(event) => setReceiptEditExpiryDiscount(event.target.value)}
                      className="w-28 bg-white border border-amber-200 rounded-md px-2 py-1 text-center font-mono outline-none"
                    />
                  </label>
                </div>
              )}
              
              {/* Calculate discount if any */}
              {(() => {
                const totalItems = activeReceipt.items.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0);
                const discount = totalItems - activeReceipt.totalAmount;
                if (discount > 0.01) {
                  return (
                    <div className="flex justify-between text-rose-700 border-b border-slate-200 pb-2">
                      <span className="font-semibold">خصم نقدي مباشر:</span>
                      <span className="font-mono font-bold">-{discount.toFixed(2)} ج.م</span>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex justify-between text-slate-900 font-bold text-sm border-b border-slate-250 pb-2.5">
                <span>الصافي المطلوب سداده:</span>
                <span className="font-mono text-indigo-700 text-base">{activeReceipt.totalAmount.toFixed(2)} ج.م</span>
              </div>

              <div className="flex justify-between text-slate-700 font-semibold border-b border-slate-200 pb-2">
                <span>المبلغ المدفوع نقداً:</span>
                <span className="font-mono text-emerald-700 font-bold">{activeReceipt.paidAmount.toFixed(2)} ج.م</span>
              </div>

              <div className="flex justify-between font-bold text-slate-950">
                <span>المتبقي (حساب آجل):</span>
                <span className={`font-mono text-sm ${activeReceipt.remainingAmount > 0 ? 'text-amber-800 font-black' : 'text-slate-400'}`}>
                  {activeReceipt.remainingAmount.toFixed(2)} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Seal and Signatures */}
          <div className="pt-8 border-t border-slate-100 flex justify-between items-center text-center text-xs text-slate-450 gap-6">
            <div className="space-y-6 flex-1">
              <span className="block font-semibold">توقيع المستلم (العميل)</span>
              <div className="h-10 border-b border-dashed border-slate-250 w-2/3 mx-auto font-sans"></div>
            </div>
            <div className="space-y-6 flex-1">
              <span className="block font-semibold">الختم الرسمي للجهة البائعة</span>
              <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-full mx-auto flex items-center justify-center font-mono text-[9px] text-slate-400 font-bold border-dashed uppercase">
                STAMP
              </div>
            </div>
            <div className="space-y-6 flex-1">
              <span className="block font-semibold">توقيع المسؤول المالي / المحاسب</span>
              <div className="h-10 border-b border-dashed border-slate-250 w-2/3 mx-auto font-sans"></div>
            </div>
          </div>
        </div>

        {/* Bottom Back Button (Screen Only) */}
        <div className="no-print flex justify-center pt-2">
          <button 
            onClick={() => setActiveReceipt(null)}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3 rounded-xl transition-all text-xs cursor-pointer shadow-md hover:shadow-lg active:scale-98"
          >
            <ArrowRight size={14} />
            <span>الرجوع لقائمة المبيعات والأرشيف</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="sales-tab" dir="rtl">
      {/* Title & Internal Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">إدارة فواتير المبيعات ونقاط البيع</h1>
          <p className="text-xs text-slate-500 mt-1">سجل معاملاتك، تتبع الأرباح المباشرة واحسب الديون والآجل للزبائن</p>
        </div>
        
        {/* Sub Navigation Tabs */}
        <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-lg self-start">
          <button 
            onClick={() => setSalesSubTab('pos')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
              salesSubTab === 'pos' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            نقطة بيع جديدة (POS)
          </button>
          <button 
            onClick={() => setSalesSubTab('history')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
              salesSubTab === 'history' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-550 hover:text-slate-800'
            }`}
          >
            سجل الفواتير السابقة ({sales.length})
          </button>
        </div>
      </div>

      {salesSubTab === 'pos' ? (
        /* ================== POS TERMINAL VIEW ================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Right Column: Add items form & Cart items (2 Cols wide) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Adding item form */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <ShoppingCart size={15} className="text-slate-900" />
                <span>إضافة صنف للفاتورة الحالية</span>
              </h2>

              <form onSubmit={handleAddToInvoice} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                {/* Product Code / Barcode Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">كود / باركود المنتج</label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text"
                        value={typedProductCode}
                        placeholder="ادخل الكود أو اسم المنتج أو الفئة بالعربي"
                        onChange={(e) => {
                          const code = e.target.value;
                          setTypedProductCode(code);
                          setSuggestionsVisible(true);
                          setHighlightedSuggestion(0);

                          const match = findExactProductMatch(code);
                          if (match) {
                            setSelectedProductId(match.id);
                          } else {
                            setSelectedProductId('');
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setSuggestionsVisible(false);
                            if (typedProductCode.trim()) {
                              updateRecentSearches(typedProductCode);
                            }
                          }, 150);
                        }}
                        onFocus={() => {
                          setSuggestionsVisible(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setSuggestionsVisible(true);
                            setHighlightedSuggestion((current) =>
                              current >= visibleSuggestions.length - 1 ? 0 : current + 1
                            );
                            return;
                          }

                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSuggestionsVisible(true);
                            setHighlightedSuggestion((current) =>
                              current <= 0 ? visibleSuggestions.length - 1 : current - 1
                            );
                            return;
                          }

                          if (e.key === 'Enter' || e.key === 'Tab') {
                            const typedTrimmed = typedProductCode.trim();
                            if (suggestionsVisible && visibleSuggestions.length) {
                              e.preventDefault();
                              const product = visibleSuggestions[highlightedSuggestion];
                              if (product) {
                                setTypedProductCode(product.name);
                                setSelectedProductId(product.id);
                                setSelectedQuantity('1');
                                setSuggestionsVisible(false);
                                updateRecentProducts(product.id);
                                updateRecentSearches(product.name);
                              }
                              return;
                            }

                            if (typedTrimmed) {
                              const exactMatch = findExactProductMatch(typedTrimmed);
                              if (exactMatch) {
                                e.preventDefault();
                                setSelectedProductId(exactMatch.id);
                                if (addSelectedProductToCart(1, exactMatch.id)) {
                                  setSelectedProductId('');
                                  setTypedProductCode('');
                                  setSelectedQuantity('1');
                                  setSuggestionsVisible(false);
                                }
                                return;
                              }
                              updateRecentSearches(typedTrimmed);
                            }
                          }

                          if (e.key === 'Escape') {
                            setSuggestionsVisible(false);
                          }
                        }}
                        className="w-full text-right bg-slate-50 border border-slate-200 text-xs pl-10 pr-3 py-2.5 rounded-lg outline-none focus:border-slate-900 focus:bg-white font-mono font-bold"
                      />
                      {typedProductCode && (
                        <button
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setTypedProductCode('');
                            setSelectedProductId('');
                            setSuggestionsVisible(true);
                            setHighlightedSuggestion(0);
                          }}
                          className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-700"
                          aria-label="مسح البحث"
                        >
                          <XIcon size={16} />
                        </button>
                      )}

                      <AnimatePresence>
                        {suggestionsVisible && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
                          >
                            {visibleSuggestions.length > 0 ? (
                              visibleSuggestions.map((product, index) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  ref={(el) => (suggestionRefs.current[index] = el)}
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    setTypedProductCode(product.name);
                                    setSelectedProductId(product.id);
                                    setSelectedQuantity('1');
                                    setSuggestionsVisible(false);
                                    updateRecentProducts(product.id);
                                    updateRecentSearches(product.name);
                                  }}
                                  className={`w-full text-right px-3 py-2 text-xs text-slate-700 transition-colors ${
                                    index === highlightedSuggestion ? 'bg-slate-100' : 'bg-white'
                                  } hover:bg-slate-100`}
                                >
                                  <span className="block font-semibold">{product.name}</span>
                                  <span className="block text-slate-500 text-[11px]">{product.id} • {product.category} • {product.stock} قطعة • {product.sellPrice} ج.م</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-3 text-right text-xs text-slate-500">لا يوجد نتائج</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Select Product */}
                <div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <label className="block text-xs font-semibold text-slate-500">أو اختر المنتج من القائمة</label>
                      <label className="inline-flex items-center gap-2 text-[11px] text-slate-500">
                        <input
                          type="checkbox"
                          checked={showInStockOnly}
                          onChange={() => setShowInStockOnly((prev) => !prev)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900"
                        />
                        <span>عرض المنتجات المتوفرة فقط</span>
                      </label>
                    </div>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedProductId(val);
                        setTypedProductCode(val);
                        setSelectedQuantity('1');
                      }}
                      required={!typedProductCode}
                      className="w-full text-right bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-slate-900 focus:bg-white cursor-pointer font-bold"
                    >
                      <option value="">-- اختر منتج --</option>
                      {(typedProductCode.trim() ? filteredProducts : products)
                        .filter((p) => !showInStockOnly || p.stock > 0)
                        .map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                            {p.name} ({p.stock} قطعة بالداخل) - {p.sellPrice} ج.م
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">الكمية المطلوبة</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    disabled={!selectedProductId}
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(e.target.value)}
                    className="w-full text-right bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-slate-900 focus:bg-white font-mono"
                  />
                </div>

                {/* Submit button */}
                <button 
                  type="submit"
                  disabled={!selectedProductId}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors active:scale-98 disabled:bg-slate-100 disabled:text-slate-400 text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>أضف للسلة</span>
                </button>
              </form>

              {/* Selection details callback */}
              {currentProduct && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500">سعر القطعة: <b className="text-slate-800">{currentProduct.sellPrice} ج.م</b></span>
                  <span className="text-slate-500">المخزون المتوفر: <b className={`${currentProduct.stock <= currentProduct.minStockAlert ? 'text-amber-600' : 'text-slate-800'}`}>{currentProduct.stock} قطعة</b></span>
                  <span className="text-slate-900 font-bold">المجموع: {currentProduct.sellPrice * (parseInt(selectedQuantity) || 0)} ج.م</span>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">الأصناف المضافة للفاتورة</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 pb-3">
                      <th className="pb-3 font-semibold">الصنف</th>
                      <th className="pb-3 font-semibold text-center">سعر الوحدة</th>
                      <th className="pb-3 font-semibold text-center">الكمية</th>
                      <th className="pb-3 font-semibold text-left">الإجمالي</th>
                      <th className="pb-3 font-semibold text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {cartItems.length > 0 ? (
                      cartItems.map((item) => (
                        <tr key={item.productId} className="text-slate-700 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3">
                            <span className="font-bold text-slate-900">{item.productName}</span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">باركود: {item.productId}</span>
                          </td>
                          <td className="py-3 text-center font-mono">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={Number(item.sellPrice).toFixed(2)}
                              onChange={(e) => handleUpdateCartItemPrice(item.productId, parseFloat(e.target.value || '0'))}
                              className="w-20 text-center bg-slate-50 border border-slate-200 text-xs px-2 py-1 rounded-md outline-none"
                            /> ج.م
                          </td>
                          <td className="py-3 text-center font-mono font-bold text-slate-900">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateCartItemQuantity(item.productId, parseInt(e.target.value || '0'))}
                              className="w-20 text-center bg-slate-50 border border-slate-200 text-xs px-2 py-1 rounded-md outline-none font-bold"
                            />
                          </td>
                          <td className="py-3 text-left font-mono font-bold text-slate-800">{item.total.toFixed(2)} ج.م</td>
                          <td className="py-3 text-center flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                // reset to original if available
                                const orig = cartOriginals[item.productId];
                                if (orig) {
                                  handleUpdateCartItemPrice(item.productId, orig.sellPrice);
                                  handleUpdateCartItemQuantity(item.productId, orig.quantity);
                                  recordEdit({ productId: item.productId, field: 'reset', oldValue: { sellPrice: item.sellPrice, quantity: item.quantity }, newValue: orig });
                                }
                              }}
                              title="استعادة الافتراضي"
                              className="p-1.5 text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              استعادة
                            </button>

                            <button 
                              onClick={() => handleRemoveFromCart(item.productId)}
                              className="p-1.5 text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-md transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400">
                          🛒 السلة فارغة حالياً. اختر منتجاً من الأعلى وأضفه لبدء البيع.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Left Column: Checkout Summary & Customer details (1 Col wide) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 h-fit space-y-6">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <UserCheck size={15} className="text-slate-900" />
              <span>تفاصيل الدفع والعميل</span>
            </h2>

            <div className="space-y-4">
              {/* Registered Customer Selection */}
              {customers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">اختر من العملاء المسجلين</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      const cid = e.target.value;
                                      setSelectedCustomerId(cid);
                      const chosen = customers.find(c => c.id === cid);
                      if (chosen) {
                        setCustomerName(chosen.name);
                        setExpiryDiscount(chosen.expiryBalance || 0);
                        setExpiryDiscountApplied(chosen.expiryBalance || 0);
                      } else {
                        setCustomerName('');
                        setExpiryDiscount(0);
                        setExpiryDiscountApplied(0);
                      }
                    }}
                    className="w-full text-right bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-slate-900 focus:bg-white cursor-pointer font-bold"
                  >
                    <option value="">-- عميل عام (غير مسجل) --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {selectedCustomerId ? 'اسم العميل المختار (مسجل)' : 'اسم العميل بالكامل (اختياري)'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <User size={14} />
                  </span>
                  <input 
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={!!selectedCustomerId}
                    placeholder="زبون عام / زبون آجل"
                    className={`w-full text-right text-xs px-9 py-2.5 rounded-lg outline-none border transition-all ${
                      selectedCustomerId 
                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed font-bold' 
                        : 'bg-slate-50 border-slate-200 focus:border-slate-900 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Customer Preview Card */}
              {selectedCustomerId && (() => {
                const chosen = customers.find(c => c.id === selectedCustomerId);
                if (!chosen) return null;
                return (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">كود العميل:</span>
                      <span className="font-mono font-bold text-slate-900">{chosen.id}</span>
                    </div>
                    {chosen.address && (
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 font-semibold shrink-0">عنوان العميل:</span>
                        <span className="text-right font-medium text-slate-950">{chosen.address}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">رقم الهاتف:</span>
                      <span className="font-mono text-slate-900">{chosen.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">رصيد الإكسير المتاح:</span>
                      <span className="font-mono text-indigo-800 font-bold">{chosen.expiryBalance.toFixed(2)} ج.م</span>
                    </div>
                  </div>
                );
              })()}

              {/* Discount Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex justify-between">
                  <span>خصم مباشر بالفاتورة (جنية)</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Tag size={10} /> خصم مالي</span>
                </label>
                <input 
                  type="number"
                  min="0"
                  max={subTotal}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full text-right bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-slate-900 focus:bg-white font-mono"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex justify-between">
                  <span>خصم نقدي للاكسبير</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Tag size={10} /> رصيد العميل</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={expiryDiscount}
                  value={expiryDiscountApplied.toFixed(2)}
                  onChange={(e) => setExpiryDiscountApplied(Math.min(expiryDiscount, parseFloat(e.target.value || '0')))}
                  className="w-full text-right bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-slate-900 focus:bg-white font-mono"
                  placeholder="0.00"
                />
                <span className="text-[10px] text-slate-400 block mt-1">يتم تعبئته آلياً من رصيد الإكسير المسجل على العميل المسجل. يمكن تعديل الكمية المستخدمة ضمن الحد المتاح.</span>
              </div>

              {/* Paid Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">المبلغ المدفوع فعلياً (جنية)</label>
                <input 
                  type="number"
                  min="0"
                  max={grandTotal}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={`الكل: ${grandTotal.toFixed(2)}`}
                  className="w-full text-right bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-slate-900 focus:bg-white font-mono"
                />
                <span className="text-[10px] text-slate-400 block mt-1">اتركه فارغاً إذا دفع الزبون الفاتورة بالكامل</span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">ملاحظات الفاتورة (اختياري)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full text-right bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-slate-900 focus:bg-white resize-none"
                  placeholder="مثال: تسليم مبيعات الدفعة الثانية"
                />
              </div>

              {/* Financial Breakdown Panel */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono">{subTotal.toFixed(2)} ج.م</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-rose-700 font-semibold">
                    <span>الخصم المطبق:</span>
                    <span className="font-mono">-{discount.toFixed(2)} ج.م</span>
                  </div>
                )}
                {expiryDiscount > 0 && (
                  <div className="flex items-center justify-between text-indigo-700 font-semibold">
                    <span>رصيد الإكسير المستحق:</span>
                    <span className="font-mono">-{expiryDiscount.toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-900 font-bold border-t border-slate-200 pt-2.5 text-sm">
                  <span>صافي الفاتورة الكلي:</span>
                  <span className="font-mono text-slate-900">{grandTotal.toFixed(2)} ج.م</span>
                </div>
                
                {remainingAmount > 0 && (
                  <div className="flex items-center justify-between text-amber-900 font-bold bg-amber-50 p-2 rounded border border-amber-200 mt-1">
                    <span>المتبقي في الآجل (دين):</span>
                    <span className="font-mono">+{remainingAmount.toFixed(2)} ج.م</span>
                  </div>
                )}
              </div>

              {/* Checkout Trigger */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { loadSavedLogKeys(); setShowEditLogModal(true); }}
                  className="flex-0 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-50"
                >
                  سجل التعديلات
                </button>

                <button 
                  type="button"
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors active:scale-98 disabled:bg-slate-100 disabled:text-slate-400 text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle size={15} />
                  <span>حفظ وطباعة الفاتورة</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ================== INVOICE HISTORY VIEW ================== */
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText size={15} className="text-slate-900" />
              <span>أرشيف وسجل المبيعات</span>
            </h2>

            {/* Search Input in History */}
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-450">
                <Search size={14} />
              </span>
              <input 
                type="text"
                placeholder="ابحث برقم الفاتورة أو العميل..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full text-right bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs px-9 py-2 rounded-lg outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-450 bg-slate-50/50">
                  <th className="py-3 px-3 font-bold">رقم الفاتورة</th>
                  <th className="py-3 font-bold">تاريخ البيع</th>
                  <th className="py-3 font-bold">اسم العميل</th>
                  <th className="py-3 font-bold">محتويات الفاتورة</th>
                  <th className="py-3 font-bold text-left">قيمة الفاتورة</th>
                  <th className="py-3 font-bold text-left">المدفوع</th>
                  <th className="py-3 font-bold text-left">المتبقي (آجل)</th>
                  <th className="py-3 font-bold text-center">حالة الربح</th>
                  <th className="py-3 px-3 font-bold text-center">خيارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredSales.length > 0 ? (
                  filteredSales.slice().reverse().map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-slate-900">#{sale.id}</td>
                      <td className="py-3.5 text-slate-500">{new Date(sale.date).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className="py-3.5 font-bold text-slate-800">
                        <div>{sale.customerName}</div>
                        {sale.customerCode && (
                          <div className="text-[10px] text-indigo-600 font-mono mt-0.5">كود: {sale.customerCode}</div>
                        )}
                        {sale.customerAddress && (
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5 max-w-[150px] truncate" title={sale.customerAddress}>
                            العنوان: {sale.customerAddress}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-500 max-w-[180px] truncate" title={sale.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}>
                        {sale.items.map(i => `${i.productName} (${i.quantity})`).join('، ')}
                      </td>
                      <td className="py-3.5 text-left font-mono font-bold text-slate-900">{sale.totalAmount.toFixed(2)} ج.م</td>
                      <td className="py-3.5 text-left font-mono font-semibold text-slate-800">{sale.paidAmount.toFixed(2)} ج.م</td>
                      <td className="py-3.5 text-left font-mono">
                        <span className={sale.remainingAmount > 0 ? 'text-amber-800 font-bold' : 'text-slate-400'}>
                          {sale.remainingAmount.toFixed(2)} ج.م
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="inline-block bg-slate-50 border border-slate-200 text-slate-700 font-bold font-mono px-2 py-0.5 rounded text-[10px]">
                          +{sale.totalProfit.toFixed(2)} ج.م
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => setActiveReceipt(sale)}
                            className="p-1.5 text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="عرض الفاتورة المصغرة"
                          >
                            <Printer size={13} />
                          </button>
                          <button 
                            onClick={() => setSaleToRefund(sale)}
                            className="p-1.5 text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                            title="إلغاء وارتجاع الفاتورة"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      لا توجد فواتير مبيعات مسجلة في الأرشيف تطابق معايير البحث.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Log Modal */}
      {showEditLogModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-start justify-center p-6 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl border border-slate-200 shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">سجلات تعديلات الفواتير</h3>
              <div className="flex items-center gap-2">
                <select
                  value={selectedLogKey || ''}
                  onChange={(e) => loadLogByKey(e.target.value || null)}
                  className="text-xs p-2 border border-slate-200 rounded bg-slate-50"
                >
                  <option value="">-- السجل الحالي قبل الحفظ --</option>
                  {savedLogKeys.map(k => (
                    <option key={k} value={k}>{k.replace('sale_edit_log_', '')}</option>
                  ))}
                </select>
                <button onClick={() => { setShowEditLogModal(false); setSelectedLogEntries([]); }} className="text-xs px-3 py-1 bg-slate-50 border rounded">اغلاق</button>
              </div>
            </div>

            <div className="max-h-72 overflow-auto text-xs font-mono bg-slate-50 p-3 rounded">
              {selectedLogKey === null ? (
                editLog.length === 0 ? (<div className="text-slate-400">لا توجد تعديلات حالية.</div>) : (
                  <div>
                    <div className="text-[11px] font-semibold mb-2">سجل التعديلات الحالي (لم يتم حفظه بعد)</div>
                    {editLog.map((e, idx) => (
                      <div key={idx} className="mb-1">[{e.timestamp}] {e.productId} — {e.field}: {JSON.stringify(e.oldValue)} → {JSON.stringify(e.newValue)}</div>
                    ))}
                  </div>
                )
              ) : (
                selectedLogEntries.length === 0 ? (
                  <div className="text-slate-400">السجل فارغ أو تعذر قراءته.</div>
                ) : (
                  selectedLogEntries.map((e, idx) => (
                    <div key={idx} className="mb-1">[{e.timestamp}] {e.productId} — {e.field}: {JSON.stringify(e.oldValue)} → {JSON.stringify(e.newValue)}</div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL - Mobile Friendly Digital Invoice / Receipt Print View */}
      <AnimatePresence>
        {/* Modal - Confirm Refund Sale */}
        {saleToRefund && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white rounded-xl w-full max-w-md border border-slate-200 shadow-xl overflow-hidden relative my-8 p-6 space-y-4 text-right animate-fade-in"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2 bg-rose-50 border border-rose-100 rounded-md text-rose-700">
                  <AlertTriangle size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">تأكيد استرجاع الفاتورة</h3>
              </div>
              
              <p className="text-xs text-slate-600 leading-relaxed">
                هل أنت متأكد من رغبتك في استرجاع الفاتورة رقم <b className="text-slate-900 font-mono">"{saleToRefund.id}"</b> بالكامل؟
                <span className="block mt-1.5 text-slate-700">العميل: <b className="text-slate-900">{saleToRefund.customerName}</b></span>
                <span className="block text-slate-700">القيمة الإجمالية: <b className="text-slate-900">{saleToRefund.totalAmount.toFixed(2)} ج.م</b></span>
                <span className="block mt-2 text-rose-600 font-semibold text-[10px]">سيتم مسح هذه الفاتورة من الأرشيف نهائياً وإرجاع كافة كميات الأصناف المشتراة إلى المخزن تلقائياً.</span>
              </p>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setSaleToRefund(null)}
                  className="flex-1 py-2 rounded-lg text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  تراجع
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    onRefundSale(saleToRefund.id);
                    setSaleToRefund(null);
                  }}
                  className="flex-1 py-2 rounded-lg text-white bg-rose-600 hover:bg-rose-700 font-semibold text-xs transition-colors cursor-pointer active:scale-98"
                >
                  نعم، استرجع الفاتورة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple Helper X close icon mapping
const X = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
