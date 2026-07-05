export interface ParsedTxn {
  date: Date;
  description: string;
  counterparty?: string | null;
  amount: number; // always positive magnitude
  direction: "in" | "out";
  rawRef?: string | null;
  balanceAfter?: number | null;
}

export class ParseError extends Error {}
