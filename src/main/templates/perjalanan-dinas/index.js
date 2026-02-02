/**
 * Perjalanan Dinas Generators Registry
 * Mendaftarkan semua generator untuk dokumen perjalanan dinas
 */

const { SuratTugasGenerator } = require('./surat-tugas');
const { SPPDGenerator } = require('./sppd');
const { RincianBiayaPerdinGenerator } = require('./rincian-biaya');

const perdinGenerators = {
  'SURAT_TUGAS': new SuratTugasGenerator(),
  'SPPD': new SPPDGenerator(),
  'RINCIAN_BIAYA_PERDIN': new RincianBiayaPerdinGenerator(),
};

module.exports = { perdinGenerators };
