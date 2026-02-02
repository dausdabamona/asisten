/**
 * Format Helper
 * Utility functions untuk formatting text
 */

const dayjs = require('dayjs');
require('dayjs/locale/id');

dayjs.locale('id');

/**
 * Format angka menjadi Rupiah
 * @param {number} amount
 * @returns {string} Format: Rp. X.XXX.XXX,00
 */
function formatRupiah(amount) {
  if (!amount && amount !== 0) return 'Rp. 0,00';
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const parts = absAmount.toFixed(2).split('.');
  const integer = parts[0];
  const decimal = parts[1];
  
  const integerParts = [];
  let counter = 0;
  
  for (let i = integer.length - 1; i >= 0; i--) {
    if (counter === 3) {
      integerParts.unshift('.');
      counter = 0;
    }
    integerParts.unshift(integer[i]);
    counter++;
  }
  
  const formatted = `Rp. ${integerParts.join('')},${decimal}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Konversi angka ke terbilang dalam Bahasa Indonesia
 * @param {number} num Angka (sampai triliun)
 * @returns {string} Terbilang
 */
function terbilang(num) {
  const ones = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
  const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];
  const scales = ['', 'ribu', 'juta', 'miliar', 'triliun'];
  
  if (num === 0) return 'nol';
  if (num < 0) return `negatif ${terbilang(Math.abs(num))}`;
  
  const handleTens = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n === 10) return 'sepuluh';
    if (n < 20) return `${ones[n - 10]} belas`;
    return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ''}`;
  };
  
  const handleHundreds = (n) => {
    if (n === 0) return '';
    if (n < 100) return handleTens(n);
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    return `${hundreds === 1 ? 'seratus' : `${ones[hundreds]} ratus`}${remainder ? ` ${handleTens(remainder)}` : ''}`;
  };
  
  let result = '';
  let scaleIndex = 0;
  
  while (num > 0) {
    const group = num % 1000;
    if (group !== 0) {
      const groupText = handleHundreds(group);
      const scaleText = scales[scaleIndex];
      result = `${groupText}${scaleText ? ` ${scaleText}` : ''} ${result}`;
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }
  
  return result.trim();
}

/**
 * Format angka ke terbilang rupiah
 * @param {number} amount
 * @returns {string} Terbilang rupiah
 */
function terbilangRupiah(amount) {
  return `${terbilang(Math.floor(amount))} rupiah`;
}

/**
 * Format tanggal panjang (e.g., "15 Januari 2024")
 * @param {Date|string} date
 * @returns {string}
 */
function formatTanggalPanjang(date) {
  return dayjs(date).format('DD MMMM YYYY');
}

/**
 * Format tanggal pendek (e.g., "15/01/2024")
 * @param {Date|string} date
 * @returns {string}
 */
function formatTanggalPendek(date) {
  return dayjs(date).format('DD/MM/YYYY');
}

/**
 * Format hari dan tanggal (e.g., "Selasa, 15 Januari 2024")
 * @param {Date|string} date
 * @returns {string}
 */
function formatTanggalHari(date) {
  return dayjs(date).format('dddd, DD MMMM YYYY');
}

/**
 * Format bulan dan tahun (e.g., "Januari 2024")
 * @param {Date|string} date
 * @returns {string}
 */
function formatBulanTahun(date) {
  return dayjs(date).format('MMMM YYYY');
}

/**
 * Format waktu (e.g., "14:30:45" atau "14:30")
 * @param {Date|string} date
 * @param {boolean} withSeconds
 * @returns {string}
 */
function formatWaktu(date, withSeconds = false) {
  return withSeconds ? dayjs(date).format('HH:mm:ss') : dayjs(date).format('HH:mm');
}

/**
 * Pad number dengan leading zeros
 * @param {number} num
 * @param {number} length
 * @returns {string}
 */
function padNumber(num, length = 2) {
  return String(num).padStart(length, '0');
}

module.exports = {
  formatRupiah,
  terbilang,
  terbilangRupiah,
  formatTanggalPanjang,
  formatTanggalPendek,
  formatTanggalHari,
  formatBulanTahun,
  formatWaktu,
  padNumber
};
