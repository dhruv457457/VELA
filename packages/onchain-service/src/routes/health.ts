import { Router } from "express";
import { getAgentSmartAccount } from "../config.js";

const router = Router();

router.get("/health", async (_req, res) => {
  try {
    const smartAccount = await getAgentSmartAccount();
    res.json({
      status: "ok",
      service: "vela-onchain-service",
      timestamp: new Date().toISOString(),
      agentSmartAccount: smartAccount.address,
    });
  } catch {
    res.json({
      status: "ok",
      service: "vela-onchain-service",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
