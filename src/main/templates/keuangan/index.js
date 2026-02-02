const { SSPPPhGenerator } = require('./ssp-pph');

/**
 * Registry untuk semua generator dokumen keuangan
 * 
 * Kategori: Keuangan (Umum)
 * Generators: 1 (akan bertambah untuk SPP, dll)
 */
const keuanganGenerators = {
  'SSP_PPH': new SSPPPhGenerator(),
  // TODO: Tambahkan generator lainnya
  // 'SPP': new SPPGenerator(),
  // 'SPM': new SPMGenerator(),
};

module.exports = { keuanganGenerators };
