/**
 * SPPD Lembar Kedua (Halaman 2)
 * Format persis seperti hal2.pdf: 2 kolom, 7 baris
 */

const { BaseDocumentGenerator } = require('../generators/base-generator');
const { createParagraph } = require('../helpers/doc-helper');
const { Table, TableRow, TableCell, Paragraph, TextRun, BorderStyle, WidthType, VerticalAlign } = require('docx');

const B = { style: BorderStyle.SINGLE, size: 8, color: '000000' };
const N = { style: BorderStyle.NONE };
const SZ = 24;

class SPPDLembarKeduaGenerator extends BaseDocumentGenerator {
  constructor() { super('perjalanan-dinas', 'sppd-lembar-kedua'); }

  validate(data) {
    super.validate(data);
    if (!data.satker || !data.st) throw new Error('Data tidak lengkap');
    return true;
  }

  buildContent(data) {
    const dir = data.pejabat?.direktur || data.pejabat?.kpa || {};
    const kota = data.st.kota_asal || data.satker.kota || 'Sorong, Papua Barat';
    const nama = dir.nama || 'Daniel Heintje Ndahawali, S.Pi., M.Si';
    const nip = dir.nip || '19720717 200212 1 003';

    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // ROW 1: Section I - Left EMPTY (no border), Right has content
          new TableRow({ children: [
            // Left cell - EMPTY, NO BORDERS
            new TableCell({
              children: [new Paragraph('')],
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: N, bottom: N, left: N, right: N },
              margins: { top: 80, bottom: 80, left: 100, right: 100 }
            }),
            // Right cell - Section I content
            new TableCell({
              children: [
                this.p('I. Berangkat dari', '\t\t: ' + kota),
                this.p('   (Tempat Kedudukan)'),
                this.p('   Pada Tanggal', '\t\t:'),
                this.p('   Direktur,'),
                this.p(''), this.p(''), this.p(''), this.p(''), this.p(''),
                this.pBold('   ' + nama, true),
                this.p('   NIP. ' + nip)
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: N, bottom: N, left: N, right: N },
              margins: { top: 80, bottom: 80, left: 100, right: 100 }
            })
          ]}),

          // ROW 2: Section II
          new TableRow({ children: [
            this.cell([
              { t: 'II. Tiba di' },
              { t: '     Pada Tanggal' },
              { t: '     Kepala,', b: true },
              '', '', '', '', '', '',
              { t: '     (…………………………………………….. )' },
              { t: '     NIP.' }
            ]),
            this.cell([
              { t: 'Berangkat dari' },
              { t: 'Ke' },
              { t: 'Pada Tanggal' },
              { t: 'Kepala,', b: true },
              '', '', '', '', '',
              { t: '(…………………………………………….. )' },
              { t: 'NIP.' }
            ])
          ]}),

          // ROW 3: Section III
          new TableRow({ children: [
            this.cell([
              { t: 'III. Tiba di\t\t\t:' },
              { t: '      Pada Tanggal\t\t:' },
              { t: '      K e p a l a,' },
              '', '', '', '', '', '',
              { t: '      (…………………………….. )' },
              { t: '      NIP.' }
            ]),
            this.cell([
              { t: 'Berangkat dari\t\t:' },
              { t: 'Ke\t\t\t\t:' },
              { t: 'Pada Tanggal\t\t:' },
              { t: 'K e p a l a,' },
              '', '', '', '', '',
              { t: '(…………………………………)' },
              { t: 'NIP.' }
            ])
          ]}),

          // ROW 4: Section IV
          new TableRow({ children: [
            this.cell([
              { t: 'IV. Tiba di\t\t\t:' },
              { t: '     Pada Tanggal\t\t:' },
              { t: '     K e p a l a ,' },
              '', '', '', '', '', '',
              { t: '     (…………………………………)' },
              { t: '     NIP.' }
            ]),
            this.cell([
              { t: 'Berangkat dari\t\t:' },
              { t: 'Ke\t\t\t\t:' },
              { t: 'Pada Tanggal\t\t:' },
              { t: 'K e p a l a,' },
              '', '', '', '', '',
              { t: '(…………………………………)' },
              { t: 'NIP.' }
            ])
          ]}),

