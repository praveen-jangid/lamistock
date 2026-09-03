import * as XLSX from 'xlsx';
import type { BulkOrderItem } from '../types/panel';

export function saveBlobAs(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses any dimension string or number into decimal inches.
 * Supports:
 * - Plain numbers: 27 -> 27, 0.75 -> 0.75
 * - Fractions: "5/8" -> 0.625, "1 1/2" -> 1.5, "3/4\"" -> 0.75
 * - Sut / Soota notation (1 sut = 1/8"): "28-5'''" -> 28.625, "15\"-6'''" -> 15.75, "5'''" -> 0.625
 * - Millimeters: "15mm" -> 0.59
 */
export function parseDimensionToInches(val: any): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Number(val.toFixed(4));
  }

  if (!val) return 0;

  let str = String(val).trim();

  // Remove common artifacts
  str = str.replace(/["”]/g, '').trim();

  // Millimeters e.g. "15mm"
  if (/mm$/i.test(str)) {
    const mmVal = parseFloat(str.replace(/mm/i, '').trim());
    return isNaN(mmVal) ? 0 : Number((mmVal / 25.4).toFixed(4));
  }

  // Pure Sut/Soot notation e.g. "5'''", "6'", "5 soot", "5soot", "5 sut", "5sut", "5soota"
  const pureSutMatch = str.match(/^(\d+)(?:'+|\s*(?:sut|soot|soota|suta))$/i);
  if (pureSutMatch) {
    const suts = parseInt(pureSutMatch[1], 10);
    return Number((suts / 8).toFixed(4));
  }

  // Combined Inches - Sut/Soot notation e.g. "28-5'''", "28-5 soot", "28-5"
  const inchSutMatch = str.match(/^(\d+)[- ]+(\d+)(?:'+|\s*(?:sut|soot|soota|suta))?$/i);
  if (inchSutMatch) {
    const inches = parseInt(inchSutMatch[1], 10);
    const suts = parseInt(inchSutMatch[2], 10);
    return Number((inches + suts / 8).toFixed(4));
  }

  // Mixed fraction notation e.g. "1 1/2" or "2 3/8"
  const mixedFracMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedFracMatch) {
    const whole = parseInt(mixedFracMatch[1], 10);
    const num = parseInt(mixedFracMatch[2], 10);
    const den = parseInt(mixedFracMatch[3], 10);
    return den !== 0 ? Number((whole + num / den).toFixed(4)) : 0;
  }

  // Pure fraction notation e.g. "5/8" or "3/4"
  const pureFracMatch = str.match(/^(\d+)\/(\d+)$/);
  if (pureFracMatch) {
    const num = parseInt(pureFracMatch[1], 10);
    const den = parseInt(pureFracMatch[2], 10);
    return den !== 0 ? Number((num / den).toFixed(4)) : 0;
  }

  // Plain float
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Number(parsed.toFixed(4));
}

export interface ParseExcelResult {
  orderTitle: string;
  items: BulkOrderItem[];
  warnings: string[];
}

/**
 * Normalizes a header string for flexible fuzzy matching
 */
function normalizeHeader(h: any): string {
  if (!h) return '';
  return String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
}

const isPartHeader = (h: string) =>
  ['part', 'particular', 'item', 'panel', 'desc', 'name', 'label'].some((k) => h.includes(k));

const isLengthHeader = (h: string) =>
  ['length', 'len', 'lambi'].some((k) => h.includes(k)) || h === 'l';

const isWidthHeader = (h: string) =>
  ['width', 'wid', 'chodai', 'breadth'].some((k) => h.includes(k)) || h === 'w' || h === 'b';

const isThicknessHeader = (h: string) =>
  ['thick', 'thk', 'gauge', 'depth', 'motai'].some((k) => h.includes(k)) || h === 't';

const isQtyHeader = (h: string) =>
  ['qty', 'quantity', 'quant', 'count', 'piece', 'pcs', 'nos', 'nag'].some((k) => h.includes(k));

const isWoodHeader = (h: string) =>
  ['wood', 'species', 'timber', 'material'].some((k) => h.includes(k));

const isRemarksHeader = (h: string) =>
  ['remark', 'note', 'finish', 'type', 'comment'].some((k) => h.includes(k));

/**
 * Parses an uploaded Excel (.xlsx, .xls) or CSV file buffer into an array of BulkOrderItem.
 */
export function parseOrderSpreadsheet(buffer: ArrayBuffer, fileName: string): ParseExcelResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error('Spreadsheet has no readable sheets.');
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (rawRows.length === 0) {
    throw new Error('The uploaded spreadsheet is empty.');
  }

  // Try extracting an order title from top rows or filename
  let orderTitle = fileName.replace(/\.[^/.]+$/, '');
  for (let r = 0; r < Math.min(8, rawRows.length); r++) {
    const row = rawRows[r];
    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] || '').trim();
      if (/item\s*name/i.test(cellVal)) {
        // Look in this cell or subsequent non-empty cells
        const remainder = cellVal.replace(/^item\s*name\s*[:-]?\s*/i, '').trim();
        if (remainder.length > 2) {
          orderTitle = remainder;
          break;
        }
        for (let next = c + 1; next < row.length; next++) {
          const nextVal = String(row[next] || '').trim();
          if (nextVal.length > 2) {
            orderTitle = nextVal;
            break;
          }
        }
        break;
      }
    }
  }

  // Locate the header row
  let headerRowIndex = -1;
  let partIdx = -1;
  let lenIdx = -1;
  let widIdx = -1;
  let thkIdx = -1;
  let qtyIdx = -1;
  let woodIdx = -1;
  let remarksIdx = -1;

  // Search each row for header candidates
  for (let r = 0; r < Math.min(25, rawRows.length); r++) {
    const row = rawRows[r];
    const normalized = row.map(normalizeHeader);

    const pIdx = normalized.findIndex(isPartHeader);
    const lIdx = normalized.findIndex(isLengthHeader);
    const wIdx = normalized.findIndex(isWidthHeader);
    const tIdx = normalized.findIndex(isThicknessHeader);
    const qIdx = normalized.findIndex(isQtyHeader);

    // If it has at least Length + Width (or Part + Size)
    if ((lIdx !== -1 && wIdx !== -1) || (pIdx !== -1 && lIdx !== -1)) {
      headerRowIndex = r;
      partIdx = pIdx;
      lenIdx = lIdx;
      widIdx = wIdx;
      thkIdx = tIdx;
      qtyIdx = qIdx;
      woodIdx = normalized.findIndex(isWoodHeader);
      remarksIdx = normalized.findIndex(isRemarksHeader);
      break;
    }

    // Special handler for factory format with "Size" spanning cols (e.g. Size | X | Size | X | Size)
    const sizeColIdx = normalized.findIndex((c) => c === 'size');
    if (sizeColIdx !== -1 && pIdx !== -1) {
      headerRowIndex = r;
      partIdx = pIdx;
      lenIdx = sizeColIdx;
      widIdx = sizeColIdx + 2; // e.g. Col 4 = Len, Col 5 = X, Col 6 = Wid
      thkIdx = sizeColIdx + 4; // Col 7 = X, Col 8 = Thk
      qtyIdx = normalized.findIndex(isQtyHeader);
      woodIdx = normalized.findIndex(isWoodHeader);
      remarksIdx = normalized.findIndex(isRemarksHeader);
      break;
    }
  }

  // If no header found, assume standard columns: Col 0: Part, Col 1: Length, Col 2: Width, Col 3: Thickness, Col 4: Qty
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    partIdx = 0;
    lenIdx = 1;
    widIdx = 2;
    thkIdx = 3;
    qtyIdx = 4;
    woodIdx = 5;
    remarksIdx = 6;
  }

  const items: BulkOrderItem[] = [];
  const warnings: string[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.every((c) => c === '')) continue;

    const rawPart = partIdx !== -1 ? String(row[partIdx] || '').replace(/[:-]/g, '').trim() : `Item ${items.length + 1}`;
    if (!rawPart || /required\s*size|last\s*updated|mdf|veneer|cft/i.test(rawPart)) {
      // Skip formula or footer metadata rows
      continue;
    }

    const rawLen = lenIdx !== -1 ? row[lenIdx] : '';
    const rawWid = widIdx !== -1 ? row[widIdx] : '';
    const rawThk = thkIdx !== -1 ? row[thkIdx] : '0.75';
    const rawQty = qtyIdx !== -1 ? row[qtyIdx] : 1;

    const length = parseDimensionToInches(rawLen);
    const width = parseDimensionToInches(rawWid);
    const thickness = parseDimensionToInches(rawThk) || 0.75; // Default 0.75" if unspecified
    const quantityNeeded = Math.max(1, parseInt(String(rawQty), 10) || 1);

    if (length <= 0 || width <= 0) {
      // Skip invalid dimensions
      continue;
    }

    const rawWood = woodIdx !== -1 ? String(row[woodIdx] || '').trim() : '';
    const woodType = rawWood === 'M' || !rawWood ? 'Mango Wood' : rawWood;
    const remarks = remarksIdx !== -1 ? String(row[remarksIdx] || '').trim() : '';

    const rawSizeString = `${rawLen} × ${rawWid} × ${rawThk}`;

    items.push({
      id: `bulk-item-${items.length + 1}-${Date.now().toString(36)}`,
      partName: rawPart,
      length: Math.max(length, width), // Standardize Length >= Width
      width: Math.min(length, width),
      thickness,
      quantityNeeded,
      woodType,
      remarks,
      rawSizeString
    });
  }

  if (items.length === 0) {
    warnings.push('No valid panel rows found. Please check column headers (Part Name, Length, Width, Thickness, Qty).');
  }

  return {
    orderTitle,
    items,
    warnings
  };
}

