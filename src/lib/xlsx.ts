import ExcelJS from "exceljs";
import type { ClientRow } from "./db";

const HEADERS = [
  "No",
  "Nama Klien",
  "Nama PT",
  "Alamat Email",
  "No HP",
  "Barang yang Diminati",
  "Notes",
  "Acara",
  "Waktu Input",
  "Waktu Update",
];

const SHEET_NAME_MAX = 31; // Excel limit

function safeSheetName(name: string): string {
  // Excel: max 31, tidak boleh : \ / ? * [ ]
  let s = name.replace(/[:\\/?*[\]]/g, " ").trim();
  if (s.length > SHEET_NAME_MAX) s = s.slice(0, SHEET_NAME_MAX);
  return s || "Sheet";
}

function fillSheet(
  ws: ExcelJS.Worksheet,
  title: string,
  rows: ClientRow[]
) {
  ws.mergeCells("A1:J1");
  const titleCell = ws.getCell("A1");
  titleCell.value = title;
  titleCell.font = { bold: true, size: 13 };
  titleCell.alignment = { horizontal: "center" };

  // header row di baris 3
  const headerRow = ws.getRow(3);
  HEADERS.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFC070" },
    };
    cell.alignment = { horizontal: "center" };
    cell.border = thinBorder();
  });

  rows.forEach((c, idx) => {
    const r = ws.getRow(4 + idx);
    const vals = [
      idx + 1,
      c.client_name,
      c.company_name,
      c.email,
      c.phone,
      c.product_interest,
      c.notes ?? "",
      c.event_code,
      c.created_at,
      c.updated_at,
    ];
    vals.forEach((v, i) => {
      const cell = r.getCell(i + 1);
      cell.value = v;
      cell.border = thinBorder();
    });
  });

  // lebar kolom
  const widths = [5, 26, 30, 32, 18, 36, 30, 8, 22, 22];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
  ws.views = [{ state: "frozen", ySplit: 3 }];
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const b: ExcelJS.Border = { style: "thin", color: { argb: "FFCCCCCC" } };
  return { top: b, left: b, bottom: b, right: b };
}

/**
 * Buat workbook 1 tab untuk 1 salesman (export pribadi).
 */
export async function buildSalesmanXlsx(
  salesmanName: string,
  eventName: string,
  rows: ClientRow[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Gastro Buku Tamu";
  wb.created = new Date();
  const ws = wb.addWorksheet(safeSheetName(salesmanName));
  fillSheet(ws, `Buku Tamu - ${salesmanName} (${eventName})`, rows);
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

/**
 * Buat workbook multi-tab: tiap tab = 1 salesman.
 * `groups` = daftar { salesmanName, eventName, rows } berurutan.
 */
export async function buildMultiSalesmanXlsx(
  groups: { salesmanName: string; eventName: string; rows: ClientRow[] }[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Gastro Buku Tamu";
  wb.created = new Date();

  // Tab ringkas summary di depan
  const summary = wb.addWorksheet("Ringkasan", { views: [{ state: "frozen", ySplit: 1 }] });
  summary.getRow(1).values = ["Salesman", "Acara", "Jumlah Tamu"];
  summary.getRow(1).font = { bold: true };
  summary.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFC070" },
  };
  let total = 0;
  groups.forEach((g, i) => {
    summary.getRow(2 + i).values = [g.salesmanName, g.eventName, g.rows.length];
    total += g.rows.length;
  });
  summary.getRow(2 + groups.length).values = ["TOTAL", "", total];
  summary.getRow(2 + groups.length).font = { bold: true };
  summary.getColumn(1).width = 28;
  summary.getColumn(2).width = 12;
  summary.getColumn(3).width = 14;

  // 1 tab per salesman
  const usedNames = new Set<string>(["Ringkasan"]);
  for (const g of groups) {
    let name = safeSheetName(g.salesmanName);
    // hindari duplikasi nama tab
    let n = 1;
    while (usedNames.has(name.toLowerCase())) {
      const suffix = ` ${n++}`;
      name = safeSheetName(g.salesmanName).slice(0, SHEET_NAME_MAX - suffix.length) + suffix;
    }
    usedNames.add(name.toLowerCase());
    const ws = wb.addWorksheet(name);
    fillSheet(ws, `Buku Tamu - ${g.salesmanName} (${g.eventName})`, g.rows);
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
