import express from "express";
import cors from "cors";
import balanceRoutes from "./routes/balance";
import incomeRoutes from "./routes/income";
import expensesRoutes from "./routes/expenses";
import projectionsRoutes from "./routes/projections";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/balance", balanceRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/projections", projectionsRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
