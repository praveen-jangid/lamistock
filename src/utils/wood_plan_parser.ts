import * as XLSX from 'xlsx';
import type {
  WoodPlanLaminationItem,
  WoodPlanFrameItem
} from '../types/product';
import { parseDimensionToInches, saveBlobAs } from './excel_parser';

export interface ExtractedWoodPlanResult {
  productName: string;
  productCode: string;
  customerName: string;
  sourceFileName: string;
  laminationItems: WoodPlanLaminationItem[];
  frameItems: WoodPlanFrameItem[];
  warnings: string[];
}

/**
 * Normalizes text for matching headers or section names
 */
function cleanText(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function normalize(val: any): string {
  return cleanText(val).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Standardizes wood code to human readable name
 */
export function normalizeWoodType(codeOrName: string): string {
  const c = cleanText(codeOrName);
  if (!c) return 'Mango Wood';
  const lower = c.toLowerCase();
  if (lower === 'm' || lower === 'mango' || lower === 'mango wood') return 'Mango Wood';
  if (lower === 's' || lower === 'sheesham' || lower === 'sheesham wood' || lower === 'rosewood') return 'Sheesham Wood';
  if (lower === 'a' || lower === 'acacia' || lower === 'acacia wood') return 'Acacia Wood';
  if (lower === 't' || lower === 'teak' || lower === 'teak wood') return 'Teak Wood';
  return c;
}

/**
 * Parses an uploaded Excel workbook for a product's Wood Plan.
 * Supports:
 * 1. Factory section-based format (with "Lamination Size" & "Fram" sections and "Size" columns)
 * 2. Multi-tab workbooks (Sheet named "Lamination" + Sheet named "Frame")
 * 3. Tabular column format (columns: Category, Part Name, Length, Width, Thickness, Qty, Wood, Remarks)
 */
export function parseWoodPlanSpreadsheet(
  buffer: ArrayBuffer,
  fileName: string
): ExtractedWoodPlanResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error('Spreadsheet has no readable sheets.');
  }

  let productName = '';
  let productCode = '';
  let customerName = '';
  const warnings: string[] = [];

  const laminationItems: WoodPlanLaminationItem[] = [];
  const frameItems: WoodPlanFrameItem[] = [];

  // 1. Try to extract metadata from the primary sheet
  const firstSheet = workbook.Sheets[sheetNames[0]];
  const firstRows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

  // Scan top 15 rows for product name, code, party name
  for (let r = 0; r < Math.min(15, firstRows.length); r++) {
    const row = firstRows[r] || [];
    for (let c = 0; c < row.length; c++) {
      const cell = cleanText(row[c]);

      // Item Name detection: e.g. "Item Name :- Bunton Desk (BS-BUN-06)"
      if (/item\s*name/i.test(cell)) {
        let fullVal = cell.replace(/^item\s*name\s*[:\-\s]*/i, '').trim();
        if (!fullVal) {
          for (let next = c + 1; next < row.length; next++) {
            const nextVal = cleanText(row[next]);
            if (nextVal.length > 1) {
              fullVal = nextVal;
              break;
            }
          }
        }

        if (fullVal) {
          // Check for code inside parentheses e.g. "Bunton Desk (BS-BUN-06)"
          const codeMatch = fullVal.match(/\(([^)]+)\)/);
          if (codeMatch) {
            productCode = codeMatch[1].trim();
            productName = fullVal.replace(/\([^)]+\)/, '').trim();
          } else {
            productName = fullVal;
          }
        }
      }

      // Party / Customer Name detection: e.g. "Party Name :- APL"
      if (/party\s*name|customer\s*name|buyer/i.test(cell)) {
        let partyVal = cell.replace(/^(?:party|customer|buyer)\s*name\s*[:\-\s]*/i, '').trim();
        if (!partyVal) {
          for (let next = c + 1; next < row.length; next++) {
            const nextVal = cleanText(row[next]);
            if (nextVal.length > 1 && !/po\s*#|date/i.test(nextVal)) {
              partyVal = nextVal;
              break;
            }
          }
        }
        if (partyVal) {
          customerName = partyVal;
        }
      }

      // Standalone code detection if not found yet
      if (!productCode && /code\s*[:-]?\s*/i.test(cell)) {
        const remainder = cell.replace(/code\s*[:-]?\s*/i, '').trim();
        if (remainder) productCode = remainder;
      }
    }
  }

  // Fallback product name from file name if not detected in sheet
  if (!productName) {
    const base = fileName.replace(/\.[^/.]+$/, '');
    const codeMatch = base.match(/([A-Z0-9]+-[A-Z0-9]+(?:-[A-Z0-9]+)?)/i);
    if (codeMatch) {
      productCode = productCode || codeMatch[1].trim();
      productName = base.replace(codeMatch[1], '').replace(/[-_]/g, ' ').trim() || base;
    } else {
      productName = base.replace(/[-_]/g, ' ');
    }
  }

  // Check if multiple sheets are dedicated: e.g. "Lamination" sheet & "Frame" sheet
  const lamSheetName = sheetNames.find((s) => /laminat/i.test(s));
  const frameSheetName = sheetNames.find((s) => /fram/i.test(s));

  if (lamSheetName && frameSheetName && sheetNames.length > 1) {
    // Process dedicated sheets
    const lamRows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[lamSheetName], { header: 1, defval: '' });
    extractRowsFromSection(lamRows, 'LAMINATION', laminationItems, frameItems);

    const frameRows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[frameSheetName], { header: 1, defval: '' });
    extractRowsFromSection(frameRows, 'FRAME', laminationItems, frameItems);
  } else {
    // Single sheet with section headers (like factory BS-BUN-06 DESK.xlsx)
    parseSectionBasedSheet(firstRows, laminationItems, frameItems);
  }

  if (laminationItems.length === 0 && frameItems.length === 0) {
    warnings.push('No lamination or frame sizes could be extracted. Please check the sheet layout.');
  }

  return {
    productName: productName || 'Untitled Product',
    productCode: productCode || 'PRD-01',
    customerName: customerName || 'Standard Factory Customer',
    sourceFileName: fileName,
    laminationItems,
    frameItems,
    warnings
  };
}

