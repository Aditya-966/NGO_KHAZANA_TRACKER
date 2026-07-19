const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

if (!SECRET) {
  // Fail loudly at boot rather than silently signing tokens with "undefined"
  throw new Error("JWT_SECRET is not set. Add it to your .env file.");
}

/**
 * payload examples:
 *  { role: 'CENTRAL', sub: centralAdmin.id }
 *  { role: 'BRANCH', sub: branch.id, branchId: branch.id, loginId: branch.loginId }
 */
function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
