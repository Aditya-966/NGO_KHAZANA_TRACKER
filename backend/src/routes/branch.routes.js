const express = require("express");
const { createBranch, listBranches, deleteBranch, resetBranchPassword } = require("../controllers/branchController");
const { requireAuth, requireCentral } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireCentral);

router.post("/", createBranch);
router.get("/", listBranches);
router.delete("/:id", deleteBranch);
router.patch("/:id/password", resetBranchPassword);

module.exports = router;
