const prisma = require("../config/db");

// Central-only: combined transactions across every branch, optionally
// filtered by branchId and/or a specific date.
async function getCentralLedger(req, res, next) {
  try {
    const { branchId, date } = req.query;
    const where = {};
    if (branchId) where.branchId = branchId;
    if (date) where.date = new Date(date);

    const transactions = await prisma.transaction.findMany({
      where,
      include: { student: true, branch: { select: { id: true, name: true, loginId: true } } },
      orderBy: { date: "desc" },
    });

    const net = transactions.reduce((sum, t) => sum + (t.type === "CREDIT" ? Number(t.amount) : -Number(t.amount)), 0);

    return res.json({ transactions, net, count: transactions.length });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getCentralLedger };
