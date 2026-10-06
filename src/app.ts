import express from "express";
import { EquipmentRepository } from "./equipment/equipment.repository";
import { equipmentRouter } from "./equipment/equipment.routes";
import { EquipmentService } from "./equipment/equipment.service";
import { errorHandler } from "./middleware/errorHandler";

export interface AppDependencies {
  equipmentRepo: EquipmentRepository;
}

// createApp receives its dependencies instead of creating them (dependency injection).
// server.ts passes the real Postgres repository; tests pass a fake one.
export function createApp(deps: AppDependencies) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/equipment", equipmentRouter(new EquipmentService(deps.equipmentRepo)));

  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });
  app.use(errorHandler);

  return app;
}
