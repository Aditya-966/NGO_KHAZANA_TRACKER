const prisma = require("../config/db");
const { buildCentralWorkbook, buildBranchWorkbook } = require("../utils/excelBuilder");

async function sendWorkbook(res, workbook, filename) {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

// Branch downloads its own ledger only (branchId comes from the token).
async function exportOwnBranch(req, res, next) {
  try {
    const branch = await prisma.branch.findUnique({ where: { id: req.user.branchId } });
    const transactions = await prisma.transaction.findMany({
      where: { branchId: req.user.branchId },
      include: { student: true },
    });
    const workbook = await buildBranchWorkbook(branch, transactions);
    await sendWorkbook(res, workbook, `${branch.loginId}-ledger-${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (err) {
    next(err);
  }
}

// Central downloads everything: one sheet per branch + a summary sheet.
async function exportCentralAll(req, res, next) {
  try {
    const branches = await prisma.branch.findMany();
    const branchesWithTx = await Promise.all(
      branches.map(async (branch) => ({
        branch,
        transactions: await prisma.transaction.findMany({ where: { branchId: branch.id }, include: { student: true } }),
      }))
    );
    const workbook = await buildCentralWorkbook(branchesWithTx);
    await sendWorkbook(res, workbook, `central-ledger-${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (err) {
    next(err);
  }
}

// Central downloads one specific branch by id.
async function exportSpecificBranch(req, res, next) {
  try {
    const branch = await prisma.branch.findUnique({ where: { id: req.params.branchId } });
    if (!branch) return res.status(404).json({ error: "Branch not found." });

    const transactions = await prisma.transaction.findMany({
      where: { branchId: branch.id },
      include: { student: true },
    });
    const workbook = await buildBranchWorkbook(branch, transactions);
    await sendWorkbook(res, workbook, `${branch.loginId}-ledger-${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (err) {
    next(err);
  }
}

module.exports = { exportOwnBranch, exportCentralAll, exportSpecificBranch };
