# Fase 10A: Setup Template Engine & Helper

## Overview

Fase 10A merupakan fase persiapan untuk sistem pembuatan dokumen template dalam PPK ASISTEN. Fase ini membangun infrastruktur dasar yang dapat digunakan untuk membuat berbagai jenis dokumen (Surat Tugas, SPPD, Kwitansi, dll) secara konsisten dan efisien.

## Objective

Membuat fondasi yang kuat untuk document generation system dengan:
- Configuration management terpusat
- Helper functions yang reusable
- Base generator class untuk extensibility
- IPC handlers untuk safe document operations
- Consistent styling dan formatting

## Deliverables

### 1. Configuration Files

#### doc-config.js
- **Path**: `src/main/templates/config/doc-config.js`
- **Purpose**: Konfigurasi dokumen terpusat
- **Contents**:
  - PAGE: F4, A4, LETTER (dalam DXA units)
  - MARGINS: NORMAL, NARROW, WIDE
  - FONTS: DEFAULT, SERIF, MONOSPACE
  - FONT_SIZES: TINY hingga TITLE (dalam half-points)
  - SPACING: SINGLE, ONEPOINT5, DOUBLE (dalam twips)
  - INDENT: NONE, SMALL, MEDIUM, LARGE (dalam twips)

**Key Measurements**:
- 1 inch = 1440 DXA
- 1mm ≈ 56.7 DXA
- F4 = 215mm × 330mm (Indonesian Government Standard)
- Default: Arial, 11pt, Single-spaced

#### style-config.js
- **Path**: `src/main/templates/config/style-config.js`
- **Purpose**: Definisi gaya dokumen
- **Contents**:
  - PARAGRAPH_STYLES: Normal, Heading1, Heading2, Title, Caption
  - CHARACTER_STYLES: Strong, Emphasis, Underline
  - TABLE_STYLES: NormalTable, HeaderCell styling
  - Default paragraph & character style

### 2. Helper Functions

#### format-helper.js
- **Path**: `src/main/templates/helpers/format-helper.js`
- **Functions**:
  ```javascript
  formatRupiah(amount)           // "Rp. 1.000.000,00"
  terbilang(num)                 // "satu juta" (up to triliun)
  terbilangRupiah(amount)        // "satu juta rupiah"
  formatTanggalPanjang(date)     // "15 Januari 2024"
  formatTanggalPendek(date)      // "15/01/2024"
  formatTanggalHari(date)        // "Selasa, 15 Januari 2024"
  formatBulanTahun(date)         // "Januari 2024"
  formatWaktu(date, withSeconds) // "14:30:45" atau "14:30"
  padNumber(num, length)         // "01", "001"
  ```
- **Dependencies**: dayjs dengan Indonesian locale

#### doc-helper.js
- **Path**: `src/main/templates/helpers/doc-helper.js`
- **Functions**:
  ```javascript
  createDocument(sections)       // Buat Document baru
  createParagraph(options)       // Buat Paragraph dengan styling
  createSpacer(count)            // Buat empty paragraphs untuk spacing
  createPageBreak()              // Buat page break
  getAlignment(align)            // Get AlignmentType dari string
  saveDocument(doc, filePath)    // Simpan dokumen ke file
  generateBuffer(doc)            // Generate buffer dari dokumen
  ```
- **Options**: align, spacing, indent, style

#### table-helper.js
- **Path**: `src/main/templates/helpers/table-helper.js`
- **Functions**:
  ```javascript
  createSimpleTable(headers, rows, options)      // Tabel standar dengan headers
  createKeyValueTable(data, options)             // Tabel key-value 2 kolom
  createSignatureTable(signatories, columnCount) // Tabel tanda tangan
  ```
- **BORDERS Constant**: SINGLE (all borders), NONE (no borders)
- **Features**: Header background color, custom widths, alignment

#### kop-surat-helper.js
- **Path**: `src/main/templates/helpers/kop-surat-helper.js`
- **Functions**:
  ```javascript
  createKopSurat(options)               // Buat kop surat pemerintah
  createTempatTanggal(options)          // Buat "Tempat, Tanggal"
  createTandaTanganSingle(options)      // Tanda tangan satu pejabat
  createTandaTanganGanda(signatories)   // Tanda tangan dua pejabat
  ```
