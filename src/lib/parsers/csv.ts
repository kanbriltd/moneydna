import Papa from "papaparse";
import { ParsedTxn, ParseError } from "./types";
import { mapRowsToTransactions } from "./columnMap";

export function parseCsv(buffer: Buffer): ParsedTxn[] {
  const text = buffer.toString("utf-8");
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  });
  if (!result.data.length) {
    throw new ParseError("No rows found in CSV file.");
  }
  const txns = mapRowsToTransactions(result.data);
  if (!txns.length) {
    throw new ParseError("Couldn't recognize a date/amount layout in this CSV.");
  }
  return txns;
}
