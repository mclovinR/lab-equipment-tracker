import { createApp } from "./app";
import { env } from "./config/env";
import { pool } from "./db/pool";
import { PgEquipmentRepository } from "./equipment/equipment.repository";

const app = createApp({
  equipmentRepo: new PgEquipmentRepository(pool)
});

app.listen(env.port, () => {
  console.log(`Lab Equipment Tracker API listening on port ${env.port}`);
});