- **Options**: ministri, institusi, subunit, alamat, telepon, email, website

### 3. Base Generator Class

#### base-generator.js
- **Path**: `src/main/templates/generators/base-generator.js`
- **Class**: `BaseGenerator` (abstract)
- **Methods**:
  ```javascript
  constructor(data, options)      // Initialize dengan data & options
  validate()                      // Validasi data (override di subclass)
  buildContent()                  // Build sections (ABSTRACT - override required)
  generate(options)               // Generate Document object
  generateAndSave(filePath)       // Generate & simpan ke file
  generateBuffer(options)         // Generate & return buffer
  getSuggestedFilename()          // Return suggested filename
  getPageSize()                   // Get page configuration
  getMargins()                    // Get margin configuration
  ```

**Usage Pattern**:
```javascript
class STGenerator extends BaseGenerator {
  validate() {
    if (!this.data.nomor_st) throw new Error('nomor_st required');
  }
  
  buildContent() {
    return [{
      children: [
        ...createKopSurat({ministri: 'KEMENAKERTRANS'}),
        createParagraph({text: this.data.judul, align: 'center', bold: true}),
        ...
      ]
    }];
  }
}
```

### 4. IPC Handlers

#### dokumen.js
- **Path**: `src/main/api/dokumen.js`
- **IPC Channels**:

##### dokumen:generate
Generate dokumen dan simpan ke file
```javascript
ipcRenderer.invoke('dokumen:generate', 'ST', data, {
  fileName: 'ST-2024-001.docx',
  savePath: '/path/to/save'
})
// Returns: {success: true, filePath: '...', fileName: 'ST-2024-001.docx'}
```

##### dokumen:preview
Generate dokumen dan return buffer untuk preview
```javascript
ipcRenderer.invoke('dokumen:preview', 'ST', data)
// Returns: {success: true, buffer: '...base64...'}
```

##### dokumen:open
Buka dokumen dengan aplikasi default
```javascript
ipcRenderer.invoke('dokumen:open', '/path/to/file.docx')
// Returns: {success: true}
```

##### dokumen:openFolder
Buka folder dokumen di file explorer
```javascript
ipcRenderer.invoke('dokumen:openFolder', '/path/to/folder')
// Returns: {success: true}
```

##### dokumen:list
List semua dokumen di folder
```javascript
ipcRenderer.invoke('dokumen:list', '/path/to/folder')
// Returns: {success: true, files: [{name, path, size, created, modified}, ...]}
```

##### dokumen:delete
Hapus file dokumen
```javascript
ipcRenderer.invoke('dokumen:delete', '/path/to/file.docx')
// Returns: {success: true}
```

**Registration**:
```javascript
const { registerGenerator, initializeDocumentAPI } = require('./api/dokumen');
const STGenerator = require('./templates/generators/st-generator');

registerGenerator('ST', STGenerator);
initializeDocumentAPI();
```

## Directory Structure

```
src/main/templates/
├── config/
│   ├── doc-config.js           # Document configuration
│   └── style-config.js         # Style definitions
├── helpers/
│   ├── format-helper.js        # Formatting utilities
│   ├── doc-helper.js           # Document element creation
│   ├── table-helper.js         # Table utilities
│   └── kop-surat-helper.js     # Government letterhead
├── generators/
│   ├── base-generator.js       # Abstract base class
│   ├── st-generator.js         # Surat Tugas generator (Fase 10B)
│   ├── sppd-generator.js       # SPPD generator (Fase 10C)
│   └── ...                     # Other generators
└── templates/                  # Static template files
    ├── pengadaan/
    ├── pjlp/
    ├── kegiatan/
    ├── perjalanan-dinas/
    └── keuangan/
```

## Integration Points

### 1. Main Process (main.js)
```javascript
const { registerGenerator, initializeDocumentAPI } = require('./api/dokumen');

// After all generators created:
registerGenerator('ST', STGenerator);
registerGenerator('SPPD', SPPDGenerator);
// ... other generators

initializeDocumentAPI();
```

