/**
 * Perjalanan Dinas Generators Registry
 * Mendaftarkan semua generator untuk dokumen perjalanan dinas
 */

const { SuratTugasGenerator } = require('./surat-tugas');
const { SPPDGenerator } = require('./sppd');
const { SPPDLembarKeduaGenerator } = require('./sppd-lembar-kedua');
const { RincianBiayaPerdinGenerator } = require('./rincian-biaya');

const perdinGenerators = {
  'SURAT_TUGAS': new SuratTugasGenerator(),
  'SPPD': new SPPDGenerator(),
  'SPPD_LEMBAR_KEDUA': new SPPDLembarKeduaGenerator(),
  'RINCIAN_BIAYA_PERDIN': new RincianBiayaPerdinGenerator(),
};

module.exports = { perdinGenerators };