/**
 * Creates and downloads the official standard LamiStock Excel template (.xlsx)
 */
export function downloadOrderTemplateExcel(): void {
  const headers = [
    'Part Name',
    'Length (Inches)',
    'Width (Inches)',
    'Thickness (Inches)',
    'Quantity',
    'Wood Type',
    'Remarks'
  ];

  const sampleRows = [
    ['Dra. Face', 27, 15.75, 1.0, 10, 'Mango Wood', 'Fluting finish'],
    ['Back Panel', 27, 15.75, 0.625, 10, 'Mango Wood', 'Fluting finish (5 sut)'],
    ['Side Panel A', 28.625, 23.25, 0.625, 10, 'Mango Wood', 'Plain finish'],
    ['Side Panel B', 27, 21.625, 0.625, 10, 'Mango Wood', 'Plain finish'],
    ['Drawer Side', 15.75, 7.0, 0.625, 60, 'Mango Wood', 'Plain'],
    ['Drawer Face', 14.375, 7.0, 0.625, 30, 'Mango Wood', 'Plain'],
    ['Drawer Back', 14.375, 6.25, 0.625, 30, 'Mango Wood', 'Plain']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set nice column widths
  worksheet['!cols'] = [
    { wch: 18 }, // Part Name
    { wch: 16 }, // Length
    { wch: 16 }, // Width
    { wch: 18 }, // Thickness
    { wch: 12 }, // Quantity
    { wch: 16 }, // Wood Type
    { wch: 25 }  // Remarks
  ];

  // Create instructions sheet
  const instructionHeaders = ['Standard Guidelines for LamiStock Excel Orders'];
  const instructionRows = [
    ['1. Measurements: Use inches. You can use decimals (e.g. 28.625) or Indian sut notation (e.g. 28-5\'\'\' where 1 sut = 1/8").'],
    ['2. Thickness: Enter thickness in inches (e.g. 0.75 for 3/4", 0.625 for 5/8", 1.0 for 1").'],
    ['3. Wood Type: Default is Mango Wood. You can specify Sheesham, Acacia, Teak, etc.'],
    ['4. Quantity: Total pieces required for your production order.'],
    ['5. Matcher will automatically cross-reference existing stock in Firestore and identify panels you DO NOT need to make.']
  ];
  const instrWorksheet = XLSX.utils.aoa_to_sheet([instructionHeaders, [], ...instructionRows]);
  instrWorksheet['!cols'] = [{ wch: 100 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Panel_Order_List');
  XLSX.utils.book_append_sheet(workbook, instrWorksheet, 'How_To_Fill');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  saveBlobAs(blob, 'LamiStock_Order_Template.xlsx');
}
