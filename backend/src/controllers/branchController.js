const bcrypt = require("bcryptjs");
const { z } = require("zod");
const prisma = require("../config/db");

const createBranchSchema = z.object({
  name: z.string().min(1),
  loginId: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

async function createBranch(req, res, next) {
  try {
    const { name, loginId, password } = createBranchSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 12);

    const branch = await prisma.branch.create({
      data: { name, loginId, passwordHash },
      select: { id: true, name: true, loginId: true, createdAt: true },
    });

    return res.status(201).json(branch);
  } catch (err) {
    return next(err);
  }
}

async function listBranches(req, res, next) {
  try {
    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        loginId: true,
        createdAt: true,
        _count: { select: { students: true, transactions: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return res.json(branches);
  } catch (err) {
    return next(err);
  }
}

async function deleteBranch(req, res, next) {
  try {
    await prisma.branch.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
});

async function resetBranchPassword(req, res, next) {
  try {
    const { newPassword } = resetPasswordSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const branch = await prisma.branch.update({
      where: { id: req.params.id },
      data: { passwordHash },
      select: { id: true, name: true, loginId: true },
    });

    return res.json({ success: true, branch });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createBranch, listBranches, deleteBranch, resetBranchPassword };