/**
 * Parses factory single sheet with distinct sections: "Lamination Size", "MDF/Veneer", "Fram", etc.
 */
function parseSectionBasedSheet(
  rows: any[][],
  laminationItems: WoodPlanLaminationItem[],
  frameItems: WoodPlanFrameItem[]
) {
  let currentSection: 'NONE' | 'LAMINATION' | 'FRAME' | 'OTHER' = 'NONE';

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    if (!row || row.every((c) => cleanText(c) === '')) continue;

    const firstCol = cleanText(row[0]);
    const secondCol = cleanText(row[1]);
    const thirdCol = cleanText(row[2]);

    // Check for Section Headers
    const fullRowText = row.map(cleanText).join(' ').toLowerCase();

    if (
      /lamination\s*size|lamination\s*order|laminate\s*panels/i.test(fullRowText) &&
      !isDataRow(row)
    ) {
      currentSection = 'LAMINATION';
      continue;
    }

    if (
      /(?:^|\s)(?:fram|frame|framing|framing\s*size|solid\s*wood\s*frame)(?:\s|$|:)/i.test(
        fullRowText
      ) &&
      !isDataRow(row)
    ) {
      currentSection = 'FRAME';
      continue;
    }

    if (/(?:mdf|veneer|cft|last\s*updated)/i.test(firstCol) && !isDataRow(row)) {
      currentSection = 'OTHER';
      continue;
    }

    // Skip column headers e.g. "Wood", "Remarks", "Particulars", "Size", "Qty"
    if (
      /particular|remarks|wood|species/i.test(normalize(firstCol) + normalize(secondCol) + normalize(thirdCol)) &&
      row.some((c) => /size|qty|cft/i.test(cleanText(c)))
    ) {
      continue;
    }

    // Skip "Required Size =>" sub-rows (rough allowances)
    if (/required\s*size/i.test(thirdCol) || /required\s*size/i.test(secondCol) || /required\s*size/i.test(firstCol)) {
      continue;
    }

    // If we are in Lamination or Frame section, try parsing the item row
    if (currentSection === 'LAMINATION' || currentSection === 'FRAME') {
      const parsed = parseFactoryItemRow(row);
      if (parsed) {
        if (currentSection === 'LAMINATION') {
          laminationItems.push({
            id: `lam-${laminationItems.length + 1}-${Date.now().toString(36)}`,
            partName: parsed.partName,
            qtyPerUnit: parsed.qtyPerUnit,
            length: parsed.length,
            width: parsed.width,
            thickness: parsed.thickness,
            rawSize: parsed.rawSize,
            woodType: parsed.woodType,
            remarks: parsed.remarks
          });
        } else {
          frameItems.push({
            id: `frm-${frameItems.length + 1}-${Date.now().toString(36)}`,
            partName: parsed.partName,
            qtyPerUnit: parsed.qtyPerUnit,
            length: parsed.length,
            width: parsed.width,
            thickness: parsed.thickness,
            rawSize: parsed.rawSize,
            woodType: parsed.woodType,
            remarks: parsed.remarks
          });
        }
      }
    }
  }
}

