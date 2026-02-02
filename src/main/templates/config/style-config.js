/**
 * Style Configuration
 * Definisi gaya untuk dokumen
 */

const DOC_CONFIG = require('./doc-config');

const STYLE_CONFIG = {
  // Paragraph Styles
  PARAGRAPH_STYLES: {
    Normal: {
      name: 'Normal',
      basedOn: 'Normal',
      next: 'Normal',
      link: 'NormalChar',
      semiHidden: false,
      unhideWhenUsed: false,
      qFormat: true,
      pStyle: {
        spacing: {
          line: 240,
          lineRule: 'auto'
        },
        rStyle: {
          rFonts: {
            ascii: DOC_CONFIG.FONTS.DEFAULT,
            hAnsi: DOC_CONFIG.FONTS.DEFAULT,
            cs: DOC_CONFIG.FONTS.DEFAULT
          },
          sz: DOC_CONFIG.FONT_SIZES.NORMAL,
          szCs: DOC_CONFIG.FONT_SIZES.NORMAL,
          color: '000000',
          lang: {
            eastAsia: 'id-ID'
          }
        }
      }
    },

    Heading1: {
      name: 'Heading 1',
      basedOn: 'Normal',
      next: 'Normal',
      link: 'Heading1Char',
      semiHidden: false,
      unhideWhenUsed: false,
      qFormat: true,
      pStyle: {
        spacing: {
          before: 120,
          after: 120,
          line: 120,
          lineRule: 'auto'
        },
        rStyle: {
          b: true,
          rFonts: {
            ascii: DOC_CONFIG.FONTS.DEFAULT,
            hAnsi: DOC_CONFIG.FONTS.DEFAULT
          },
          sz: DOC_CONFIG.FONT_SIZES.HEADING1,
          szCs: DOC_CONFIG.FONT_SIZES.HEADING1,
          color: '2E75B6'
        }
      }
    },

    Heading2: {
      name: 'Heading 2',
      basedOn: 'Normal',
      next: 'Normal',
      link: 'Heading2Char',
      semiHidden: false,
      unhideWhenUsed: false,
      qFormat: true,
      pStyle: {
        spacing: {
          before: 120,
          after: 60,
          line: 120,
          lineRule: 'auto'
        },
        rStyle: {
          b: true,
          rFonts: {
            ascii: DOC_CONFIG.FONTS.DEFAULT,
            hAnsi: DOC_CONFIG.FONTS.DEFAULT
          },
          sz: DOC_CONFIG.FONT_SIZES.HEADING2,
          szCs: DOC_CONFIG.FONT_SIZES.HEADING2,
          color: '2E75B6'
        }
      }
    },

    Title: {
      name: 'Title',
      basedOn: 'Normal',
      next: 'Normal',
      link: 'TitleChar',
      semiHidden: false,
      unhideWhenUsed: false,
      qFormat: true,
      pStyle: {
        jc: 'center',
        spacing: {
          after: 240,
          line: 120,
          lineRule: 'auto'
        },
        rStyle: {
          b: true,
          rFonts: {
            ascii: DOC_CONFIG.FONTS.DEFAULT,
            hAnsi: DOC_CONFIG.FONTS.DEFAULT
          },
          sz: DOC_CONFIG.FONT_SIZES.TITLE,
          szCs: DOC_CONFIG.FONT_SIZES.TITLE,
          color: '000000'
        }
      }
    },

    Caption: {
      name: 'Caption',
      basedOn: 'Normal',
      next: 'Normal',
      link: 'CaptionChar',
      semiHidden: false,
      unhideWhenUsed: false,
      qFormat: false,
      pStyle: {
        spacing: {
          line: 120,
          lineRule: 'auto'
        },
        rStyle: {
          i: true,
          rFonts: {
            ascii: DOC_CONFIG.FONTS.DEFAULT,
            hAnsi: DOC_CONFIG.FONTS.DEFAULT
          },
          sz: DOC_CONFIG.FONT_SIZES.SMALL,
          szCs: DOC_CONFIG.FONT_SIZES.SMALL,
          color: '666666'
        }
      }
    }
  },

  // Character Styles
  CHARACTER_STYLES: {
    Strong: {
      name: 'Strong',
      basedOn: 'DefaultParagraphFont',
      link: 'Strong',
      rStyle: {
        b: true
      }
    },

    Emphasis: {
      name: 'Emphasis',
      basedOn: 'DefaultParagraphFont',
      link: 'Emphasis',
      rStyle: {
        i: true
      }
    },

    Underline: {
      name: 'Underline',
      basedOn: 'DefaultParagraphFont',
      link: 'Underline',
      rStyle: {
        u: 'single'
      }
    }
  },

  // Table Styles
  TABLE_STYLES: {
    NormalTable: {
      width: '100%',
      borders: {
        top: {
          color: '000000',
          space: 0,
          val: 'single',
          sz: 12
        },
        bottom: {
          color: '000000',
          space: 0,
          val: 'single',
          sz: 12
        },
        left: {
          color: '000000',
          space: 0,
          val: 'single',
          sz: 12
        },
        right: {
          color: '000000',
          space: 0,
          val: 'single',
          sz: 12
        },
        insideHorizontal: {
          color: '000000',
          space: 0,
          val: 'single',
          sz: 12
        },
        insideVertical: {
          color: '000000',
          space: 0,
          val: 'single',
          sz: 12
        }
      }
    },

    HeaderCell: {
      background: 'D9E1F2',
      textColor: '000000',
      bold: true
    }
  },

  // Default Styles
  DEFAULT_PARAGRAPH_STYLE: 'Normal',
  DEFAULT_CHARACTER_STYLE: 'Normal'
};

module.exports = STYLE_CONFIG;
