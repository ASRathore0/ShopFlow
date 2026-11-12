import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Receipt, Plus, Minus, Trash2, Search, QrCode, Printer,
  Share2, Check, RefreshCw, ShoppingCart, User, Phone,
  CreditCard, Banknote, Sparkles, AlertCircle, AlertTriangle, ArrowRight,
  Calendar, Layers, Filter, FileText, ChevronRight, CheckCircle2,
  DollarSign, Zap, Tag, Edit2, Volume2, ShieldCheck, Radio, Clock, X, UserCheck
} from 'lucide-react';
import { billingService } from '../services/billingService';
import ShopBillReceipt from './ShopBillReceipt';
import ManageSoundboxModal, { playSoundboxChime } from './ManageSoundboxModal';

export default function PosBillingView({
  shop,
  role = 'admin', // 'admin' | 'staff'
  onBack,
}) {
  const [activeSubTab, setActiveSubTab] = useState('pos'); // 'pos' | 'invoices'
  const [posMode, setPosMode] = useState('quick'); // 'quick' (no upload needed) | 'catalog' (search uploaded items)
  const [mobilePosTab, setMobilePosTab] = useState('entry'); // 'entry' | 'cart' (mobile screen switcher)

  const [loading, setLoading] = useState(true);
  const [billingEnabled, setBillingEnabled] = useState(true);
  const [soundboxEnabled, setSoundboxEnabled] = useState(false);
  const [shopConfig, setShopConfig] = useState(shop || {});
  const [nextSerialNo, setNextSerialNo] = useState(1);
  const [metrics, setMetrics] = useState({
    today_revenue: 0,
    today_bills_count: 0,
    total_revenue: 0,
    total_bills_count: 0,
  });

  // Soundbox & Multi-Account States
  const [isSoundboxModalOpen, setIsSoundboxModalOpen] = useState(false);
  const [soundboxDevices, setSoundboxDevices] = useState([]);
  const [selectedSoundbox, setSelectedSoundbox] = useState(null);
  const [soundboxPaymentReceived, setSoundboxPaymentReceived] = useState(false);
  const [soundboxUtr, setSoundboxUtr] = useState('');
  const [isSimulatingSoundbox, setIsSimulatingSoundbox] = useState(false);
  const [reconciliationData, setReconciliationData] = useState(null);
  const [isLoadingReconciliation, setIsLoadingReconciliation] = useState(false);
  const [overviewPeriod, setOverviewPeriod] = useState('daily'); // 'daily' | 'weekly' | 'monthly' | 'all'

  // Fast Quick-Item Entry (No Upload Required)
  const [quickName, setQuickName] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [quickQty, setQuickQty] = useState(1);
  const priceInputRef = useRef(null);
  const nameInputRef = useRef(null);

  // Products catalog for POS
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Cart / Bill State
  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [editingBill, setEditingBill] = useState(null);

  // Customer Autocomplete & History
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState(null);
  const customerSearchTimeoutRef = useRef(null);
  const customerBoxRef = useRef(null);

  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState('amount'); // 'amount' (default) | 'percent'
  const [discountPercentInput, setDiscountPercentInput] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'upi' | 'card' | 'partial'
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitUpiAmount, setSplitUpiAmount] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generated Bill for Receipt Modal
  const [activeReceiptBill, setActiveReceiptBill] = useState(null);

  // Invoices List State
  const [invoices, setInvoices] = useState([]);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoicePaymentFilter, setInvoicePaymentFilter] = useState('all');
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetBilling = async () => {
    try {
      setIsResetting(true);
      const res = await billingService.resetBillingData(role);
      showToast(res.message || 'Billing data successfully reset! Starting fresh from Bill #1.', 'success');
      setShowResetModal(false);
      fetchStatusAndProducts();
      loadInvoices(overviewPeriod);
      if (soundboxEnabled) {
        loadReconciliation(overviewPeriod);
      }
    } catch (err) {
      console.error('Failed to reset billing:', err);
      showToast(err.response?.data?.message || 'Failed to reset billing data.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Notification / Alert
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Lock background scrolling when any modal is open
  useEffect(() => {
    if (activeReceiptBill || isSoundboxModalOpen || showResetModal) {
      const originalBodyOverflow = document.body.style.overflow;
      const mainEl = document.querySelector('main');
      const originalMainOverflow = mainEl ? mainEl.style.overflow : '';

      document.body.style.overflow = 'hidden';
      if (mainEl) mainEl.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        if (mainEl) mainEl.style.overflow = originalMainOverflow;
      };
    }
  }, [activeReceiptBill, isSoundboxModalOpen, showResetModal]);

  // Handle mobile / WhatsApp phone input change with live customer lookup
  const handleCustomerPhoneChange = (val) => {
    setCustomerPhone(val);

    if (customerSearchTimeoutRef.current) {
      clearTimeout(customerSearchTimeoutRef.current);
    }

    const trimmed = val.trim();
    const digitsOnly = trimmed.replace(/\D/g, '');

    // If cashier clears the phone, clear selected profile
    if (!trimmed) {
      setSelectedCustomerProfile(null);
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
      setIsSearchingCustomer(false);
      return;
    }

    // Trigger lookup when at least 3 digits/chars typed
    if (digitsOnly.length >= 3 || trimmed.length >= 3) {
      setIsSearchingCustomer(true);
      customerSearchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await billingService.searchCustomers(trimmed, role);
          if (res && res.data) {
            setCustomerSuggestions(res.data);
            setShowCustomerSuggestions(res.data.length > 0);

            // Auto-match if exact 10 digits and top match matches exactly
            if (digitsOnly.length >= 10 && res.data.length > 0) {
              const exactMatch = res.data.find(
                (c) => c.customer_phone.replace(/\D/g, '') === digitsOnly
              ) || res.data[0];

              if (exactMatch && exactMatch.customer_name) {
                // If customerName is empty or walk-in, auto-suggest/fill
                if (!customerName || customerName.trim().toLowerCase() === 'walk-in customer') {
                  setCustomerName(exactMatch.customer_name);
                }
                if (exactMatch.customer_address && !customerAddress) {
                  setCustomerAddress(exactMatch.customer_address);
                }
                setSelectedCustomerProfile(exactMatch);
              }
            }
          }
        } catch (err) {
          console.warn('Customer search error:', err);
        } finally {
          setIsSearchingCustomer(false);
        }
      }, 250);
    } else {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
      setIsSearchingCustomer(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setCustomerPhone(customer.customer_phone || '');
    if (customer.customer_name && customer.customer_name.toLowerCase() !== 'walk-in customer') {
      setCustomerName(customer.customer_name);
    }
    if (customer.customer_address) {
      setCustomerAddress(customer.customer_address);
    }
    setSelectedCustomerProfile(customer);
    setShowCustomerSuggestions(false);
  };

  // Close customer suggestions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerBoxRef.current && !customerBoxRef.current.contains(e.target)) {
        setShowCustomerSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Resume / Edit an existing bill on the POS pad
  const handleStartEditBill = (billToEdit) => {
    if (!billToEdit) return;

    // Map existing bill items to cart format
    const mappedItems = (billToEdit.items || []).map((it, idx) => ({
      key: `item-edit-${it.id || idx}-${Date.now()}`,
      product_id: it.product_id || null,
      product_variant_id: it.product_variant_id || null,
      item_name: it.item_name || 'Item',
      variant_name: it.variant_name || null,
      quantity: it.quantity || 1,
      unit_price: parseFloat(it.unit_price) || 0,
      total_price: parseFloat(it.total_price) || ((it.quantity || 1) * (parseFloat(it.unit_price) || 0)),
    }));

    setCartItems(mappedItems);
    setCustomerName(
      billToEdit.customer_name && billToEdit.customer_name.toLowerCase() !== 'walk-in customer'
        ? billToEdit.customer_name
        : ''
    );
    setCustomerPhone(billToEdit.customer_phone || '');
    setCustomerAddress(billToEdit.customer_address || '');
    const disc = parseFloat(billToEdit.discount_amount) || 0;
    setDiscountAmount(disc);
    const subTot = parseFloat(billToEdit.subtotal) || 0;
    if (disc > 0 && subTot > 0) {
      const p = (disc / subTot) * 100;
      setDiscountPercentInput(Number.isInteger(p) ? String(p) : Number(p.toFixed(2)).toString());
      setDiscountType('percent');
    } else {
      setDiscountPercentInput('');
    }
    setTaxAmount(parseFloat(billToEdit.tax_amount) || 0);
    const mode = billToEdit.payment_method || 'cash';
    setPaymentMethod(mode);
    if (mode === 'partial' || mode === 'split') {
      setSplitCashAmount(billToEdit.split_cash_amount ? String(billToEdit.split_cash_amount) : '');
      setSplitUpiAmount(billToEdit.split_upi_amount ? String(billToEdit.split_upi_amount) : '');
    } else {
      setSplitCashAmount('');
      setSplitUpiAmount('');
    }
    setReceivedAmount(billToEdit.received_amount ? String(billToEdit.received_amount) : '');
    setNotes(billToEdit.notes || '');

    setEditingBill(billToEdit);
    setActiveReceiptBill(null); // Close the receipt modal
    setActiveSubTab('pos');     // Navigate to POS entry screen
    setMobilePosTab('cart');    // Open bill pad on mobile screens

    showToast(`✏️ Editing Bill #${billToEdit.bill_number || billToEdit.id}. Adjust items or details and tap Update Bill.`, 'info');
  };

  const handleCancelEdit = () => {
    setEditingBill(null);
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setSelectedCustomerProfile(null);
    setDiscountAmount(0);
    setDiscountType('amount');
    setDiscountPercentInput('');
    setPaymentMethod('cash');
    setSplitCashAmount('');
    setSplitUpiAmount('');
    setTaxAmount(0);
    setReceivedAmount('');
    setNotes('');
    showToast('Cancelled editing. Ready for fresh bill.', 'info');
  };

  // Preset default categories according to retail shop type
  const defaultItemTags = useMemo(() => {
    const type = shopConfig.shop_type || 'clothing';
    if (type.includes('cloth') || type.includes('wear') || type.includes('fashion')) {
      return ['Shirt', 'T-Shirt', 'Jeans', 'Trousers', 'Kurta', 'Lower / Track', 'Formal Suit', 'Jacket', 'Accessories', 'Alteration'];
    } else if (type.includes('footwear') || type.includes('shoe')) {
      return ['Casual Shoes', 'Formal Shoes', 'Sports Shoes', 'Sandals', 'Slippers', 'Socks', 'Polish / Cream'];
    } else if (type.includes('elect')) {
      return ['Charger', 'Cable', 'Earphones', 'Screen Guard', 'Back Cover', 'Adapter', 'Repair Service'];
    }
    return ['General Item', 'Item A', 'Item B', 'Accessories', 'Service Charge'];
  }, [shopConfig.shop_type]);

  // Customizable Quick Item Tags state with localStorage & shop settings caching
  const [customItemTags, setCustomItemTags] = useState(() => {
    if (shop?.customer_portal_settings?.quick_item_tags && Array.isArray(shop.customer_portal_settings.quick_item_tags) && shop.customer_portal_settings.quick_item_tags.length > 0) {
      return shop.customer_portal_settings.quick_item_tags;
    }
    try {
      const saved = localStorage.getItem(`pos_quick_tags_${shop?.id || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return null;
  });

  const [isManagingTags, setIsManagingTags] = useState(false);
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [editingTagText, setEditingTagText] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Active tags in use
  const activeItemTags = customItemTags || defaultItemTags;

  const persistQuickTags = async (newTags) => {
    setCustomItemTags(newTags);
    try {
      localStorage.setItem(`pos_quick_tags_${shopConfig?.id || shop?.id || 'default'}`, JSON.stringify(newTags));
    } catch (e) {}

    try {
      await billingService.updateQuickTags(newTags, role);
    } catch (err) {
      console.warn('Failed to sync quick tags to server:', err);
    }
  };

  const handleModifyTag = (index, newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed) {
      showToast('Tag name cannot be empty', 'error');
      return;
    }
    const updated = [...activeItemTags];
    updated[index] = trimmed;
    persistQuickTags(updated);
    setEditingTagIndex(null);
    setEditingTagText('');
    showToast(`Updated tag to "${trimmed}"`, 'success');
  };

  const handleDeleteTag = (index, e) => {
    if (e) e.stopPropagation();
    const removedName = activeItemTags[index];
    const updated = activeItemTags.filter((_, idx) => idx !== index);
    persistQuickTags(updated);
    showToast(`Deleted tag "${removedName}"`, 'info');
  };

  const handleAddCustomTag = (e) => {
    if (e) e.preventDefault();
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (activeItemTags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Tag "${trimmed}" already exists`, 'info');
      setNewTagInput('');
      return;
    }
    const updated = [...activeItemTags, trimmed];
    persistQuickTags(updated);
    setNewTagInput('');
    setIsAddingTag(false);
    showToast(`Added new tag "${trimmed}"`, 'success');
  };

  const handleResetDefaultTags = () => {
    persistQuickTags(defaultItemTags);
    showToast('Reset quick item tags to default categories', 'info');
  };

  // Customizable Frequent Price Presets state with localStorage & shop settings caching
  const defaultPricePresets = [199, 299, 499, 699, 799, 999, 1199, 1499, 1999];

  const [customPricePresets, setCustomPricePresets] = useState(() => {
    if (shop?.customer_portal_settings?.quick_price_presets && Array.isArray(shop.customer_portal_settings.quick_price_presets) && shop.customer_portal_settings.quick_price_presets.length > 0) {
      return shop.customer_portal_settings.quick_price_presets;
    }
    try {
      const saved = localStorage.getItem(`pos_price_presets_${shop?.id || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return null;
  });

  const [isManagingPrices, setIsManagingPrices] = useState(false);
  const [editingPriceIndex, setEditingPriceIndex] = useState(null);
  const [editingPriceText, setEditingPriceText] = useState('');
  const [newPriceInput, setNewPriceInput] = useState('');
  const [isAddingPrice, setIsAddingPrice] = useState(false);

  const activePricePresets = customPricePresets || defaultPricePresets;

  const persistPricePresets = async (newPresets) => {
    setCustomPricePresets(newPresets);
    try {
      localStorage.setItem(`pos_price_presets_${shopConfig?.id || shop?.id || 'default'}`, JSON.stringify(newPresets));
    } catch (e) {}

    try {
      await billingService.updatePricePresets(newPresets, role);
    } catch (err) {
      console.warn('Failed to sync price presets to server:', err);
    }
  };

  const handleModifyPrice = (index, newPriceStr) => {
    const val = parseFloat(newPriceStr);
    if (isNaN(val) || val <= 0) {
      showToast('Please enter a valid price amount', 'error');
      return;
    }
    const updated = [...activePricePresets];
    updated[index] = val;
    updated.sort((a, b) => a - b);
    persistPricePresets(updated);
    setEditingPriceIndex(null);
    setEditingPriceText('');
    showToast(`Updated price preset to ₹${val}`, 'success');
  };

  const handleDeletePrice = (index, e) => {
    if (e) e.stopPropagation();
    const removedVal = activePricePresets[index];
    const updated = activePricePresets.filter((_, idx) => idx !== index);
    persistPricePresets(updated);
    showToast(`Deleted price preset ₹${removedVal}`, 'info');
  };

  const handleAddCustomPrice = (e) => {
    if (e) e.preventDefault();
    const val = parseFloat(newPriceInput);
    if (isNaN(val) || val <= 0) {
      showToast('Please enter a valid price amount', 'error');
      return;
    }
    if (activePricePresets.includes(val)) {
      showToast(`Price ₹${val} already exists`, 'info');
      setNewPriceInput('');
      return;
    }
    const updated = [...activePricePresets, val];
    updated.sort((a, b) => a - b);
    persistPricePresets(updated);
    setNewPriceInput('');
    setIsAddingPrice(false);
    showToast(`Added price preset ₹${val}`, 'success');
  };

  const handleResetDefaultPrices = () => {
    persistPricePresets(defaultPricePresets);
    showToast('Reset price presets to default values', 'info');
  };

  const loadSoundboxDevices = async () => {
    try {
      const res = await billingService.getSoundboxDevices(role);
      const devs = res.data || [];
      setSoundboxDevices(devs);
      if (devs.length > 0) {
        setSelectedSoundbox((prev) => {
          if (prev && devs.some((d) => d.id === prev.id)) {
            return devs.find((d) => d.id === prev.id);
          }
          return devs.find((d) => d.is_default) || devs[0];
        });
      }
    } catch (err) {
      console.warn('Failed to load soundbox devices:', err);
    }
  };

  const loadReconciliation = async (period = overviewPeriod) => {
    setIsLoadingReconciliation(true);
    try {
      const res = await billingService.getSoundboxReconciliation({ period }, role);
      setReconciliationData(res.data);
    } catch (err) {
      console.warn('Failed to load reconciliation:', err);
    } finally {
      setIsLoadingReconciliation(false);
    }
  };

  // 1. Initial Load: Billing status & products
  const fetchStatusAndProducts = async () => {
    setLoading(true);
    try {
      const res = await billingService.getStatus(role);
      if (res && res.data) {
        setBillingEnabled(Boolean(res.data.billing_enabled));
        const sbEnabled = Boolean(res.data.soundbox_enabled || res.data.shop?.soundbox_enabled);
        setSoundboxEnabled(sbEnabled);
        setShopConfig(res.data.shop || shop || {});
        if (Array.isArray(res.data.shop?.customer_portal_settings?.quick_item_tags) && res.data.shop.customer_portal_settings.quick_item_tags.length > 0) {
          setCustomItemTags(res.data.shop.customer_portal_settings.quick_item_tags);
        }
        if (Array.isArray(res.data.shop?.customer_portal_settings?.quick_price_presets) && res.data.shop.customer_portal_settings.quick_price_presets.length > 0) {
          setCustomPricePresets(res.data.shop.customer_portal_settings.quick_price_presets);
        }
        setNextSerialNo(res.data.next_serial_no || 1);
        if (res.data.metrics) setMetrics(res.data.metrics);
        if (sbEnabled) {
          await loadSoundboxDevices();
        }
      }

      await loadProducts('');
    } catch (err) {
      if (err.response?.status === 403 || err.response?.data?.billing_disabled) {
        setBillingEnabled(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (searchTerm = '') => {
    setIsLoadingProducts(true);
    try {
      const res = await billingService.getProducts(searchTerm, role);
      if (res && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Failed to load products for POS', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadInvoices = async (period = overviewPeriod) => {
    setIsLoadingInvoices(true);
    try {
      const params = {};
      if (invoiceSearch) params.search = invoiceSearch;
      if (invoicePaymentFilter !== 'all') params.payment_method = invoicePaymentFilter;

      if (!invoiceSearch) {
        if (period === 'daily') {
          const todayStr = new Date().toISOString().split('T')[0];
          params.date_from = todayStr;
        } else if (period === 'weekly') {
          const d = new Date();
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(d.setDate(diff));
          params.date_from = monday.toISOString().split('T')[0];
        } else if (period === 'monthly') {
          const d = new Date();
          const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
          params.date_from = firstDay.toISOString().split('T')[0];
        }
      }

      const res = await billingService.getInvoices(params, role);
      if (res && res.data) {
        setInvoices(res.data.data || res.data || []);
      }
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const handlePeriodChange = (period) => {
    setOverviewPeriod(period);
    loadInvoices(period);
    if (soundboxEnabled) {
      loadReconciliation(period);
    }
  };

  useEffect(() => {
    fetchStatusAndProducts();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'invoices') {
      loadInvoices(overviewPeriod);
      if (soundboxEnabled) {
        loadReconciliation(overviewPeriod);
      }
    }
  }, [activeSubTab, invoicePaymentFilter, soundboxEnabled, overviewPeriod]);

  // Cart Calculations (Declared before usage in effects & handlers)
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (parseFloat(item.unit_price) * item.quantity), 0);
  }, [cartItems]);

  const totalAmount = useMemo(() => {
    const disc = parseFloat(discountAmount) || 0;
    const tax = parseFloat(taxAmount) || 0;
    return Math.max(0, subtotal - disc + tax);
  }, [subtotal, discountAmount, taxAmount]);

  const changeReturn = useMemo(() => {
    const recv = parseFloat(receivedAmount) || 0;
    if (paymentMethod === 'cash' && recv > totalAmount) {
      return recv - totalAmount;
    }
    return 0;
  }, [receivedAmount, totalAmount, paymentMethod]);

  const splitCashNum = parseFloat(splitCashAmount) || 0;
  const splitUpiNum = parseFloat(splitUpiAmount) || 0;
  const splitSum = useMemo(() => {
    return Math.round((splitCashNum + splitUpiNum) * 100) / 100;
  }, [splitCashNum, splitUpiNum]);

  const splitDifference = useMemo(() => {
    return Math.round((totalAmount - splitSum) * 100) / 100;
  }, [totalAmount, splitSum]);

  const upiDueAmount = useMemo(() => {
    return paymentMethod === 'partial' ? splitUpiNum : totalAmount;
  }, [paymentMethod, splitUpiNum, totalAmount]);

  // Dynamic Overview Period Metrics (Daily / Weekly / Monthly / All Time)
  const activePeriodMetrics = useMemo(() => {
    if (overviewPeriod === 'weekly') {
      const rev = metrics.week_revenue ?? (reconciliationData?.summary?.total_revenue || 0);
      const count = metrics.week_bills_count ?? (reconciliationData?.summary?.total_bills || 0);
      return {
        label1: "This Week's Sales",
        value1: rev,
        label2: "This Week's Bills",
        value2: count,
        periodName: "This Week",
      };
    } else if (overviewPeriod === 'monthly') {
      const rev = metrics.month_revenue ?? (reconciliationData?.summary?.total_revenue || 0);
      const count = metrics.month_bills_count ?? (reconciliationData?.summary?.total_bills || 0);
      return {
        label1: "This Month's Sales",
        value1: rev,
        label2: "This Month's Bills",
        value2: count,
        periodName: "This Month",
      };
    } else if (overviewPeriod === 'all') {
      return {
        label1: "Total Sales",
        value1: metrics.total_revenue || (reconciliationData?.summary?.total_revenue || 0),
        label2: "Total Bills Count",
        value2: metrics.total_bills_count || (reconciliationData?.summary?.total_bills || 0),
        periodName: "All-Time",
      };
    }
    // Default: daily / today
    const rev = metrics.today_revenue ?? (reconciliationData?.summary?.total_revenue || 0);
    const count = metrics.today_bills_count ?? (reconciliationData?.summary?.total_bills || 0);
    return {
      label1: "Today's Sales",
      value1: rev,
      label2: "Today's Bills",
      value2: count,
      periodName: "Today",
    };
  }, [overviewPeriod, metrics, reconciliationData]);

  // Real-time Soundbox Radar: Auto-detects payment when customer scans UPI QR
  const isPollingRef = useRef(false);
  const pollAttemptsRef = useRef(0);

  useEffect(() => {
    let interval = null;
    const upiPortion = paymentMethod === 'partial' ? (parseFloat(splitUpiAmount) || 0) : totalAmount;
    const isListeningUpi = paymentMethod === 'upi' || (paymentMethod === 'partial' && upiPortion > 0);

    // Reset attempts on amount / payment method change
    pollAttemptsRef.current = 0;

    if (soundboxEnabled && activeSubTab === 'pos' && isListeningUpi && upiPortion > 0 && !soundboxPaymentReceived) {
      interval = setInterval(async () => {
        // Optimization: Pause polling if user switched tab or minimized browser to prevent server overload
        if (typeof document !== 'undefined' && document.hidden) return;
        // Optimization: Skip if a request is already in-flight (avoids queue pile-up on slow network)
        if (isPollingRef.current) return;
        // Optimization: Stop after ~10 mins (130 checks) of inactivity to prevent endless worker consumption
        if (pollAttemptsRef.current > 130) return;

        pollAttemptsRef.current += 1;
        isPollingRef.current = true;
        try {
          const res = await billingService.pollSoundboxStatus({
            amount: upiPortion,
            soundbox_device_id: selectedSoundbox?.id || null,
          }, role);

          if (res?.matched && res?.data) {
            playSoundboxChime();
            setSoundboxPaymentReceived(true);
            setSoundboxUtr(res.data.utr_number || '');
            showToast(`🔊 Payment of ₹${res.data.amount} received on ${res.data.account_name}!`);
          }
        } catch (err) {
          // silently keep listening
        } finally {
          isPollingRef.current = false;
        }
      }, 4500);
    }

    return () => {
      if (interval) clearInterval(interval);
      isPollingRef.current = false;
    };
  }, [activeSubTab, paymentMethod, totalAmount, splitUpiAmount, soundboxPaymentReceived, selectedSoundbox, role, soundboxEnabled]);

  // Cashier simulate payment ding (for instant manual test/verification)
  const handleSimulateInstantDing = async () => {
    const upiPortion = paymentMethod === 'partial' ? (parseFloat(splitUpiAmount) || 0) : totalAmount;
    if (upiPortion <= 0) {
      alert('UPI amount must be greater than 0 to test payment.');
      return;
    }
    setIsSimulatingSoundbox(true);
    try {
      const res = await billingService.simulatePayment({
        amount: upiPortion,
        soundbox_device_id: selectedSoundbox?.id || null,
        payer_vpa: 'customer@upi',
      }, role);

      playSoundboxChime();
      setSoundboxPaymentReceived(true);
      setSoundboxUtr(res.data?.utr_number || '');
      showToast(`🔊 Simulated payment of ₹${upiPortion} on ${selectedSoundbox?.name || 'Soundbox'}!`);
    } catch (err) {
      alert('Simulation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSimulatingSoundbox(false);
    }
  };

  // Fast Add (Zero Upload Required)
  const handleFastAddItem = (e) => {
    if (e) e.preventDefault();
    const price = parseFloat(quickPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price / rate');
      if (priceInputRef.current) priceInputRef.current.focus();
      return;
    }

    const title = quickName.trim() || `Item #${cartItems.length + 1}`;
    const qty = parseInt(quickQty, 10) || 1;

    setCartItems((prev) => [
      ...prev,
      {
        key: `quick-${Date.now()}-${Math.random()}`,
        product_id: null,
        product_variant_id: null,
        item_name: title,
        variant_name: null,
        unit_price: price,
        quantity: qty,
      },
    ]);

    setQuickName('');
    setQuickPrice('');
    setQuickQty(1);
    showToast(`Added ${title} - ₹${price}`);
    if (nameInputRef.current) nameInputRef.current.focus();
  };

  // Instant Preset Punch (e.g. clicks [Shirt] -> sets name; clicks [₹799] -> adds to bill)
  const handleSelectTag = (tag) => {
    setQuickName(tag);
    if (priceInputRef.current) priceInputRef.current.focus();
  };

  const handleInstantPricePreset = (presetPrice) => {
    const title = quickName.trim() || `Item #${cartItems.length + 1}`;
    setCartItems((prev) => [
      ...prev,
      {
        key: `quick-${Date.now()}-${Math.random()}`,
        product_id: null,
        product_variant_id: null,
        item_name: title,
        variant_name: null,
        unit_price: presetPrice,
        quantity: 1,
      },
    ]);
    setQuickName('');
    setQuickPrice('');
    showToast(`Added ${title} - ₹${presetPrice}`);
    if (nameInputRef.current) nameInputRef.current.focus();
  };

  // Add Product to Cart from Catalog
  const handleAddToCart = (product, variant = null) => {
    const itemName = product.name;
    const variantName = variant ? `${variant.name || ''} ${variant.color || ''} ${variant.size || ''}`.trim() : null;
    const price = variant && variant.price ? parseFloat(variant.price) : parseFloat(product.price || 0);
    const key = `${product.id}-${variant?.id || 'base'}`;

    const existingIndex = cartItems.findIndex((it) => it.key === key);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          key,
          product_id: product.id,
          product_variant_id: variant?.id || null,
          item_name: itemName,
          variant_name: variantName,
          unit_price: price,
          quantity: 1,
        },
      ]);
    }
    showToast(`Added ${itemName}`);
  };

  // Update Cart Quantity
  const handleUpdateQty = (index, delta) => {
    const updated = [...cartItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setCartItems(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = [...cartItems];
    updated.splice(index, 1);
    setCartItems(updated);
  };

  // Submit / Generate Bill
  const handleGenerateBill = async () => {
    if (cartItems.length === 0) {
      alert('Please add at least one item to generate a bill.');
      return;
    }

    if (paymentMethod === 'partial') {
      const c = parseFloat(splitCashAmount) || 0;
      const u = parseFloat(splitUpiAmount) || 0;
      const sum = c + u;
      if (Math.abs(totalAmount - sum) > 0.5) {
        alert(`Partial payment total must equal Grand Total (₹${totalAmount.toFixed(2)}). Current allocated is ₹${sum.toFixed(2)} (Cash: ₹${c} + UPI: ₹${u}). Please adjust the amounts.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const splitCashVal = paymentMethod === 'partial' ? (parseFloat(splitCashAmount) || 0) : null;
      const splitUpiVal = paymentMethod === 'partial' ? (parseFloat(splitUpiAmount) || 0) : null;

      const payload = {
        customer_name: customerName.trim() || 'Walk-in Customer',
        customer_phone: customerPhone.trim() || null,
        customer_address: customerAddress.trim() || null,
        items: cartItems.map((it) => ({
          product_id: it.product_id,
          product_variant_id: it.product_variant_id,
          item_name: it.item_name,
          variant_name: it.variant_name,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
        discount_amount: parseFloat(discountAmount) || 0,
        tax_amount: parseFloat(taxAmount) || 0,
        payment_method: paymentMethod,
        split_cash_amount: splitCashVal,
        split_upi_amount: splitUpiVal,
        received_amount: paymentMethod === 'cash' ? (parseFloat(receivedAmount) || totalAmount) : totalAmount,
        notes: notes.trim() || null,
        soundbox_device_id: (paymentMethod === 'upi' || (paymentMethod === 'partial' && (splitUpiVal || 0) > 0)) ? (selectedSoundbox?.id || null) : null,
        soundbox_account_name: (paymentMethod === 'upi' || (paymentMethod === 'partial' && (splitUpiVal || 0) > 0)) ? (selectedSoundbox?.name || null) : null,
        utr_number: (paymentMethod === 'upi' || (paymentMethod === 'partial' && (splitUpiVal || 0) > 0)) ? (soundboxUtr.trim() || null) : null,
      };

      let res;
      if (editingBill) {
        res = await billingService.updateBill(editingBill.id, payload, role);
      } else {
        res = await billingService.createBill(payload, role);
      }

      if (res && res.data) {
        let msg = res.message || (editingBill ? `Bill #${res.data.bill.bill_number} updated!` : 'Bill created successfully!');
        if (res.data.whatsapp?.success) {
          msg = `🧾 Bill #${res.data.bill.bill_number} generated & sent to customer WhatsApp!`;
        }
        showToast(msg);
        setEditingBill(null);
        setActiveReceiptBill(res.data.bill);
        if (res.data.shop) setShopConfig(res.data.shop);

        // Reset cart & soundbox states
        setCartItems([]);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setSelectedCustomerProfile(null);
        setCustomerSuggestions([]);
        setShowCustomerSuggestions(false);
        setDiscountAmount(0);
        setDiscountType('amount');
        setDiscountPercentInput('');
        setPaymentMethod('cash');
        setSplitCashAmount('');
        setSplitUpiAmount('');
        setTaxAmount(0);
        setReceivedAmount('');
        setNotes('');
        setSoundboxPaymentReceived(false);
        setSoundboxUtr('');

        // Refresh status
        fetchStatusAndProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create bill. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
          Loading Billing & POS Terminal...
        </span>
      </div>
    );
  }

  // Feature Disabled Screen for Unsubscribed / Unauthorized Shops
  if (!billingEnabled) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 text-center shadow-xl space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
          <Receipt className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Billing & POS Feature Not Activated
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            The counter Billing & POS module has not been enabled for <strong className="text-slate-700 dark:text-zinc-200">{shopConfig.name || 'this store'}</strong>.
            This feature is provisioned on-demand by the Super Administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            {/* <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Receipt className="w-5 h-5" />
            </div> */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  POS Counter Billing
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Instant billing without pre-uploading items, or scan catalog
              </p>
            </div>
          </div>
        </div>

        {/* Tab Toggle & Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl flex items-center">
            <button
              type="button"
              onClick={() => setActiveSubTab('pos')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'pos'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              New
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('invoices')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'invoices'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              History
            </button>
          </div>

          {/* Soundbox Sync Trigger (Optional: Enabled by Super Admin) */}
          {soundboxEnabled && (
            <button
              type="button"
              onClick={() => setIsSoundboxModalOpen(true)}
              className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-purple-600/10 to-indigo-600/10 hover:from-purple-600/20 hover:to-indigo-600/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              title="Configure Soundbox Devices & Multi-Account UPI"
            >
              <Volume2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">Soundbox & Accounts</span>
              <span className="sm:hidden">Soundbox</span>
              {soundboxDevices.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-600 text-white font-black">
                  {soundboxDevices.length}
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={fetchStatusAndProducts}
            className="p-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl text-slate-600 dark:text-zinc-400 transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: POS BILLING TERMINAL */}
      {activeSubTab === 'pos' && (
        <div className="space-y-4">
          {/* MOBILE FLOW SWITCHER (Visible on screens < lg) */}
          <div className="lg:hidden flex items-center p-1 bg-slate-100 dark:bg-zinc-800 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80">
            <button
              type="button"
              onClick={() => setMobilePosTab('entry')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mobilePosTab === 'entry'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>1. Punch Items</span>
            </button>
            <button
              type="button"
              onClick={() => setMobilePosTab('cart')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
                mobilePosTab === 'cart'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>2. Current Bill</span>
              {cartItems.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  mobilePosTab === 'cart' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                }`}>
                  {cartItems.length}
                </span>
              )}
              {totalAmount > 0 && (
                <span className="text-[11px] font-black opacity-90 hidden xs:inline">
                  (₹{totalAmount.toFixed(0)})
                </span>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Fast Item Punch / Catalog (7 cols) */}
            <div className={`lg:col-span-7 space-y-4 ${mobilePosTab === 'entry' ? 'block' : 'hidden lg:block'}`}>
              {/* Mode Switcher: Quick Pad (No Upload) vs Catalog */}
              <div className="flex items-center justify-between p-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-850 border border-slate-200/80 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setPosMode('quick')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  posMode === 'quick'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Instant Bill</span>
              </button>

              <button
                type="button"
                onClick={() => setPosMode('catalog')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  posMode === 'catalog'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Uploaded Catalog</span>
              </button>
            </div>

            {/* OPTION A: INSTANT FAST PUNCH (ZERO UPLOAD REQUIRED) */}
            {posMode === 'quick' && (
              <div className="p-5 rounded-3xl bg-white dark:bg-[#18181B] border-2 border-blue-500/30 dark:border-blue-500/20 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      Speed Counter Entry (Enter Price & Hit Enter)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">No inventory upload needed</span>
                </div>

                {/* Main Rapid Punch Bar */}
                <form onSubmit={handleFastAddItem} className="space-y-3">
                  <div className="grid grid-cols-12 gap-2">
                    {/* Item Name (Optional or Preset) */}
                    <div className="col-span-12 sm:col-span-6">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Item Description (e.g. Shirt, Jeans)
                      </label>
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        placeholder="Item name (or pick from tags below)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        value={quickQty}
                        onChange={(e) => setQuickQty(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm sm:text-xs text-slate-900 dark:text-white font-bold text-center focus:outline-none"
                      />
                    </div>

                    {/* Rate / Price */}
                    <div className="col-span-8 sm:col-span-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Rate / Price (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-sm text-slate-400">
                          ₹
                        </span>
                        <input
                          ref={priceInputRef}
                          type="number"
                          step="any"
                          inputMode="decimal"
                          required
                          value={quickPrice}
                          onChange={(e) => setQuickPrice(e.target.value)}
                          placeholder="e.g. 799"
                          className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-base sm:text-sm font-black text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Add Button */}
                  <button
                    type="submit"
                    className="w-full py-3 sm:py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs sm:text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item to Bill (or Press Enter)</span>
                  </button>
                </form>

                {/* 1-Click Fast Item Category Tag Chips (With Custom Modify, Delete & Add) */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider truncate">
                        Quick Item Tags (1-Tap to autofill):
                      </span>
                      {isManagingTags && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                          Edit Mode
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsManagingTags(!isManagingTags);
                          setEditingTagIndex(null);
                          setIsAddingTag(false);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          isManagingTags
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                        }`}
                        title="Modify, rename, delete or add custom quick tags"
                      >
                        {isManagingTags ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <Edit2 className="w-3 h-3 text-blue-500" />
                            <span>Modify</span>
                          </>
                        )}
                      </button>

                      {isManagingTags && (
                        <button
                          type="button"
                          onClick={handleResetDefaultTags}
                          className="px-1.5 py-0.5 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                          title="Restore default tags for this shop type"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Helper Tip in Edit Mode */}
                  {isManagingTags && (
                    <div className="text-[10px] text-amber-800 dark:text-amber-300/90 bg-amber-500/10 p-2 rounded-xl border border-amber-400/30 flex items-center justify-between gap-2">
                      <span>
                        💡 Tap <strong>✏️</strong> to rename any tag, <strong>🗑️</strong> to delete, or add your own tags.
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingTag(true)}
                        className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-bold text-[10px] shrink-0 hover:bg-blue-500 cursor-pointer flex items-center gap-0.5 shadow-xs"
                      >
                        <Plus className="w-3 h-3" /> Add Tag
                      </button>
                    </div>
                  )}

                  {/* Tags List */}
                  <div className="flex flex-nowrap sm:flex-wrap overflow-x-auto pb-1 gap-1.5 no-scrollbar touch-pan-x items-center">
                    {activeItemTags.map((tag, idx) => {
                      const isEditing = editingTagIndex === idx;

                      if (isEditing) {
                        return (
                          <div key={idx} className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border-2 border-blue-500 shadow-sm shrink-0">
                            <input
                              type="text"
                              autoFocus
                              value={editingTagText}
                              onChange={(e) => setEditingTagText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleModifyTag(idx, editingTagText);
                                } else if (e.key === 'Escape') {
                                  setEditingTagIndex(null);
                                }
                              }}
                              className="px-2 py-0.5 text-xs font-bold text-slate-900 dark:text-white bg-transparent outline-none w-24 sm:w-28"
                            />
                            <button
                              type="button"
                              onClick={() => handleModifyTag(idx, editingTagText)}
                              className="p-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTagIndex(null)}
                              className="p-1 rounded-lg bg-slate-100 dark:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-300 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className={`flex items-center rounded-xl border transition-all shrink-0 ${
                            isManagingTags
                              ? 'bg-amber-50/70 dark:bg-zinc-800/90 border-amber-300/80 dark:border-zinc-700 pl-2.5 pr-1 py-0.5 gap-1'
                              : 'bg-slate-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-blue-950/40 border-slate-200/60 dark:border-zinc-700/60 hover:border-blue-300'
                          }`}
                        >
                          {isManagingTags ? (
                            <>
                              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                                {tag}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTagIndex(idx);
                                    setEditingTagText(tag);
                                  }}
                                  className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-zinc-700 text-slate-500 hover:text-blue-600 dark:text-zinc-300 transition-colors cursor-pointer"
                                  title={`Modify / Rename "${tag}"`}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteTag(idx, e)}
                                  className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title={`Delete "${tag}"`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectTag(tag)}
                              className="px-2.5 py-1.5 sm:py-1 text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold cursor-pointer"
                            >
                              + {tag}
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Inline Add Tag input in Edit Mode */}
                    {isManagingTags && (
                      isAddingTag ? (
                        <form onSubmit={handleAddCustomTag} className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border-2 border-emerald-500 shadow-sm shrink-0">
                          <input
                            type="text"
                            autoFocus
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setIsAddingTag(false);
                            }}
                            placeholder="Tag name..."
                            className="px-2 py-0.5 text-xs font-bold text-slate-900 dark:text-white bg-transparent outline-none w-24 sm:w-28"
                          />
                          <button
                            type="submit"
                            className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                            title="Add Tag"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingTag(false)}
                            className="p-1 rounded-lg bg-slate-100 dark:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-300 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingTag(true)}
                          className="px-2.5 py-1 rounded-xl border border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                          <span>New Tag</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* 1-Click Common Price Chips (With Custom Modify, Delete & Add) */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider truncate">
                        Frequent Price Presets (1-Tap to Add):
                      </span>
                      {isManagingPrices && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                          Edit Mode
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsManagingPrices(!isManagingPrices);
                          setEditingPriceIndex(null);
                          setIsAddingPrice(false);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          isManagingPrices
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                        }`}
                        title="Modify, rename, delete or add custom price presets"
                      >
                        {isManagingPrices ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <Edit2 className="w-3 h-3 text-emerald-600" />
                            <span>Modify</span>
                          </>
                        )}
                      </button>

                      {isManagingPrices && (
                        <button
                          type="button"
                          onClick={handleResetDefaultPrices}
                          className="px-1.5 py-0.5 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                          title="Restore default price presets"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Helper Tip in Edit Mode */}
                  {isManagingPrices && (
                    <div className="text-[10px] text-emerald-800 dark:text-emerald-300/90 bg-emerald-500/10 p-2 rounded-xl border border-emerald-400/30 flex items-center justify-between gap-2">
                      <span>
                        💡 Tap <strong>✏️</strong> to change price, <strong>🗑️</strong> to delete, or add new price buttons.
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingPrice(true)}
                        className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] shrink-0 hover:bg-emerald-500 cursor-pointer flex items-center gap-0.5 shadow-xs"
                      >
                        <Plus className="w-3 h-3" /> Add Price
                      </button>
                    </div>
                  )}

                  {/* Price Presets List */}
                  <div className="flex flex-nowrap sm:flex-wrap overflow-x-auto pb-1 gap-1.5 no-scrollbar touch-pan-x items-center">
                    {activePricePresets.map((p, idx) => {
                      const isEditing = editingPriceIndex === idx;

                      if (isEditing) {
                        return (
                          <div key={idx} className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border-2 border-emerald-500 shadow-sm shrink-0">
                            <span className="text-xs font-black text-slate-400 pl-1">₹</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              autoFocus
                              value={editingPriceText}
                              onChange={(e) => setEditingPriceText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleModifyPrice(idx, editingPriceText);
                                } else if (e.key === 'Escape') {
                                  setEditingPriceIndex(null);
                                }
                              }}
                              className="px-1 py-0.5 text-xs font-black text-slate-900 dark:text-white bg-transparent outline-none w-20"
                            />
                            <button
                              type="button"
                              onClick={() => handleModifyPrice(idx, editingPriceText)}
                              className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPriceIndex(null)}
                              className="p-1 rounded-lg bg-slate-100 dark:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-300 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className={`flex items-center rounded-xl border transition-all shrink-0 ${
                            isManagingPrices
                              ? 'bg-emerald-50/70 dark:bg-zinc-800/90 border-emerald-300/80 dark:border-zinc-700 pl-2.5 pr-1 py-0.5 gap-1'
                              : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-xs'
                          }`}
                        >
                          {isManagingPrices ? (
                            <>
                              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                                ₹{p}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPriceIndex(idx);
                                    setEditingPriceText(String(p));
                                  }}
                                  className="p-1 rounded-lg hover:bg-emerald-200/60 dark:hover:bg-zinc-700 text-slate-500 hover:text-emerald-700 dark:text-zinc-300 transition-colors cursor-pointer"
                                  title={`Modify price ₹${p}`}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeletePrice(idx, e)}
                                  className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title={`Delete price ₹${p}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleInstantPricePreset(p)}
                              className="px-3 py-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-black cursor-pointer"
                            >
                              ₹{p}
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Inline Add Price input in Edit Mode */}
                    {isManagingPrices && (
                      isAddingPrice ? (
                        <form onSubmit={handleAddCustomPrice} className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border-2 border-emerald-500 shadow-sm shrink-0">
                          <span className="text-xs font-black text-slate-400 pl-1">₹</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            autoFocus
                            value={newPriceInput}
                            onChange={(e) => setNewPriceInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setIsAddingPrice(false);
                            }}
                            placeholder="Amount..."
                            className="px-1 py-0.5 text-xs font-black text-slate-900 dark:text-white bg-transparent outline-none w-20"
                          />
                          <button
                            type="submit"
                            className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                            title="Add Price"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingPrice(false)}
                            className="p-1 rounded-lg bg-slate-100 dark:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-300 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingPrice(true)}
                          className="px-2.5 py-1 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                          <span>New Price</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* OPTION B: UPLOADED CATALOG BROWSE / BARCODE */}
            {posMode === 'catalog' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        loadProducts(e.target.value);
                      }}
                      placeholder="Scan barcode, or search by name / SKU..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                    <span>Uploaded Items ({products.length})</span>
                    <span className="text-[11px] text-slate-400 font-normal">Tap an item to add to bill</span>
                  </div>

                  {isLoadingProducts ? (
                    <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                      <span>Loading...</span>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No products uploaded yet. Use <strong>"⚡ Instant Price Punch"</strong> above to bill freely!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1">
                      {products.map((prod) => {
                        const price = parseFloat(prod.price || 0);
                        const hasVariants = prod.variants && prod.variants.length > 0;

                        return (
                          <div
                            key={prod.id}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80 hover:border-blue-500 transition-all flex flex-col justify-between gap-2 text-left"
                          >
                            <div className="min-w-0">
                              <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                {prod.name}
                              </div>
                              <div className="text-xs font-black text-blue-600 dark:text-blue-400 mt-0.5">
                                ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </div>
                            </div>

                            {hasVariants ? (
                              <div className="flex flex-wrap gap-1">
                                {prod.variants.map((v) => (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => handleAddToCart(prod, v)}
                                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border text-[10px] font-bold text-slate-700 dark:text-zinc-300 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                                  >
                                    {v.name || v.size} • ₹{parseFloat(v.price || prod.price).toFixed(0)}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddToCart(prod)}
                                className="w-full py-1 px-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-blue-600 hover:text-white border text-xs font-bold text-slate-800 dark:text-zinc-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add to Bill</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Current Bill Pad & Instant Print (5 cols) */}
          <div className={`lg:col-span-5 space-y-4 ${mobilePosTab === 'cart' ? 'block' : 'hidden lg:block'}`}>
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-xl space-y-4">
              {/* Mobile Back to Add Items header */}
              <div className="lg:hidden flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={() => setMobilePosTab('entry')}
                  className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>← Add More Items</span>
                </button>
                <span className="text-xs font-bold text-slate-500">
                  {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} on bill
                </span>
              </div>

              {/* Header Info */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {editingBill ? `Editing Bill #${editingBill.bill_number || editingBill.id}` : `Bill Pad #${nextSerialNo}`}
                  </span>
                  {editingBill && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
                      Edit Mode
                    </span>
                  )}
                </div>
                {editingBill ? (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    disabled={cartItems.length === 0}
                    className="text-[11px] font-bold text-red-500 hover:underline disabled:opacity-30 cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Customer Info (Optional) with Fast Autocomplete & Returning Customer Memory */}
              <div
                ref={customerBoxRef}
                className="relative space-y-2 bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>Customer Details (Optional)</span>
                  </div>
                  {selectedCustomerProfile && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                      Returning Customer ({selectedCustomerProfile.visit_count} {selectedCustomerProfile.visit_count === 1 ? 'visit' : 'visits'})
                    </span>
                  )}
                </div>

                {/* Mobile / WhatsApp FIRST, then Customer Name SECOND */}
                <div className="grid grid-cols-2 gap-2 relative">
                  {/* 1. Mobile / WhatsApp FIRST */}
                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="tel"
                      value={customerPhone}
                      onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                      onFocus={() => {
                        if (customerSuggestions.length > 0) setShowCustomerSuggestions(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setShowCustomerSuggestions(false);
                      }}
                      placeholder="Mobile / WhatsApp"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all"
                    />
                    {isSearchingCustomer && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* 2. Customer Name SECOND */}
                  <div className="relative">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer Name"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Suggestions Popover: Appears as mobile no is typed */}
                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 bg-slate-100/80 dark:bg-zinc-800 flex items-center justify-between text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>Previous Customers ({customerSuggestions.length})</span>
                      </div>
                      <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold">Tap to Auto-fill</span>
                    </div>

                    {customerSuggestions.map((cust, idx) => (
                      <button
                        key={cust.customer_phone || idx}
                        type="button"
                        onClick={() => handleSelectCustomer(cust)}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50/70 dark:hover:bg-zinc-800/80 flex items-center justify-between gap-2.5 transition-colors cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                              {cust.customer_name || 'Walk-in Customer'}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 shrink-0">
                              {cust.visit_count} {cust.visit_count === 1 ? 'visit' : 'visits'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-medium">{cust.customer_phone}</span>
                            {cust.last_visit_formatted && (
                              <span className="text-[10px] text-slate-400">
                                • {cust.last_visit_formatted}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {cust.total_spent > 0 && (
                            <div className="text-[11px] font-black text-slate-800 dark:text-zinc-200">
                              ₹{parseFloat(cust.total_spent).toFixed(0)}
                            </div>
                          )}
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold group-hover:underline">
                            Select ↵
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Returning Customer Memory Pill when matched/selected */}
                {selectedCustomerProfile && (
                  <div className="pt-0.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-300 bg-white/90 dark:bg-zinc-800/90 px-2.5 py-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
                    <div className="flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">
                        <strong>{selectedCustomerProfile.customer_name || 'Customer'}</strong>
                        {selectedCustomerProfile.last_visit_relative && ` • Visited ${selectedCustomerProfile.last_visit_relative}`}
                        {selectedCustomerProfile.total_spent > 0 && ` • ₹${parseFloat(selectedCustomerProfile.total_spent).toFixed(0)} total spent`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerProfile(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 ml-1 p-0.5 rounded cursor-pointer"
                      title="Clear memory badge"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Items on Bill List */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>Items on Bill ({cartItems.length})</span>
                  <span>Amount</span>
                </div>

                <div className="max-h-[240px] overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {cartItems.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                      Bill is empty. Use Instant Punch on the left!
                    </div>
                  ) : (
                    cartItems.map((item, idx) => (
                      <div key={item.key || idx} className="pt-2 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 dark:text-white truncate uppercase">
                            {item.item_name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            ₹{parseFloat(item.unit_price).toFixed(2)} each
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 rounded-xl p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, -1)}
                            className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-black text-xs text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, 1)}
                            className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Total price */}
                        <div className="text-right font-black text-slate-900 dark:text-white min-w-[65px]">
                          ₹{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-500"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Calculations Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                    <span>Discount</span>
                    <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-zinc-800 p-0.5 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('amount');
                        }}
                        className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${discountType === 'amount' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Enter discount in value (₹)"
                      >
                        ₹
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('percent');
                          if (subtotal > 0 && parseFloat(discountAmount) > 0) {
                            const p = (parseFloat(discountAmount) / subtotal) * 100;
                            setDiscountPercentInput(Number.isInteger(p) ? String(p) : p.toFixed(1));
                          }
                        }}
                        className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${discountType === 'percent' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Enter discount in percentage (%)"
                      >
                        %
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {discountType === 'percent' ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          inputMode="decimal"
                          value={discountPercentInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDiscountPercentInput(val);
                            const p = parseFloat(val) || 0;
                            const amt = Math.max(0, (subtotal * p) / 100);
                            setDiscountAmount(amt > 0 ? Number(amt.toFixed(2)) : 0);
                          }}
                          placeholder="0"
                          className="w-16 px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-right font-bold text-xs"
                        />
                        <span className="font-bold text-xs text-slate-500">%</span>
                        {parseFloat(discountAmount) > 0 && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            (-₹{parseFloat(discountAmount).toFixed(2)})
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-slate-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          value={discountAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDiscountAmount(val);
                            if (subtotal > 0) {
                              const p = (parseFloat(val || 0) / subtotal) * 100;
                              setDiscountPercentInput(p > 0 ? (Number.isInteger(p) ? String(p) : p.toFixed(1)) : '');
                            }
                          }}
                          className="w-20 px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-right font-bold text-xs"
                        />
                        {subtotal > 0 && parseFloat(discountAmount) > 0 && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            (-{Number(((parseFloat(discountAmount) / subtotal) * 100).toFixed(1))}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-baseline">
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    Grand Total
                  </span>
                  <span className="font-black text-xl text-blue-600 dark:text-blue-400">
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Payment Mode
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                        : 'bg-slate-50 dark:bg-zinc-850 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-slate-50 dark:bg-zinc-850 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-zinc-850 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('partial');
                      if (!splitCashAmount && !splitUpiAmount && totalAmount > 0) {
                        const half = Math.round((totalAmount / 2) * 100) / 100;
                        setSplitCashAmount(String(half));
                        setSplitUpiAmount(String(Math.round((totalAmount - half) * 100) / 100));
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'partial'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                        : 'bg-slate-50 dark:bg-zinc-850 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Partial / Split</span>
                  </button>
                </div>

                {/* Cash Change Calculator */}
                {paymentMethod === 'cash' && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-amber-800 dark:text-amber-300">
                        Cash Received:
                      </span>
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={receivedAmount}
                          onChange={(e) => setReceivedAmount(e.target.value)}
                          placeholder={totalAmount.toFixed(0)}
                          className="w-full pl-6 pr-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-amber-300 dark:border-amber-700 text-right font-black text-xs text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>
                    {changeReturn > 0 && (
                      <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-black pt-1 border-t border-amber-500/20">
                        <span>Change to Return:</span>
                        <span className="text-sm">₹{changeReturn.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Partial / Split Payment Breakdown Box */}
                {paymentMethod === 'partial' && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5 text-xs">
                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                        Split Payment Breakdown
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const half = Math.round((totalAmount / 2) * 100) / 100;
                            setSplitCashAmount(String(half));
                            setSplitUpiAmount(String(Math.round((totalAmount - half) * 100) / 100));
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-700 text-[10px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 cursor-pointer shadow-2xs"
                        >
                          50 / 50 Split
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSplitCashAmount('');
                            setSplitUpiAmount('');
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer shadow-2xs"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Cash input */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Banknote className="w-3 h-3 text-blue-600" />
                          <span>Cash Paid</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={splitCashAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSplitCashAmount(val);
                              const num = parseFloat(val);
                              if (!isNaN(num) && num >= 0 && num <= totalAmount) {
                                const rem = Math.round((totalAmount - num) * 100) / 100;
                                setSplitUpiAmount(rem > 0 ? String(rem) : '0');
                              }
                            }}
                            placeholder="0.00"
                            className="w-full pl-6 pr-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-right font-black text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* UPI input */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <QrCode className="w-3 h-3 text-emerald-600" />
                          <span>UPI / QR Paid</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={splitUpiAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSplitUpiAmount(val);
                              const num = parseFloat(val);
                              if (!isNaN(num) && num >= 0 && num <= totalAmount) {
                                const rem = Math.round((totalAmount - num) * 100) / 100;
                                setSplitCashAmount(rem > 0 ? String(rem) : '0');
                              }
                            }}
                            placeholder="0.00"
                            className="w-full pl-6 pr-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-right font-black text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Split balance status indicator */}
                    <div className="pt-0.5">
                      {Math.abs(splitDifference) < 0.01 && splitSum > 0 ? (
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Exact Total Matched:</span>
                          </span>
                          <span>₹{totalAmount.toFixed(2)} (Cash ₹{splitCashNum} + UPI ₹{splitUpiNum})</span>
                        </div>
                      ) : splitDifference > 0 ? (
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Unassigned Balance:</span>
                          </span>
                          <span>₹{splitDifference.toFixed(2)} remaining</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800">
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Exceeds Grand Total:</span>
                          </span>
                          <span>₹{Math.abs(splitDifference).toFixed(2)} over</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Direct Soundbox Sync & Dynamic UPI QR Section (When Soundbox is enabled by Super Admin) */}
                {(paymentMethod === 'upi' || (paymentMethod === 'partial' && upiDueAmount > 0)) && soundboxEnabled && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5 border border-purple-200 dark:border-purple-850 space-y-3 text-xs">
                    {/* Device Selector Chips */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-black text-purple-900 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>Select Receiving Soundbox / Account:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsSoundboxModalOpen(true)}
                          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Manage
                        </button>
                      </div>

                      {soundboxDevices.length === 0 ? (
                        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                          <span>No Soundbox devices added yet.</span>
                          <button
                            type="button"
                            onClick={() => setIsSoundboxModalOpen(true)}
                            className="font-bold underline text-amber-900 dark:text-amber-200"
                          >
                            Add Soundbox
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {soundboxDevices.map((dev) => {
                            const isSelected = selectedSoundbox?.id === dev.id;
                            return (
                              <button
                                key={dev.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSoundbox(dev);
                                  setSoundboxPaymentReceived(false);
                                  setSoundboxUtr('');
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isSelected
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/30'
                                    : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-purple-300'
                                }`}
                              >
                                <Volume2 className={`w-3 h-3 ${isSelected ? 'text-yellow-300' : 'text-purple-600'}`} />
                                <span>{dev.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Dynamic QR & Radar Screen */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-3">
                      {/* Dynamic Amount QR */}
                      <div className="relative p-1.5 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                            `upi://pay?pa=${selectedSoundbox?.upi_id || 'shop@upi'}&pn=${encodeURIComponent(shopConfig.name || 'Store')}&am=${upiDueAmount.toFixed(2)}&cu=INR&tn=Bill_${nextSerialNo}`
                          )}`}
                          alt="Dynamic Soundbox UPI QR"
                          className="w-24 h-24 object-contain"
                        />
                        <span className="block text-[9px] font-black text-center text-slate-500 mt-0.5">
                          ₹{upiDueAmount.toFixed(2)}
                        </span>
                      </div>

                      {/* Radar & Status */}
                      <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                        {soundboxPaymentReceived ? (
                          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                Payment Received!
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white uppercase">
                                Verified
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                              UTR: {soundboxUtr || 'SBX-VERIFIED'}
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              Announced on {selectedSoundbox?.name || 'Soundbox'}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[11px] text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
                                Waiting for Soundbox...
                              </span>
                              <button
                                type="button"
                                onClick={handleSimulateInstantDing}
                                disabled={isSimulatingSoundbox || upiDueAmount <= 0}
                                className="px-2 py-0.8 rounded-lg bg-white dark:bg-zinc-800 hover:bg-purple-50 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-[10px] font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                title="Click to simulate customer voice payment"
                              >
                                {isSimulatingSoundbox ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3 text-purple-600" />}
                                Test Ding
                              </button>
                            </div>
                            <p className="text-[10px] text-purple-700 dark:text-purple-300">
                              Customer scans QR to pay ₹{upiDueAmount.toFixed(2)} {paymentMethod === 'partial' ? '(UPI Portion)' : ''} on <strong className="text-purple-900 dark:text-white">{selectedSoundbox?.name || 'Primary UPI'}</strong>. Status updates automatically.
                            </p>
                          </div>
                        )}

                        {/* Optional Manual UTR override */}
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                            UTR / Txn Ref:
                          </label>
                          <input
                            type="text"
                            value={soundboxUtr}
                            onChange={(e) => {
                              setSoundboxUtr(e.target.value);
                              if (e.target.value.trim().length >= 8) {
                                setSoundboxPaymentReceived(true);
                              }
                            }}
                            placeholder="Auto-filled by Soundbox"
                            className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono text-[10px] text-slate-800 dark:text-zinc-200 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Standard UPI Option (When Soundbox is not enabled by Super Admin) */}
                {(paymentMethod === 'upi' || (paymentMethod === 'partial' && upiDueAmount > 0)) && !soundboxEnabled && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-200 dark:border-emerald-800 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Scan & Pay via any UPI App</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        ₹{upiDueAmount.toFixed(2)} {paymentMethod === 'partial' ? '(UPI Portion)' : ''}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-zinc-800 flex items-center gap-3">
                      <div className="p-1 bg-white rounded-lg border border-slate-200 shadow-xs shrink-0">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                            `upi://pay?pa=${encodeURIComponent(shopConfig.phone ? `${shopConfig.phone}@upi` : 'shop@upi')}&pn=${encodeURIComponent(shopConfig.name || 'Store')}&am=${upiDueAmount.toFixed(2)}&cu=INR&tn=Bill_${nextSerialNo}`
                          )}`}
                          alt="UPI QR Code"
                          className="w-20 h-20 object-contain"
                        />
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-600 dark:text-zinc-400 flex-1">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {shopConfig.name}
                        </div>
                        <div className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                          VPA: {shopConfig.phone ? `${shopConfig.phone}@upi` : 'shop@upi'}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Customer scans and completes payment. Cashier verifies confirmation on customer screen.
                        </p>
                      </div>
                    </div>

                    {/* Optional UTR / Reference */}
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                        UTR / Txn Ref:
                      </label>
                      <input
                        type="text"
                        value={soundboxUtr}
                        onChange={(e) => setSoundboxUtr(e.target.value)}
                        placeholder="Optional UPI Reference Number"
                        className="w-full px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono text-[10px] text-slate-800 dark:text-zinc-200 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button: Generate / Update Bill */}
              <button
                type="button"
                onClick={handleGenerateBill}
                disabled={isSubmitting || cartItems.length === 0}
                className={`w-full py-3.5 px-4 rounded-2xl ${
                  editingBill
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-amber-500/25'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black shadow-blue-500/25'
                } disabled:opacity-50 text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-[0.98]`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{editingBill ? 'Updating Bill...' : 'Processing Bill...'}</span>
                  </>
                ) : (
                  <>
                    {editingBill ? <Edit2 className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
                    <span>{editingBill ? `Update & Save Bill #${editingBill.bill_number || editingBill.id}` : 'Generate & Print Bill'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* FLOATING STICKY BOTTOM CHECKOUT BAR ON MOBILE */}
          {mobilePosTab === 'entry' && cartItems.length > 0 && (
            <div className="lg:hidden fixed bottom-4 left-3 right-3 z-30 animate-fade-in">
              <div className="bg-slate-900/95 dark:bg-zinc-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
                    <span>{cartItems.length} item{cartItems.length > 1 ? 's' : ''} added</span>
                  </div>
                  <div className="text-base font-black text-white">
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobilePosTab('cart');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 flex items-center gap-2 cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  <span>Review & Pay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: INVOICES & SALES HISTORY */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          {/* Overview Period Filter Bar: Daily, Weekly, Monthly, All Time */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#18181B] p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  Overview Period Filter
                </span>
                <span className="text-[11px] text-slate-400">
                  Switch between daily, weekly, monthly and all-time collections
                </span>
              </div>
            </div>

            <div className="flex items-center p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => handlePeriodChange('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  overviewPeriod === 'daily'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Daily (Today)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePeriodChange('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  overviewPeriod === 'weekly'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Weekly (This Week)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePeriodChange('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  overviewPeriod === 'monthly'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Monthly (This Month)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePeriodChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  overviewPeriod === 'all'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>All Time</span>
              </button>
            </div>
          </div>

          {/* Account-Wise Collection & Soundbox Reconciliation (Only when enabled by Super Admin) */}
          {soundboxEnabled && reconciliationData && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white shadow-xl space-y-3.5 border border-purple-900/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-yellow-400/20 text-yellow-300 flex items-center justify-center">
                    <Volume2 className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-yellow-300">
                      Multi-Account UPI & Soundbox Reconciliation ({activePeriodMetrics.periodName})
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Clear account-wise breakdown so you know exactly which bank account received what amount ({activePeriodMetrics.periodName})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => loadReconciliation(overviewPeriod)}
                    disabled={isLoadingReconciliation}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    title="Refresh Reconciliation"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReconciliation ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsSoundboxModalOpen(true)}
                    className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Manage Devices</span>
                  </button>
                </div>
              </div>

              {/* Account Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Cash Counter Card */}
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span>Cash Counter</span>
                    </span>
                    {parseFloat(reconciliationData.summary?.split_cash_total || 0) > 0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                        +₹{parseFloat(reconciliationData.summary?.split_cash_total || 0).toFixed(0)} split
                      </span>
                    )}
                  </div>
                  <div className="my-1.5">
                    <div className="text-lg font-black text-white">
                      ₹{parseFloat(reconciliationData.summary?.cash_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-[10px] text-white/60">
                    {parseFloat(reconciliationData.summary?.split_cash_total || 0) > 0 ? (
                      <span>
                        {reconciliationData.summary?.cash_bills_count || 0} cash + {reconciliationData.summary?.partial_bills_count || 0} split • Physical
                      </span>
                    ) : (
                      <span>{reconciliationData.summary?.cash_bills_count || 0} bills • Physical Cash</span>
                    )}
                  </div>
                </div>

                {/* Each Soundbox Account Card */}
                {reconciliationData.account_breakdown?.map((acc, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between">
                    <div className="text-[10px] uppercase font-bold text-yellow-300 flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1 truncate" title={acc.name}>
                        <Volume2 className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                        <span className="truncate">{acc.name}</span>
                      </span>
                      {acc.split_amount > 0 && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-200 border border-yellow-400/30 shrink-0">
                          +₹{parseFloat(acc.split_amount || 0).toFixed(0)} split
                        </span>
                      )}
                    </div>
                    <div className="my-1.5">
                      <div className="text-lg font-black text-white">
                        ₹{parseFloat(acc.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="text-[10px] text-white/60 truncate">
                      {acc.split_amount > 0 ? (
                        <span>{acc.pure_bills_count || 0} upi + {acc.split_bills_count || 0} split • {acc.provider?.toUpperCase()}</span>
                      ) : (
                        <span>{acc.bills_count || 0} bills • {acc.provider?.toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Partial / Split Payments Card (Always visible if any partial payments exist in the active period) */}
                {parseFloat(reconciliationData.summary?.partial_total || 0) > 0 && (
                  <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-purple-400/30 flex flex-col justify-between">
                    <div className="text-[10px] uppercase font-bold text-purple-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 shrink-0" />
                        <span>Partial / Split</span>
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40">
                        {reconciliationData.summary?.partial_bills_count || 0} bills
                      </span>
                    </div>
                    <div className="my-1.5">
                      <div className="text-lg font-black text-white">
                        ₹{parseFloat(reconciliationData.summary?.partial_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="text-[10px] text-purple-200/90 font-medium truncate">
                      ₹{parseFloat(reconciliationData.summary?.partial_cash || 0).toFixed(0)} Cash + ₹{parseFloat(reconciliationData.summary?.partial_upi || 0).toFixed(0)} UPI
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metrics Overview Cards (Synchronized with selected period) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">{activePeriodMetrics.label1}</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{parseFloat(activePeriodMetrics.value1 || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">{activePeriodMetrics.label2}</span>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {activePeriodMetrics.value2 || 0}
              </div>
            </div>

            {/* <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Billed (All Time)</span>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                ₹{parseFloat(metrics.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div> */}

            <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Bills Count</span>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1 flex items-baseline gap-1.5">
                <span>{metrics.total_bills_count || 0}</span>
                {parseFloat(metrics.avg_bill_value || 0) > 0 && (
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                    (₹{Math.round(metrics.avg_bill_value)} avg)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadInvoices()}
                placeholder="Search by Bill #, Customer name, or Phone..."
                className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={invoicePaymentFilter}
                onChange={(e) => setInvoicePaymentFilter(e.target.value)}
                className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Modes</option>
                <option value="cash">Cash Only</option>
                <option value="upi">UPI Only</option>
                <option value="card">Card Only</option>
                <option value="partial">Partial / Split</option>
              </select>

              <button
                type="button"
                onClick={loadInvoices}
                className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Search
              </button>
            </div>
          </div>

          {/* DESKTOP VIEW: Full Table (Hidden on Mobile) */}
          <div className="hidden md:block bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">Sr. / Bill No.</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Items Summary</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4 text-right">Total Amount</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {isLoadingInvoices ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2" />
                        Loading invoices...
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        No billing transactions recorded yet. Create a bill from "New Bill (POS)".
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="p-4 font-black text-slate-900 dark:text-white">
                          #{inv.bill_number || inv.bill_serial_no || inv.order_number}
                        </td>
                        <td className="p-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                          {new Date(inv.created_at).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 dark:text-zinc-200">
                            {inv.customer_name || 'Walk-in'}
                          </div>
                          {inv.customer_phone && (
                            <div className="text-[10px] text-slate-400">{inv.customer_phone}</div>
                          )}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-zinc-400">
                          {inv.items?.length || 0} item(s)
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {inv.items?.map((it) => it.item_name || it.product?.name).filter(Boolean).join(', ')}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                              inv.payment_method === 'upi'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : inv.payment_method === 'card'
                                ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                                : inv.payment_method === 'partial' || inv.payment_method === 'split'
                                ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                                : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            }`}>
                              {inv.payment_method === 'partial' || inv.payment_method === 'split' ? 'Partial / Split' : (inv.payment_method || 'Cash')}
                            </span>
                            {(inv.payment_method === 'partial' || inv.payment_method === 'split') && (
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                                Cash: ₹{inv.split_cash_amount || 0} + UPI: ₹{inv.split_upi_amount || 0}
                              </span>
                            )}
                            {inv.soundbox_account_name && (
                              <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <span>🔊</span> {inv.soundbox_account_name}
                              </span>
                            )}
                            {inv.utr_number && (
                              <span className="text-[9px] font-mono text-slate-400">
                                UTR: {inv.utr_number}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right font-black text-slate-900 dark:text-white text-sm">
                          ₹{parseFloat(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveReceiptBill(inv)}
                            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="View, Print & Share Bill"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-500" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE VIEW: Touch-Friendly Bill Cards (Hidden on Desktop) */}
          <div className="md:hidden space-y-3">
            {isLoadingInvoices ? (
              <div className="p-8 text-center text-slate-400 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-zinc-800">
                <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2" />
                Loading invoices...
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs font-medium">
                No billing transactions recorded yet.
              </div>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          #{inv.bill_number || inv.bill_serial_no || inv.order_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          inv.payment_method === 'upi'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : inv.payment_method === 'card'
                            ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                            : inv.payment_method === 'partial' || inv.payment_method === 'split'
                            ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                        }`}>
                          {inv.payment_method === 'partial' || inv.payment_method === 'split' ? 'Partial' : (inv.payment_method || 'Cash')}
                        </span>
                      </div>
                      {(inv.payment_method === 'partial' || inv.payment_method === 'split') && (
                        <div className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 mt-0.5">
                          Cash: ₹{inv.split_cash_amount || 0} • UPI: ₹{inv.split_upi_amount || 0}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(inv.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        ₹{parseFloat(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {inv.items?.length || 0} item(s)
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-zinc-400 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-2">
                    <div className="truncate max-w-[190px]">
                      <span className="font-bold text-slate-800 dark:text-zinc-200">{inv.customer_name || 'Walk-in'}</span>
                      {inv.customer_phone && <span className="text-[10px] text-slate-400 ml-1">({inv.customer_phone})</span>}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveReceiptBill(inv)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </div>

                  {inv.soundbox_account_name && (
                    <div className="text-[10px] font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-lg flex items-center justify-between">
                      <span>🔊 {inv.soundbox_account_name}</span>
                      {inv.utr_number && <span className="font-mono text-[9px] text-slate-400">UTR: {inv.utr_number}</span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PRINTABLE BILL RECEIPT MODAL */}
      {activeReceiptBill && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 pt-3 sm:pt-4 pb-12 bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain animate-fade-in !m-0 !mt-0"
          style={{ margin: 0, marginTop: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveReceiptBill(null);
            }
          }}
        >
          <div className="w-full max-w-[580px] my-0 py-0" onClick={(e) => e.stopPropagation()}>
            <ShopBillReceipt
              bill={activeReceiptBill}
              shop={shopConfig}
              onClose={() => setActiveReceiptBill(null)}
              showActions={true}
              onEdit={handleStartEditBill}
            />
          </div>
        </div>,
        document.body
      )}

      {/* RESET BILLING DATA CONFIRMATION MODAL */}
      {showResetModal && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in !m-0 !mt-0"
          style={{ margin: 0, marginTop: 0 }}
        >
          <div className="bg-white dark:bg-[#18181B] border border-rose-200 dark:border-rose-900/50 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900/30">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Reset All Billing Records?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                This will permanently delete all POS sales bills, invoice records, and soundbox transaction logs for <strong>"{shopConfig.name}"</strong>.
              </p>
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-left text-xs space-y-1.5 text-rose-900 dark:text-rose-300">
                <p className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Fresh Start Guarantee</span>
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-zinc-400">
                  Your billing serial will restart from <strong>Bill #1</strong>. Catalog products, stock quantities, and reservations remain completely safe.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetModal(false)}
                className="w-1/2 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetBilling}
                className="w-1/2 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Yes, Reset All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DIRECT SOUNDBOX & MULTI-ACCOUNT MANAGEMENT MODAL (Only when enabled by Super Admin) */}
      {soundboxEnabled && (
        <ManageSoundboxModal
          isOpen={isSoundboxModalOpen}
          onClose={() => setIsSoundboxModalOpen(false)}
          role={role}
          onDeviceChanged={() => {
            loadSoundboxDevices();
            loadReconciliation();
          }}
        />
      )}
    </div>
  );
}