/**
 * Checks if a row looks like a data row with dimension numbers rather than a header banner
 */
function isDataRow(row: any[]): boolean {
  // Looks for numbers or inch notations in cells
  return row.some((c) => {
    const s = cleanText(c);
    return /^\d+(?:\.\d+)?["']?/.test(s) || /^\d+-\d+['"]/.test(s);
  });
}

/**
 * Parses factory row layout:
 * Col 0: Wood (e.g. "M")
 * Col 1: Remarks (e.g. "Fluting")
 * Col 2: Particulars / Part Name (e.g. "Dra. Face :-")
 * Col 3: Qty per unit (e.g. 1)
 * Col 4: Length (e.g. 27")
 * Col 5: "X"
 * Col 6: Width (e.g. 15"-6''')
 * Col 7: "X"
 * Col 8: Thickness (e.g. 1" or 5''')
 * Col 9: Total Qty (e.g. 10)
 */
function parseFactoryItemRow(row: any[]): {
  partName: string;
  qtyPerUnit: number;
  length: number;
  width: number;
  thickness: number;
  rawSize: string;
  woodType: string;
  remarks: string;
} | null {
  const rawWood = cleanText(row[0]);
  const rawRemarks = cleanText(row[1]);
  let rawPart = cleanText(row[2]).replace(/[:-]/g, '').trim();

  // If Col 2 was empty, maybe Col 0 or 1 had the part name (tabular format)
  if (!rawPart) {
    rawPart = cleanText(row[1]) || cleanText(row[0]);
  }

  if (!rawPart || /required\s*size|total|cft/i.test(rawPart)) {
    return null;
  }

  let qtyPerUnit = 1;
  if (row[3] !== undefined && row[3] !== null && String(row[3]).trim() !== '') {
    const parsedQty = parseInt(String(row[3]), 10);
    if (!isNaN(parsedQty) && parsedQty > 0) {
      qtyPerUnit = parsedQty;
    }
  }

  // Dimensions: Find Length, Width, Thickness
  let rawLen = '';
  let rawWid = '';
  let rawThk = '';

  // Case A: Factory layout with "X" separator cols: Col 4, Col 6, Col 8
  if (
    cleanText(row[5]).toLowerCase() === 'x' &&
    cleanText(row[7]).toLowerCase() === 'x'
  ) {
    rawLen = cleanText(row[4]);
    rawWid = cleanText(row[6]);
    rawThk = cleanText(row[8]);
  } else {
    // Case B: Search for dimension numbers in row cells
    const dimCandidates: { val: string; parsed: number }[] = [];
    for (let c = 3; c < row.length; c++) {
      const cellVal = cleanText(row[c]);
      if (!cellVal || cellVal.toLowerCase() === 'x') continue;
      const parsed = parseDimensionToInches(cellVal);
      if (parsed > 0) {
        dimCandidates.push({ val: cellVal, parsed });
      }
    }

    if (dimCandidates.length >= 2) {
      rawLen = dimCandidates[0].val;
      rawWid = dimCandidates[1].val;
      rawThk = dimCandidates.length >= 3 ? dimCandidates[2].val : '0.75';
    }
  }

  const length = parseDimensionToInches(rawLen);
  const width = parseDimensionToInches(rawWid);
  const thickness = parseDimensionToInches(rawThk) || 0.75;

  if (length <= 0 || width <= 0) {
    return null;
  }

  const woodType = normalizeWoodType(rawWood);
  const rawSize = `${rawLen || length} × ${rawWid || width} × ${rawThk || thickness}`;

  return {
    partName: rawPart,
    qtyPerUnit,
    length: Math.max(length, width), // Standardize Length >= Width
    width: Math.min(length, width),
    thickness,
    rawSize,
    woodType,
    remarks: rawRemarks
  };
}

