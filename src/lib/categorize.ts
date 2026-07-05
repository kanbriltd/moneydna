import { type Category } from "./categories";
import { type MpesaChannel } from "./categories";

type Rule = { category: Category; keywords: RegExp };

// Ordered — first match wins. Keep income/transfer rules ahead of generic ones.
const RULES: Rule[] = [
  { category: "Salary", keywords: /\b(salary|payroll|net\s?pay)\b/i },
  { category: "Business Income", keywords: /\b(business payment|sales|customer payment|pos settlement|merchant settlement)\b/i },
  { category: "Loans", keywords: /\b(equity bank|kcb loan|loan repay|loan disburse|fuliza|overdraft|sacco loan|mshwari loan|m-?shwari loan)\b/i },
  { category: "Savings", keywords: /\b(m-?shwari deposit|savings? deposit|lock savings|goal savings|sacco deposit)\b/i },
  { category: "Investments", keywords: /\b(money market|mmf|unit trust|treasury bill|t-?bill|sacco shares|stanbic invest|cytonn|ndovu|etica)\b/i },
  { category: "Insurance", keywords: /\b(jubilee|britam|cic insurance|old mutual|madison insurance|nhif|sha\b|insurance)\b/i },
  { category: "School Fees", keywords: /\b(school fees|academy|primary school|secondary school|university|college fees)\b/i },
  { category: "Medical", keywords: /\b(hospital|clinic|pharmacy|chemist|medical|nairobi women|aga khan|mp shah)\b/i },
  { category: "Rent", keywords: /\b(rent|landlord|estate management)\b/i },
  { category: "Inventory & Stock", keywords: /\b(bidco|suppliers|wholesalers?|distributors?|stock purchase|manufacturers)\b/i },
  { category: "Staff Salaries", keywords: /\b(staff salary|wages|employee payment)\b/i },
  { category: "Utilities", keywords: /\b(kplc|kenya power|nairobi water|utility|electricity|water bill)\b/i },
  { category: "Bills", keywords: /\b(dstv|gotv|zuku|startimes|bill payment)\b/i },
  { category: "Subscriptions", keywords: /\b(netflix|spotify|showmax|apple\.com\/bill|google.*(play|storage)|amazon prime|youtube premium|gym membership)\b/i },
  { category: "Fuel", keywords: /\b(shell|total energies|totalenergies|rubis|oilibya|ola energy|petrol station|fuel)\b/i },
  { category: "Transport", keywords: /\b(uber|bolt|little cab|matatu|sgr|bus fare|taxi|transport)\b/i },
  { category: "Groceries", keywords: /\b(naivas|carrefour|quickmart|chandarana|tuskys|greenspoon|supermarket)\b/i },
  { category: "Restaurants", keywords: /\b(restaurant|kfc|java house|artcaffe|pizza|dominos|chicken inn|cafe|coffee)\b/i },
  { category: "Food & Dining", keywords: /\b(butchery|bakery|food|market)\b/i },
  { category: "Shopping", keywords: /\b(jumia|shopping|mall|clothing|fashion|electronics)\b/i },
  { category: "Entertainment", keywords: /\b(cinema|imax|movie|club|bar|entertainment)\b/i },
  { category: "Travel", keywords: /\b(airways|airlines|jambojet|booking\.com|hotel|airbnb|flight)\b/i },
  { category: "Airtime & Bundles", keywords: /\b(airtime|bundle|safaricom data|data bundle)\b/i },
  { category: "Transfers", keywords: /\b(send money|customer transfer|funds received|pochi la biashara)\b/i },
];

export function categorizeTransaction(description: string, counterparty: string | null, direction: "in" | "out"): Category {
  const text = `${description} ${counterparty ?? ""}`.trim();
  for (const rule of RULES) {
    if (rule.keywords.test(text)) return rule.category;
  }
  return direction === "in" ? "Transfers" : "Miscellaneous";
}

export function detectMpesaChannel(description: string): MpesaChannel {
  const d = description.toLowerCase();
  if (/pay ?bill/.test(d)) return "Paybill";
  if (/merchant payment|buy goods|till/.test(d)) return "Buy Goods (Till)";
  if (/pochi la biashara/.test(d)) return "Pochi la Biashara";
  if (/customer transfer|send money|funds received|business payment/.test(d)) return "Send Money";
  if (/withdraw/.test(d)) return "Withdrawal";
  if (/fuliza|overdraft/.test(d)) return "Fuliza";
  if (/m-?shwari/.test(d)) return "M-Shwari";
  if (/loan/.test(d)) return "Loan";
  if (/airtime|bundle/.test(d)) return "Airtime/Bundles";
  if (/bank transfer|rtgs|eft|swift/.test(d)) return "Bank Transfer";
  return "Other";
}
