import cors from "cors";
import dotenv from "dotenv";
import express, { type ErrorRequestHandler } from "express";
import { createCaseRoutes } from "./routes/caseRoutes";
import { healthRoutes } from "./routes/healthRoutes";
import { createInterrogationRoutes } from "./routes/interrogationRoutes";
import { CaseService, HttpError } from "./services/CaseService";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);
const caseService = new CaseService();

app.use(cors());
app.use(express.json());
app.use("/api", healthRoutes);
app.use("/api", createCaseRoutes(caseService));
app.use("/api", createInterrogationRoutes(caseService));

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "服务器内部错误。" });
};

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Blackbox Detective server listening on http://localhost:${port}`);
});
