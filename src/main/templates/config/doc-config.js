/**
 * Document Configuration
 * Centralized configuration untuk semua dokumen
 */

const DOC_CONFIG = {
  // Ukuran Halaman (F4 adalah standard Indonesia)
  PAGE: {
    F4: {
      width: 3090,  // 215mm dalam DXA (1mm = 56.7 DXA)
      height: 4680  // 330mm dalam DXA
    },
    A4: {
      width: 2790,  // 210mm dalam DXA
      height: 3960  // 297mm dalam DXA
    },
    LETTER: {
      width: 3168,  // 8.5 inch dalam DXA (1 inch = 1440 DXA / 8.5 = 169.4 DXA per mm)
      height: 4104  // 11 inch dalam DXA
    }
  },

  // Margin Default (dalam DXA)
  MARGINS: {
    NORMAL: {
      top: 1440,     // 1 inch
      right: 1080,   // 0.75 inch
      bottom: 1440,  // 1 inch
      left: 1440     // 1 inch
    },
    NARROW: {
      top: 720,      // 0.5 inch
      right: 720,    // 0.5 inch
      bottom: 720,   // 0.5 inch
      left: 720      // 0.5 inch
    },
    WIDE: {
      top: 1800,     // 1.25 inch
      right: 1440,   // 1 inch
      bottom: 1800,  // 1.25 inch
      left: 1440     // 1 inch
    }
  },

  // Font Definition
  FONTS: {
    DEFAULT: 'Arial',
    SERIF: 'Times New Roman',
    MONOSPACE: 'Courier New'
  },

  // Font Sizes (dalam half-points, jadi 24 = 12pt)
  FONT_SIZES: {
    TINY: 16,        // 8pt
    SMALL: 18,       // 9pt
    NORMAL: 22,      // 11pt
    BODY: 22,        // 11pt
    LARGE: 28,       // 14pt
    XLARGE: 32,      // 16pt
    TITLE: 32,       // 16pt
    HEADING1: 32,    // 16pt
    HEADING2: 28,    // 14pt
    HEADING3: 24,    // 12pt
  },

  // Spacing (dalam twips, 1 twip = 1/20 point)
  SPACING: {
    SINGLE: 0,
    ONEPOINT5: 240,  // 1.5x
    DOUBLE: 480      // 2x
  },

  // Indentation (dalam twips)
  INDENT: {
    NONE: 0,
    SMALL: 360,      // 0.5 inch
    MEDIUM: 720,     // 1 inch
    LARGE: 1440      // 2 inch
  },

  // Default Page Configuration
  DEFAULT_PAGE: 'F4',
  DEFAULT_MARGIN: 'NORMAL',
  DEFAULT_FONT_SIZE: 'NORMAL'
};

module.exports = DOC_CONFIG;
