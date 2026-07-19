const express = require("express");
const { exportOwnBranch, exportCentralAll, exportSpecificBranch } = require("../controllers/exportController");
const { requireAuth, requireCentral, requireBranch } = require("../middleware/auth");

const router = express.Router();

// Branch downloads its own ledger
router.get("/mine", requireAuth, requireBranch, exportOwnBranch);

// Central downloads everything, or one branch by id
router.get("/central", requireAuth, requireCentral, exportCentralAll);
router.get("/branch/:branchId", requireAuth, requireCentral, exportSpecificBranch);

module.exports = router;
