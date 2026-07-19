/* eslint-disable no-unused-vars */

// Zod validation errors -> clean 400 response
function isZodError(err) {
  return err && err.name === "ZodError";
}

// Prisma known errors -> friendlier messages for common cases
function isPrismaKnownError(err) {
  return err && err.code && typeof err.code === "string" && err.code.startsWith("P");
}

function errorHandler(err, req, res, next) {
  if (isZodError(err)) {
    return res.status(400).json({
      error: "Validation failed.",
      details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }

  if (isPrismaKnownError(err)) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A record with this unique value already exists.", meta: err.meta });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Record not found." });
    }
  }

  console.error(err);
  return res.status(err.statusCode || 500).json({ error: err.message || "Internal server error." });
}

module.exports = errorHandler;
