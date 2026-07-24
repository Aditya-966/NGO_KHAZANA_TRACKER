const ExcelJS = require("exceljs");

const COLUMNS = [
  { header: "Date", key: "date", width: 14 },
  { header: "Acc No", key: "accNo", width: 16 },
  { header: "Student Name", key: "studentName", width: 24 },
  { header: "Father's Name", key: "fatherName", width: 24 },
  { header: "DOB", key: "dob", width: 14 },
  { header: "Poll No", key: "pollNo", width: 12 },
  { header: "Type", key: "type", width: 10 },
  { header: "Amount (₹)", key: "amount", width: 14 },
  { header: "Balance After (₹)", key: "balanceAfter", width: 18 },
];

function styleHeader(sheet) {
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E2A4A" } };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

/**
 * transactions: array of { date, type, amount, student: { accNo, name, fatherName, dob, pollNo } }
 * Adds rows sorted oldest -> newest, plus a NET TOTAL row at the bottom.
 */
function addLedgerSheet(workbook, sheetName, transactions) {
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31)); // Excel sheet name limit
  sheet.columns = COLUMNS;
  styleHeader(sheet);

  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

  let net = 0;
  for (const t of sorted) {
    const signedAmount = t.type === "CREDIT" ? Number(t.amount) : -Number(t.amount);
    net += signedAmount;
    sheet.addRow({
      date: new Date(t.date).toISOString().slice(0, 10),
      accNo: t.student.accNo,
      studentName: t.student.name,
      fatherName: t.student.fatherName,
      dob: new Date(t.student.dob).toISOString().slice(0, 10),
      pollNo: t.student.pollNo,
      type: t.type === "CREDIT" ? "Credit" : "Debit",
      amount: signedAmount,
      balanceAfter: Number(t.balanceAfter),
    });
  }

  const totalRow = sheet.addRow({ type: "NET TOTAL", amount: net });
  totalRow.font = { bold: true };
  sheet.getColumn("amount").numFmt = "#,##0.00";

  return { sheet, net };
}

/**
 * Builds a workbook with one sheet per branch plus a Summary sheet.
 * branchesWithTx: [{ branch: { id, name }, transactions: [...] }]
 */
async function buildCentralWorkbook(branchesWithTx) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NGO Ledger System";
  workbook.created = new Date();

  const summaryRows = [];
  for (const { branch, transactions } of branchesWithTx) {
    const { net } = addLedgerSheet(workbook, branch.name, transactions);
    summaryRows.push({
      branch: branch.name,
      branchId: branch.loginId,
      students: new Set(transactions.map((t) => t.student.accNo)).size,
      entries: transactions.length,
      net,
    });
  }

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Branch", key: "branch", width: 26 },
    { header: "Branch ID", key: "branchId", width: 16 },
    { header: "Students (with entries)", key: "students", width: 20 },
    { header: "Entries", key: "entries", width: 10 },
    { header: "Net Amount (₹)", key: "net", width: 16 },
  ];
  styleHeader(summarySheet);
  summaryRows.forEach((r) => summarySheet.addRow(r));
  const grandNet = summaryRows.reduce((s, r) => s + r.net, 0);
  const grandRow = summarySheet.addRow({ branch: "GRAND TOTAL", net: grandNet });
  grandRow.font = { bold: true };
  summarySheet.getColumn("net").numFmt = "#,##0.00";

  return workbook;
}

/**
 * Single-branch workbook (used both by a branch downloading its own data,
 * and by central downloading one specific branch's data).
 */
async function buildBranchWorkbook(branch, transactions) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NGO Ledger System";
  workbook.created = new Date();
  addLedgerSheet(workbook, branch.name, transactions);
  return workbook;
}

module.exports = { buildCentralWorkbook, buildBranchWorkbook };