          // ROW 5: Section V
          new TableRow({ children: [
            this.cell([
              { t: 'V. Tiba di\t\t\t:' },
              { t: '    Pada Tanggal\t\t:' },
              { t: '    K e p a l a ,' },
              '', '', '', '', '', '',
              { t: '    (…………………………………)' },
              { t: '    NIP.' }
            ]),
            this.cell([
              { t: 'Berangkat dari\t\t:' },
              { t: 'Ke\t\t\t\t:' },
              { t: 'Pada Tanggal\t\t:' },
              { t: 'K e p a l a,' },
              '', '', '', '', '',
              { t: '(…………………………………)' },
              { t: 'NIP.' }
            ])
          ]}),

          // ROW 6: Section VI
          new TableRow({ children: [
            this.cell([
              { t: 'VI. Tiba di' },
              { t: '     (Tempat Kedudukan)' },
              { t: '     Pada Tanggal' },
              '',
              { t: '     Direktur,' },
              '', '', '', '', '', '',
              { t: '     ' + nama, b: true, u: true },
              { t: '     NIP. ' + nip }
            ]),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({
                    text: 'Telah diperiksa dengan keterangan bahwa perjalanan tersebut atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.',
                    size: SZ
                  })]
                })
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: B, bottom: B, left: B, right: B },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 80, bottom: 80, left: 100, right: 100 }
            })
          ]}),

          // ROW 7: Section VII (spans 2 columns)
          new TableRow({ children: [
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: 'VII. Catatan Lain-lain', size: SZ, bold: true })] }),
                new Paragraph({ children: [new TextRun({ text: '', size: SZ })] }),
                new Paragraph({ children: [new TextRun({ text: '', size: SZ })] })
              ],
              columnSpan: 2,
              borders: { top: B, bottom: B, left: B, right: B },
              margins: { top: 80, bottom: 80, left: 100, right: 100 }
            })
          ]})
        ]
      }),

      // Section VIII (outside table)
      createParagraph(''),
      createParagraph('VIII. PERHATIAN :', { bold: true, size: SZ }),
      createParagraph('PPK yang menerbitkan SPD, Pegawai yang melakukan Perjalanan Dinas, Para Pejabat yang mengesahkan tanggal berangkat/tiba, serta Bendahara Pengeluaran bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila negara menderita rugi akibat kesalahan/kelalaian dan kealpaannya.', { size: SZ, align: 'justify' })
    ];
  }

  // Helper: create paragraph with optional second part
  p(text, text2 = '') {
    const runs = [new TextRun({ text: text, size: SZ })];
    if (text2) runs.push(new TextRun({ text: text2, size: SZ, bold: true }));
    return new Paragraph({ children: runs });
  }

  // Helper: create bold/underlined paragraph
  pBold(text, underline = false) {
    return new Paragraph({
      children: [new TextRun({ text: text, size: SZ, bold: true, underline: underline ? {} : undefined })]
    });
  }

  // Helper: create cell with borders
  cell(items) {
    const children = items.map(item => {
      if (typeof item === 'string' || item === '') {
        return new Paragraph({ children: [new TextRun({ text: '', size: SZ })] });
      }
      return new Paragraph({
        children: [new TextRun({
          text: item.t || '',
          size: SZ,
          bold: item.b,
          underline: item.u ? {} : undefined
        })]
      });
    });

    return new TableCell({
      children: children,
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: { top: B, bottom: B, left: B, right: B },
      margins: { top: 80, bottom: 80, left: 100, right: 100 }
    });
  }

  getSuggestedFilename(data) {
    return `SPPD_Hal2_${(data.st.nomor_sppd || data.st.nomor).replace(/\//g, '-')}.docx`;
  }
}

module.exports = { SPPDLembarKeduaGenerator };
