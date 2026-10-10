import { Router } from "express";
import { z } from "zod";
import { ReservationService } from "./reservation.service";
import { createReservationSchema, reservationFiltersSchema } from "./reservation.schema";

const idParam = z.coerce.number().int().positive();

// Routes/controller: translate HTTP <-> service calls. Express 5 forwards async errors automatically.
export function reservationRouter(service: ReservationService): Router {
    const router = Router();

    router.get("/", async (_req, res) => {
        const filters = reservationFiltersSchema.parse(_req.query);
        res.json(await service.list(filters));
    });

    router.get("/:id", async (req, res) => {
        const id = idParam.parse(req.params.id);
        res.json(await service.getById(id));
    });

    router.post("/", async (req, res) => {
        const data = createReservationSchema.parse(req.body);
        res.status(201).json(await service.create(data));
    });

    // Cancelling is an action on a reservation, so it gets its own sub-route.
    router.post("/:id/cancel", async (req, res) => {
        const id = idParam.parse(req.params.id);
        res.json(await service.cancel(id));
    });
    return router;
}
