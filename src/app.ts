import express from "express";
import { EquipmentRepository } from "./equipment/equipment.repository";
import { equipmentRouter } from "./equipment/equipment.routes";
import { EquipmentService } from "./equipment/equipment.service";
import { UserRepository } from "./users/user.repository";
import { userRouter } from "./users/user.routes";
import { UserService } from "./users/user.service";
import { errorHandler } from "./middleware/errorHandler";
import { ReservationRepository } from "./reservations/reservation.repository";
import { reservationRouter } from "./reservations/reservation.routes";
import { ReservationService } from "./reservations/reservation.service";

export interface AppDependencies {
  equipmentRepo: EquipmentRepository;
  userRepo: UserRepository;
  reservationRepo: ReservationRepository;   
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
  app.use("/api/users", userRouter(new UserService(deps.userRepo)));
  app.use("/api/reservations", reservationRouter(new ReservationService(deps.reservationRepo, deps.equipmentRepo, deps.userRepo))); 
  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });
  app.use(errorHandler);

  return app;
}


