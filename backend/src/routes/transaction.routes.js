const express = require("express");
const { addTransaction, listTransactions } = require("../controllers/transactionController");
const { requireAuth, requireBranch } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireBranch);

router.post("/", addTransaction);
router.get("/", listTransactions);

module.exports = router;
