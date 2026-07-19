const express = require("express");
const { createBranch, listBranches, deleteBranch } = require("../controllers/branchController");
const { requireAuth, requireCentral } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireCentral);

router.post("/", createBranch);
router.get("/", listBranches);
router.delete("/:id", deleteBranch);

module.exports = router;
