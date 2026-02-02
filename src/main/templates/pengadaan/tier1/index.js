const { NotaDinasPermintaanGenerator } = require('./nota-dinas-permintaan');
const { KwitansiTier1Generator } = require('./kwitansi');

const tier1Generators = {
  'NOTA_DINAS_PERMINTAAN_TIER1': new NotaDinasPermintaanGenerator(),
  'KWITANSI_TIER1': new KwitansiTier1Generator(),
};

module.exports = { tier1Generators };
