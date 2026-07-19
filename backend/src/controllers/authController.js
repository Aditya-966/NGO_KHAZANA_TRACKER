const bcrypt = require("bcryptjs");
const { z } = require("zod");
const prisma = require("../config/db");
const { signToken } = require("../utils/jwt");

const loginSchema = z.object({
  loginId: z.string().min(1),
  password: z.string().min(1),
});

async function centralLogin(req, res, next) {
  try {
    const { loginId, password } = loginSchema.parse(req.body);

    const admin = await prisma.centralAdmin.findUnique({ where: { loginId } });
    if (!admin) return res.status(401).json({ error: "Invalid credentials." });

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials." });

    const token = signToken({ role: "CENTRAL", sub: admin.id, loginId: admin.loginId });
    return res.json({ token, role: "CENTRAL", loginId: admin.loginId });
  } catch (err) {
    return next(err);
  }
}

async function branchLogin(req, res, next) {
  try {
    const { loginId, password } = loginSchema.parse(req.body);

    const branch = await prisma.branch.findUnique({ where: { loginId } });
    if (!branch) return res.status(401).json({ error: "Invalid credentials." });

    const ok = await bcrypt.compare(password, branch.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials." });

    const token = signToken({ role: "BRANCH", sub: branch.id, branchId: branch.id, loginId: branch.loginId });
    return res.json({ token, role: "BRANCH", branch: { id: branch.id, name: branch.name, loginId: branch.loginId } });
  } catch (err) {
    return next(err);
  }
}

// Re-checks the logged-in branch's password before a credit/debit is committed.
// This is the server-side equivalent of the "re-enter password every transaction" requirement -
// the frontend modal is just UX, this endpoint is what actually enforces it.
const verifySchema = z.object({ password: z.string().min(1) });

async function verifyBranchPassword(req, res, next) {
  try {
    const { password } = verifySchema.parse(req.body);
    const branch = await prisma.branch.findUnique({ where: { id: req.user.branchId } });
    if (!branch) return res.status(404).json({ error: "Branch not found." });

    const ok = await bcrypt.compare(password, branch.passwordHash);
    if (!ok) return res.status(401).json({ error: "Incorrect branch password." });

    return res.json({ verified: true });
  } catch (err) {
    return next(err);
  }
}

// Central changes its own password (must know the current one).
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
});

async function changeCentralPassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
 
    const admin = await prisma.centralAdmin.findUnique({ where: { id: req.user.sub } });
    if (!admin) return res.status(404).json({ error: "Central account not found." });

    const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect." });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.centralAdmin.update({ where: { id: admin.id }, data: { passwordHash } });

    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = { centralLogin, branchLogin, verifyBranchPassword, changeCentralPassword };
