import { createApp } from "./app";
import { env } from "./config/env";
import { pool } from "./db/pool";
import { PgEquipmentRepository } from "./equipment/equipment.repository";
import { PgUserRepository } from "./users/user.repository";

const app = createApp({
  equipmentRepo: new PgEquipmentRepository(pool),
  userRepo: new PgUserRepository(pool)
});

app.listen(env.port, () => {
  console.log(`Lab Equipment Tracker API listening on port ${env.port}`);
});
