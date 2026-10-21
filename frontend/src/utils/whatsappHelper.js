/**
 * Helper to generate structured WhatsApp messages and clean phone numbers
 */

export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  // Remove non-digit characters
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  // If 10 digits (standard Indian mobile number without country code), prepend 91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

/**
 * Convert relative image path to absolute URL for external messengers (WhatsApp)
 */
export const getCleanImageUrl = (url) => {
  if (!url) return null;
  if (typeof url !== 'string') {
    url = url.image_url || url.url || '';
  }
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('data:') || url.startsWith('blob:')) return null;

  if (typeof window !== 'undefined') {
    const backendBase = import.meta.env?.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : (window.location.port === '5173' || window.location.port === '3000')
        ? `${window.location.protocol}//${window.location.hostname || 'localhost'}:8000`
        : window.location.origin;
    return `${backendBase}/${url.replace(/^\//, '')}`;
  }
  return url;
};

/**
 * Generate a direct link that opens the customer portal and immediately shows this product & variant
 */
export const getDirectProductUrl = ({ shop, product, selectedVariant }) => {
  if (typeof window === 'undefined') return '';
  try {
    const origin = window.location.origin;
    let pathname = window.location.pathname;

    const slug = shop?.slug || product?.shop?.slug;
    if (slug && !pathname.startsWith('/shop/')) {
      pathname = `/shop/${slug}`;
    }

    const url = new URL(pathname, origin);

    const productId = product?.id || product?.slug;
    if (productId) {
      url.searchParams.set('product', String(productId));
    }
    if (selectedVariant?.id) {
      url.searchParams.set('variant', String(selectedVariant.id));
    }

    return url.toString();
  } catch (err) {
    return window.location.href;
  }
};

export const generateWhatsAppOrderMessage = ({
  product,
  selectedVariant,
  shop,
  advancePaid = null,
  utrNumber = '',
  customerName = '',
  customerPhone = '',
  customerNote = '',
}) => {
  const shopName = shop?.name || product?.shop?.name || 'Store';
  const price = Number(selectedVariant?.price ?? product?.price ?? 0);
  const variantDesc = selectedVariant
    ? [selectedVariant.color, selectedVariant.size, selectedVariant.storage, selectedVariant.name].filter(Boolean).join(' / ')
    : '';
  const sku = selectedVariant?.sku || product?.sku || '';

  const directProductUrl = getDirectProductUrl({ shop, product, selectedVariant });

  const lines = [];
  if (advancePaid) {
    lines.push(`🛍️ *NEW SHOWROOM ORDER & ADVANCE BOOKING*`);
  } else {
    lines.push(`👋 *Hi ${shopName}! I'm interested in this in-store item:*`);
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📦 *Product:* ${product?.name || 'Item'}`);
  if (product?.brand) {
    lines.push(`🏷️ *Brand:* ${product.brand}${product.category?.name ? ` • ${product.category.name}` : ''}`);
  }
  if (variantDesc && variantDesc !== 'Standard') {
    lines.push(`🎨 *Selection / Variant:* ${variantDesc}`);
  }
  if (sku && sku !== 'N/A') {
    lines.push(`🔢 *SKU:* ${sku}`);
  }
  lines.push(`💰 *Item Price:* ₹${price.toFixed(2)}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  if (advancePaid) {
    lines.push(`💳 *ADVANCE PAYMENT DETAILS*`);
    lines.push(`💵 *Advance Amount Paid:* ₹${Number(advancePaid).toFixed(2)}`);
    const balance = Math.max(0, price - Number(advancePaid));
    lines.push(`⏳ *Balance Remaining (Due on Delivery/Trial):* ₹${balance.toFixed(2)}`);
    if (utrNumber) lines.push(`🧾 *UTR / Transaction Ref ID:* ${utrNumber}`);
    if (customerName) lines.push(`👤 *Customer Name:* ${customerName}`);
    if (customerPhone) lines.push(`📱 *Customer Contact:* ${customerPhone}`);
    if (customerNote) lines.push(`📝 *Customer Request/Note:* ${customerNote}`);
    lines.push(`⏰ *Date & Time:* ${new Date().toLocaleString()}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  }

  if (shop?.address) {
    lines.push(`📍 *Store Location:* ${shop.address}`);
  }

  // Direct clickable link to open this product in the showroom
  if (directProductUrl) {
    lines.push(`🔗 *Product Link:*`);
    lines.push(directProductUrl);
  }

  return lines.join('\n');
};

export const openWhatsAppUrl = (phone, text) => {
  const cleaned = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  const url = cleaned
    ? `https://wa.me/${cleaned}?text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};
