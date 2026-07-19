const { z } = require("zod");
const prisma = require("../config/db");

const studentSchema = z.object({
  name: z.string().min(1),
  dob: z.string().min(1), // ISO date string, e.g. "2014-06-01"
  fatherName: z.string().min(1),
  accNo: z.string().min(1),
  pollNo: z.string().min(1),
});

// Note: branchId always comes from req.user (the signed token), never from
// the request body — a branch account can only ever create students in its
// own branch, no matter what it sends.
async function addStudent(req, res, next) {
  try {
    const data = studentSchema.parse(req.body);
    const student = await prisma.student.create({
      data: {
        name: data.name,
        dob: new Date(data.dob),
        fatherName: data.fatherName,
        accNo: data.accNo,
        pollNo: data.pollNo,
        branchId: req.user.branchId,
      },
    });
    return res.status(201).json(student);
  } catch (err) {
    return next(err);
  }
}

async function listStudents(req, res, next) {
  try {
    const students = await prisma.student.findMany({
      where: { branchId: req.user.branchId },
      orderBy: { createdAt: "desc" },
    });
    return res.json(students);
  } catch (err) {
    return next(err);
  }
}

// Accepts either an account number or a poll number in `q` and matches
// whichever one hits — lets branch staff search by whatever identifier
// they have on hand.
async function searchStudent(req, res, next) {
  try {
    const q = (req.query.q || req.query.accNo || "").trim();
    if (!q) return res.status(400).json({ error: "A search query is required." });

    const student = await prisma.student.findFirst({
      where: {
        branchId: req.user.branchId,
        OR: [{ accNo: q }, { pollNo: q }],
      },
    });
    if (!student) return res.status(404).json({ error: "No student found with this account number or poll number." });

    return res.json(student);
  } catch (err) {
    return next(err);
  }
}

module.exports = { addStudent, listStudents, searchStudent };
