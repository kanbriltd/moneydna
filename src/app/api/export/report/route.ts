import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { buildReportWorkbook } from "@/lib/reportExport";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return new Response("Not signed in.", { status: 401 });

  const transactions = await prisma.transaction.findMany({ where: { userId }, orderBy: { date: "asc" } });
  if (transactions.length === 0) {
    return new Response("No transactions to export yet — upload a statement first.", { status: 404 });
  }

  const wb = buildReportWorkbook(transactions);
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="MoneyDNA_Report_${stamp}.xlsx"`,
    },
  });
}
