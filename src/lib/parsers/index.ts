import { ParsedTxn, ParseError } from "./types";
import { parseCsv } from "./csv";
import { parseExcel } from "./excel";
import { parseMpesaPdf } from "./mpesaPdf";
import { parseGenericBankPdf } from "./genericPdf";

export type { ParsedTxn };
export { ParseError };

export type SourceType = "mpesa" | "bank" | "sacco" | "csv" | "excel" | "demo";

export async function parseStatement(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ txns: ParsedTxn[]; sourceType: SourceType }> {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".csv") || mimeType === "text/csv") {
    return { txns: parseCsv(buffer), sourceType: "csv" };
  }
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx") || mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return { txns: parseExcel(buffer), sourceType: "excel" };
  }
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") {
    try {
      const txns = await parseMpesaPdf(buffer);
      return { txns, sourceType: "mpesa" };
    } catch {
      const txns = await parseGenericBankPdf(buffer);
      return { txns, sourceType: "bank" };
    }
  }
  throw new ParseError("Unsupported file type. Upload a PDF, CSV, or Excel statement.");
}
