const { verifyToken } = require("../utils/jwt");

/**
 * Reads the Bearer token, verifies it, and attaches the decoded payload
 * to req.user. Rejects the request entirely if the token is missing/invalid.
 * This is the single gate every protected route goes through.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { role, sub, branchId?, loginId }
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

/**
 * Only lets CENTRAL-role tokens through. This is what enforces "only central
 * can see/download everything" at the server, not just in the UI.
 */
function requireCentral(req, res, next) {
  if (!req.user || req.user.role !== "CENTRAL") {
    return res.status(403).json({ error: "Central office access required." });
  }
  return next();
}

/**
 * Only lets BRANCH-role tokens through, and every downstream query in the
 * branch controllers filters strictly by req.user.branchId — a branch token
 * has no way to address another branch's data because the branchId doesn't
 * come from the request body/params, it comes from the signed token.
 */
function requireBranch(req, res, next) {
  if (!req.user || req.user.role !== "BRANCH" || !req.user.branchId) {
    return res.status(403).json({ error: "Branch access required." });
  }
  return next();
}

module.exports = { requireAuth, requireCentral, requireBranch };
