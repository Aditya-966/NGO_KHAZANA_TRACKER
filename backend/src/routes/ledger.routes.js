const express = require("express");
const { getCentralLedger } = require("../controllers/ledgerController");
const { requireAuth, requireCentral } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, requireCentral, getCentralLedger);

module.exports = router;