### 2. Renderer Process (Vue components)
```javascript
import { ipcRenderer } from 'electron';

// In Pinia store or component:
async function generateST(data) {
  const result = await ipcRenderer.invoke('dokumen:generate', 'ST', data, {
    fileName: `ST-${data.nomor_st}.docx`
  });
  
  if (result.success) {
    console.log('Generated:', result.filePath);
  }
}
```

## Key Features

### 1. DXA Unit System
- All measurements in DXA (1/20th of a point)
- Conversion: 1 inch = 1440 DXA, 1mm ≈ 56.7 DXA
- Standardized in all config files

### 2. Indonesian Localization
- Date formatting dengan Indonesian locale (dayjs)
- Terbilang function untuk nominal dalam kata-kata
- Rupiah formatting dengan proper separators

### 3. Extensibility
- Base generator class dengan template method pattern
- Easy to add new generators by extending BaseGenerator
- Centralized configuration for consistency

### 4. Error Handling
- Validation in BaseGenerator.validate()
- Try-catch in all IPC handlers
- Clear error messages returned to renderer

### 5. File Management
- Automatic DOCS_PATH creation (~Documents/PPK-ASISTEN/dokumen)
- File listing, deletion, opening via IPC
- Base64 buffer for preview functionality

## Dependencies

- **docx**: ^8.5.0 (Word document generation)
- **dayjs**: For date formatting with locale
- **fs** (Node.js built-in): File operations
- **path** (Node.js built-in): Path utilities
- **electron**: For IPC and shell operations

## Performance Considerations

1. **Buffer Generation**: Large documents generate buffers in-memory
2. **Async Operations**: All file I/O is async via Promises
3. **Caching**: Configurations are static, loaded once
4. **Streaming**: Future phases can implement streaming for very large documents

## Security Considerations

1. **Path Validation**: All file paths should be validated
2. **Sandboxing**: IPC handlers run in main process, safe from renderer context
3. **File Permissions**: Use appropriate fs permissions
4. **Data Sanitization**: Input data should be validated before document generation

## Testing Strategy

### Unit Tests (recommended)
- Format helper functions (roundtrip tests for date/number formats)
- Table creation with various options
- Signature table layout

### Integration Tests
- BaseGenerator with mock subclass
- IPC handler calls from renderer
- File creation and deletion

### Manual Tests
- Generate actual documents and verify formatting
- Test with different page sizes and margins
- Verify Indonesian text rendering (fonts)

## Future Enhancements (Fase 10B+)

1. **STGenerator**: Implement Surat Tugas document generator
2. **SPPDGenerator**: Implement SPPD document generator
3. **Preview**: Add real-time preview in Vue component
4. **Templates**: Create actual template files with placeholders
5. **Watermarks**: Add watermark support for draft documents
6. **Barcode**: Add barcode/QR code generation
7. **Multilingual**: Support multiple languages
8. **Batch Generation**: Generate multiple documents at once

## Known Limitations

1. **Font Embedding**: Assumes Arial/Times New Roman installed on system
2. **Complex Layouts**: Limited support for complex multi-column layouts
3. **Images**: Image insertion not yet implemented
4. **Signing**: Digital signature/seal not yet implemented
5. **Header/Footer**: Currently built into page content, not true headers/footers

## Troubleshooting

### Issue: Font not rendering correctly
**Solution**: Verify font installed on system. Use `createParagraph` with explicit font option.

### Issue: DXA measurements seem off
**Solution**: Remember 1 inch = 1440 DXA. Verify measurements are in DXA, not points.

### Issue: IPC handler not found
**Solution**: Ensure `registerGenerator()` called and `initializeDocumentAPI()` invoked in main.js.

### Issue: File not saved
**Solution**: Check DOCS_PATH permissions. Ensure path exists (auto-created).

## References

- [DOCX NPM Package](https://www.npmjs.com/package/docx)
- [Office Open XML Specs](https://ecma-international.org/publications-and-standards/standards/ecma-376/)
- [DXA Unit System](https://en.wikipedia.org/wiki/Office_Open_XML#Units)
- [Indonesian Government Document Standards](https://www.perpustakaan.kemenagri.go.id/)

---

**Status**: ✅ COMPLETE (Fase 10A)
**Created**: 2024
**Version**: 1.0
**Next Phase**: Fase 10B - STGenerator Implementation
