const express = require("express");
const { addStudent, listStudents, searchStudent } = require("../controllers/studentController");
const { requireAuth, requireBranch } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireBranch);

router.post("/", addStudent);
router.get("/", listStudents);
router.get("/search", searchStudent);

module.exports = router;
