const { KAKTORGenerator } = require('./kak-tor');
const { KontrakLengkapGenerator } = require('./kontrak');

const tier3Generators = {
  'KAK_TOR': new KAKTORGenerator(),
  'KONTRAK_LENGKAP': new KontrakLengkapGenerator(),
};

module.exports = { tier3Generators };