/**
 * Extracts rows from a dedicated section / table
 */
function extractRowsFromSection(
  rows: any[][],
  category: 'LAMINATION' | 'FRAME',
  laminationItems: WoodPlanLaminationItem[],
  frameItems: WoodPlanFrameItem[]
) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => cleanText(c) === '')) continue;
    if (/required\s*size/i.test(row.map(cleanText).join(' '))) continue;

    const parsed = parseFactoryItemRow(row);
    if (!parsed) continue;

    if (category === 'LAMINATION') {
      laminationItems.push({
        id: `lam-${laminationItems.length + 1}-${Date.now().toString(36)}`,
        partName: parsed.partName,
        qtyPerUnit: parsed.qtyPerUnit,
        length: parsed.length,
        width: parsed.width,
        thickness: parsed.thickness,
        rawSize: parsed.rawSize,
        woodType: parsed.woodType,
        remarks: parsed.remarks
      });
    } else {
      frameItems.push({
        id: `frm-${frameItems.length + 1}-${Date.now().toString(36)}`,
        partName: parsed.partName,
        qtyPerUnit: parsed.qtyPerUnit,
        length: parsed.length,
        width: parsed.width,
        thickness: parsed.thickness,
        rawSize: parsed.rawSize,
        woodType: parsed.woodType,
        remarks: parsed.remarks
      });
    }
  }
}

/**
 * Generates and downloads the official standard LamiStock Wood Plan Excel template
 */
