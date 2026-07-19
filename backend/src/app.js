const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const branchRoutes = require("./routes/branch.routes");
const studentRoutes = require("./routes/student.routes");
const transactionRoutes = require("./routes/transaction.routes");
const ledgerRoutes = require("./routes/ledger.routes");
const exportRoutes = require("./routes/export.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/export", exportRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found." }));
app.use(errorHandler);

module.exports = app;
