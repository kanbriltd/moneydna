import * as XLSX from "xlsx";
import { ParsedTxn, ParseError } from "./types";
import { mapRowsToTransactions } from "./columnMap";

export function parseExcel(buffer: Buffer): ParsedTxn[] {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new ParseError("Workbook has no sheets.");
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (!rows.length) throw new ParseError("No rows found in spreadsheet.");
  const txns = mapRowsToTransactions(rows);
  if (!txns.length) {
    throw new ParseError("Couldn't recognize a date/amount layout in this spreadsheet.");
  }
  return txns;
}
