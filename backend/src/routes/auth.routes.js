const express = require("express");
const rateLimit = require("express-rate-limit");
const { centralLogin, branchLogin, verifyBranchPassword, changeCentralPassword } = require("../controllers/authController");
const { requireAuth, requireBranch, requireCentral } = require("../middleware/auth");

const router = express.Router();

// Slow down brute-force attempts against login endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts. Try again later." },
});

router.post("/central/login", loginLimiter, centralLogin);
router.post("/central/change-password", requireAuth, requireCentral, changeCentralPassword);
router.post("/branch/login", loginLimiter, branchLogin);
router.post("/branch/verify-password", requireAuth, requireBranch, verifyBranchPassword);

module.exports = router;
