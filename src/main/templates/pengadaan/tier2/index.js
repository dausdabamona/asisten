const { UndanganPenawaranGenerator } = require('./undangan-penawaran');
const { BANegosiasi } = require('./ba-negosiasi');
const { SuratPesananGenerator } = require('./surat-pesanan');
const { BASTGenerator } = require('./bast');
const { BAPemeriksaanPekerjaanGenerator } = require('./ba-pemeriksaan-pekerjaan');
const { SpesifikasiTeknis } = require('./spesifikasi-teknis');
const { HPSGenerator } = require('./hps');
const { KwitansiTier2Generator } = require('./kwitansi');
const { SSPPph22Generator } = require('./ssp-pph22');

const tier2Generators = {
  'NOTA_DINAS_PERMINTAAN_TIER2': new UndanganPenawaranGenerator(),
  'UNDANGAN_PENAWARAN': new UndanganPenawaranGenerator(),
  'BA_NEGOSIASI': new BANegosiasi(),
  'SURAT_PESANAN': new SuratPesananGenerator(),
  'BAST_TIER2': new BASTGenerator(),
  'BA_PEMERIKSAAN_PEKERJAAN': new BAPemeriksaanPekerjaanGenerator(),
  'SPESIFIKASI_TEKNIS': new SpesifikasiTeknis(),
  'HPS': new HPSGenerator(),
  'KWITANSI_TIER2': new KwitansiTier2Generator(),
  'SSP_PPh22': new SSPPph22Generator(),
};

module.exports = { tier2Generators };
