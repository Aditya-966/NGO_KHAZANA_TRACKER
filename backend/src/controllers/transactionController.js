const bcrypt = require("bcryptjs");
const { z } = require("zod");
const prisma = require("../config/db");

const txSchema = z.object({
  accNo: z.string().min(1),
  type: z.enum(["CREDIT", "DEBIT"]),
  amount: z.number().positive(),
  date: z.string().min(1), // ISO date string
  password: z.string().min(1), // re-entered by the branch manager for this specific entry
});

// The password is checked again here, server-side, on every single call -
// this is the real enforcement of "enter password before every credit/debit",
// not just a modal in the UI that could be bypassed by calling the API directly.
async function addTransaction(req, res, next) {
  try {
    const data = txSchema.parse(req.body);

    const branch = await prisma.branch.findUnique({ where: { id: req.user.branchId } });
    const passwordOk = await bcrypt.compare(data.password, branch.passwordHash);
    if (!passwordOk) return res.status(401).json({ error: "Incorrect branch password. Entry not saved." });

    const student = await prisma.student.findUnique({
      where: { branchId_accNo: { branchId: req.user.branchId, accNo: data.accNo } },
    });
    if (!student) return res.status(404).json({ error: "No student found with this account number in your branch." });

    const transaction = await prisma.transaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        date: new Date(data.date),
        studentId: student.id,
        branchId: req.user.branchId,
      },
      include: { student: true },
    });

    return res.status(201).json(transaction);
  } catch (err) {
    return next(err);
  }
}

async function listTransactions(req, res, next) {
  try {
    const { date } = req.query;
    const where = { branchId: req.user.branchId };
    if (date) where.date = new Date(date);

    const transactions = await prisma.transaction.findMany({
      where,
      include: { student: true },
      orderBy: { date: "desc" },
    });

    const net = transactions.reduce((sum, t) => sum + (t.type === "CREDIT" ? Number(t.amount) : -Number(t.amount)), 0);

    return res.json({ transactions, net, count: transactions.length });
  } catch (err) {
    return next(err);
  }
}

module.exports = { addTransaction, listTransactions };
