import { Router } from "express";
import { z } from "zod";
import { createEquipmentSchema, updateEquipmentSchema } from "./equipment.schema";
import { EquipmentService } from "./equipment.service";

const idParam = z.coerce.number().int().positive();

// Routes/controller: translate HTTP <-> service calls. Express 5 forwards async errors automatically.
export function equipmentRouter(service: EquipmentService): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json(await service.list());
  });

  router.get("/:id", async (req, res) => {
    const id = idParam.parse(req.params.id);
    res.json(await service.getById(id));
  });

  router.post("/", async (req, res) => {
    const data = createEquipmentSchema.parse(req.body);
    res.status(201).json(await service.create(data));
  });

    router.patch("/:id", async (req, res) => {
    const id = idParam.parse(req.params.id);
    const data = updateEquipmentSchema.parse(req.body);
    res.json(await service.update(id, data));
  });

  return router;
}
