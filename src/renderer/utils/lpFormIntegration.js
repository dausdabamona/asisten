/**
 * LP Form Integration Helper
 * Bridges table-based LP form with existing lembarPermintaanStore
 * Converts localStorage data to store format and vice versa
 */

import { useLembarPermintaanStore, LP_STATUS } from '../stores/lembarPermintaanStore';

/**
 * Convert table-based form data to store LP object
 * @param {Object} formData - Data from LembarPermintaanFormView
 * @returns {Object} Store-compatible LP object
 */
export function convertFormToStoreFormat(formData) {
  const store = useLembarPermintaanStore();
  
  // Calculate total and tier
  let totalNilai = 0;
  const itemsByTier = { TIER1: 0, TIER2: 0, TIER3: 0 };
  
  formData.items.forEach(item => {
    const itemTotal = item.qty * item.estimate_price;
    totalNilai += itemTotal;
    itemsByTier[getTierKey(item.tier)]++;
  });

  const tier = store.calculateTier(totalNilai);

  return {
    id: formData.lp_id || generateLPId(),
    nomor: generateLPNomor(),
    jenis: detectJenis(formData.items),
    status: formData.status || LP_STATUS.DRAFT,
    unit_pengajuan: formData.unit_name,
    responsible_nip: formData.responsible_nip,
    uraian: formData.description,
    tanggal_pengajuan: formData.request_date,
    total_nilai: totalNilai,
    tier: tier,
    metode_pengadaan: store.getMetodePengadaan(tier),
    items_count: formData.items.length,
    items_breakdown: itemsByTier,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Store original table data for reference
    table_items: formData.items,
    tier_summary: formData.tier_summary || {}
  };
}

/**
 * Generate LP ID based on timestamp
 * Format: LP-{timestamp}
 */
export function generateLPId() {
  return `LP-${Date.now()}`;
}

/**
 * Generate LP Nomor for official numbering
 * Format: LP/{tahun}/{bulan}/{seq}
 */
export function generateLPNomor() {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = String(now.getMonth() + 1).padStart(2, '0');
  const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LP/${tahun}/${bulan}/${seq}`;
}

/**
 * Detect jenis LP from items
 */
export function detectJenis(items) {
  // If all items have "jasa" keyword, mark as JASA
  // If mixed, check for majority
  const jasaKeywords = ['jasa', 'layanan', 'jasa konsultasi', 'service'];
  const jasaCount = items.filter(item =>
    jasaKeywords.some(kw => item.description.toLowerCase().includes(kw))
  ).length;

  if (jasaCount > items.length / 2) return 'JASA';
  return 'BARANG';
}

/**
 * Convert Tier string to TIER key
 */
export function getTierKey(tierStr) {
  if (!tierStr) return 'TIER1';
  if (tierStr.includes('Tier 1')) return 'TIER1';
  if (tierStr.includes('Tier 2')) return 'TIER2';
  if (tierStr.includes('Tier 3')) return 'TIER3';
  return 'TIER1';
}

/**
 * Format currency for display
 */
export function formatCurrency(amount) {
  if (!amount) return 'Rp 0';
  return `Rp ${Number(amount).toLocaleString('id-ID')}`;
}

/**
 * Get tier color for UI
 */
export function getTierColor(tier) {
  const colors = {
    'Tier 1': '#1e40af',  // Blue
    'Tier 2': '#92400e',  // Orange/Brown
    'Tier 3': '#991b1b'   // Red
  };
  return colors[tier] || '#6b7280';
}

/**
 * Get tier background color for UI
 */
export function getTierBgColor(tier) {
  const colors = {
    'Tier 1': '#dbeafe',  // Light blue
    'Tier 2': '#fef3c7',  // Light yellow
    'Tier 3': '#fee2e2'   // Light red
  };
  return colors[tier] || '#f3f4f6';
}

/**
 * Save LP to localStorage (for offline support)
 */
export function saveLPToLocalStorage(lpData) {
  try {
    const key = `ppk_lp_${lpData.id}`;
    localStorage.setItem(key, JSON.stringify(lpData));
    
    // Update LP list index
    const listKey = 'ppk_lp_list';
    let lpList = [];
    const existing = localStorage.getItem(listKey);
    if (existing) {
      lpList = JSON.parse(existing);
    }
    
    // Add or update in list
    const idx = lpList.findIndex(lp => lp.id === lpData.id);
    if (idx >= 0) {
      lpList[idx] = { id: lpData.id, nomor: lpData.nomor, status: lpData.status };
    } else {
      lpList.unshift({ id: lpData.id, nomor: lpData.nomor, status: lpData.status });
    }
    
    localStorage.setItem(listKey, JSON.stringify(lpList));
    return true;
  } catch (err) {
    console.error('Error saving to localStorage:', err);
    return false;
  }
}

/**
 * Load LP from localStorage
 */
export function loadLPFromLocalStorage(lpId) {
  try {
    const key = `ppk_lp_${lpId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Error loading from localStorage:', err);
    return null;
  }
}

/**
 * Get all LPs from localStorage
 */
export function getAllLPsFromLocalStorage() {
  try {
    const listKey = 'ppk_lp_list';
    const list = localStorage.getItem(listKey);
    if (!list) return [];
    
    const lpIds = JSON.parse(list);
    return lpIds.map(item => loadLPFromLocalStorage(item.id)).filter(Boolean);
  } catch (err) {
    console.error('Error getting LPs:', err);
    return [];
  }
}

/**
 * Format date for display
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get LP status color for badge
 */
export function getStatusColor(status) {
  const colors = {
    DRAFT: 'gray',
    DIAJUKAN: 'yellow',
    DISETUJUI: 'blue',
    PROSES_PENGADAAN: 'orange',
    KONTRAK: 'purple',
    SERAH_TERIMA: 'cyan',
    PEMBAYARAN: 'pink',
    SELESAI: 'green',
    BATAL: 'red'
  };
  return colors[status] || 'gray';
}

/**
 * Get LP status label for display
 */
export function getStatusLabel(status) {
  const labels = {
    DRAFT: 'Draft',
    DIAJUKAN: 'Diajukan',
    DISETUJUI: 'Disetujui',
    PROSES_PENGADAAN: 'Proses Pengadaan',
    KONTRAK: 'Kontrak',
    SERAH_TERIMA: 'Serah Terima',
    PEMBAYARAN: 'Pembayaran',
    SELESAI: 'Selesai',
    BATAL: 'Batal'
  };
  return labels[status] || status;
}

/**
 * Export LP data as JSON for debugging/export
 */
export function exportLPAsJSON(lpData) {
  const dataStr = JSON.stringify(lpData, null, 2);
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(dataStr)}`);
  element.setAttribute('download', `${lpData.nomor || 'LP'}.json`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Import LP data from JSON file (for testing/migration)
 */
export function importLPFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON file: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
