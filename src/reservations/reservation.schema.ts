import { z } from "zod";

export const createReservationSchema = z
    .object({
        equipmentId: z.number().int().positive(),
        userId: z.number().int().positive(),
        // Dates arrive as ISO text ("2026-10-12T10:00:00Z"); coerce turns them into Date objects.
        startsAt: z.coerce.date(),
        endsAt: z.coerce.date()
    })
    .refine((data) => data.endsAt > data.startsAt, {
        message: "endsAt must be after startsAt",
        path: ["endsAt"]
    });

// Optional filters for GET /api/reservations?equipmentId=1&userId=2
export const reservationFiltersSchema = z.object({
    equipmentId: z.coerce.number().int().positive().optional(),
    userId: z.coerce.number().int().positive().optional()
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ReservationFilters = z.infer<typeof reservationFiltersSchema>;

export interface Reservation {
    id: number;
    equipmentId: number;
    userId: number;
    startsAt: Date;
    endsAt: Date;
    status: "active" | "cancelled";
    createdAt: Date;
}