export function downloadWoodPlanTemplateExcel(): void {
  const infoSheetData = [
    ['Standard Guidelines for LamiStock Product Wood Plans'],
    [''],
    ['1. File Structure:'],
    ['   - You can upload a single sheet with "Lamination Size" and "Fram" sections (factory style)'],
    ['   - Or use the two tabs: "Lamination_Sizes" and "Frame_Sizes" provided in this template.'],
    ['2. Measurements:'],
    ['   - Use inches. Decimal (e.g. 28.625) or Indian sut notation (e.g. 28-5\'\'\' where 1 sut = 1/8").'],
    ['3. Qty per Unit: The quantity required to produce 1 single finished product.'],
    ['4. Wood Type: Mango Wood (or "M"), Sheesham ("S"), Acacia ("A"), Teak ("T").'],
    ['5. Once saved to a product in LamiStock, this Wood Plan is permanently stored and will never need to be re-uploaded!']
  ];
  const infoWs = XLSX.utils.aoa_to_sheet(infoSheetData);
  infoWs['!cols'] = [{ wch: 100 }];

  // Lamination sheet
  const lamHeaders = ['Part Name', 'Qty Per Unit', 'Length (Inches)', 'Width (Inches)', 'Thickness (Inches)', 'Wood Type', 'Remarks'];
  const lamRows = [
    ['Dra. Face', 1, 27, '15-6\'\'\'', 1.0, 'Mango Wood', 'Fluting finish'],
    ['Back Panel', 1, 27, '15-6\'\'\'', '5\'\'\'', 'Mango Wood', 'Fluting (5 soot)'],
    ['Side Panel A', 1, '28-5\'\'\'', '23-2\'\'\'', '5\'\'\'', 'Mango Wood', 'Plain edge'],
    ['Side Panel B', 1, 27, '21-5\'\'\'', '5\'\'\'', 'Mango Wood', 'Plain edge'],
    ['Drawer Side', 6, '15-6\'\'\'', 7.0, '5\'\'\'', 'Mango Wood', 'Plain'],
    ['Drawer Face', 3, '14-3\'\'\'', 7.0, '5\'\'\'', 'Mango Wood', 'Plain'],
    ['Drawer Back', 3, '14-3\'\'\'', '6-2\'\'\'', '5\'\'\'', 'Mango Wood', 'Plain']
  ];
  const lamWs = XLSX.utils.aoa_to_sheet([lamHeaders, ...lamRows]);
  lamWs['!cols'] = [
    { wch: 20 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 25 }
  ];

  // Frame sheet
  const frameHeaders = ['Part Name', 'Qty Per Unit', 'Length (Inches)', 'Width (Inches)', 'Thickness (Inches)', 'Wood Type', 'Remarks'];
  const frameRows = [
    ['Side Fram', 18, '28-4\'\'\'', 3.0, '6\'\'\'', 'Mango Wood', 'Fluting'],
    ['Side Fram', 2, '28-4\'\'\'', '5\'\'\'', '6\'\'\'', 'Mango Wood', 'Fluting'],
    ['Side Fram (CNC)', 6, 22.0, '3-4\'\'\'', '6\'\'\'', 'Mango Wood', 'CNC routing'],
    ['F. Frame', 2, '27-2\'\'\'', '3-5\'\'\'', 1.0, 'Mango Wood', 'Fluting'],
    ['Dra. Side', 2, '16-4\'\'\'', '2-4\'\'\'', '5\'\'\'', 'Mango Wood', 'Plain'],
    ['Dra Face', 1, 24.0, '2-4\'\'\'', '5\'\'\'', 'Mango Wood', 'Plain'],
    ['Dra Back', 1, '23-2\'\'\'', '1-7\'\'\'', '5\'\'\'', 'Mango Wood', 'Plain'],
    ['Channel', 2, 16.0, '1-2\'\'\'', '6\'\'\'', 'Mango Wood', 'Plain'],
    ['Frame', 2, '22-4\'\'\'', '3-5\'\'\'', 1.0, 'Mango Wood', 'Plain'],
    ['Sketing', 2, 18.0, '2-5\'\'\'', 1.0, 'Mango Wood', 'Plain'],
    ['Sketing', 1, '19-4\'\'\'', '1-5\'\'\'', 1.0, 'Mango Wood', 'Plain'],
    ['Sketing (CNC)', 1, '20-5\'\'\'', '3-4\'\'\'', '1-5\'\'\'', 'Mango Wood', 'CNC'],
    ['Top Frame', 2, '15-1\'\'\'', '1-4\'\'\'', 1.0, 'Mango Wood', 'Plain'],
    ['Top Frame', 2, '20-5\'\'\'', '1-4\'\'\'', 1.0, 'Mango Wood', 'Plain']
  ];
  const frameWs = XLSX.utils.aoa_to_sheet([frameHeaders, ...frameRows]);
  frameWs['!cols'] = [
    { wch: 20 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 25 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, infoWs, 'How_To_Use');
  XLSX.utils.book_append_sheet(wb, lamWs, 'Lamination_Sizes');
  XLSX.utils.book_append_sheet(wb, frameWs, 'Frame_Sizes');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  saveBlobAs(blob, 'LamiStock_Product_Wood_Plan_Template.xlsx');
}
