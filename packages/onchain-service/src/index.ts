import express from "express";
import cors from "cors";
import { CONFIG } from "./config.js";
import healthRouter from "./routes/health.js";
import permissionsRouter from "./routes/permissions.js";
import { getDb } from "./db.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api/permissions", permissionsRouter);

// Initialize MongoDB then start server
(async () => {
  await getDb();
  app.listen(CONFIG.port, () => {
    console.log(`[Vela On-Chain Service] Running on port ${CONFIG.port}`);
    console.log(`[Vela On-Chain Service] Chain: ${CONFIG.chain.name}`);
    console.log(`[Vela On-Chain Service] USDC: ${CONFIG.usdcAddress}`);
  });
})();
