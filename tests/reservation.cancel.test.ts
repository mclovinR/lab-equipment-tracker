import request from "supertest";
import { ReservationService } from "../src/reservations/reservation.service";
import {
    buildApp,
    InMemoryEquipmentRepository,
    InMemoryReservationRepository,
    InMemoryUserRepository
} from "./fakes";

function hoursFromNow(hours: number): Date {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function createReservation(app: ReturnType<typeof buildApp>, startHours = 24, endHours = 26) {
    return request(app)
        .post("/api/reservations")
        .send({
            equipmentId: 1,
            userId: 1,
            startsAt: hoursFromNow(startHours).toISOString(),
            endsAt: hoursFromNow(endHours).toISOString()
        });
}

async function seed(app: ReturnType<typeof buildApp>) {
    await request(app).post("/api/equipment").send({ name: "Oscilloscope", category: "measurement" });
    await request(app).post("/api/users").send({ fullName: "Ana López", email: "ana@lab.local" });
}

describe("POST /api/reservations/:id/cancel", () => {
    it("cancels an upcoming reservation", async () => {
        const app = buildApp();
        await seed(app);
        await createReservation(app);

        const res = await request(app).post("/api/reservations/1/cancel");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("cancelled");
    });

    it("frees the time slot after cancelling", async () => {
        const app = buildApp();
        await seed(app);
        await createReservation(app);
        await request(app).post("/api/reservations/1/cancel");

        const res = await createReservation(app);
        expect(res.status).toBe(201);
    });

    it("rejects cancelling twice with 409", async () => {
        const app = buildApp();
        await seed(app);
        await createReservation(app);
        await request(app).post("/api/reservations/1/cancel");

        const res = await request(app).post("/api/reservations/1/cancel");
        expect(res.status).toBe(409);
    });

    it("returns 404 for a missing reservation", async () => {
        const res = await request(buildApp()).post("/api/reservations/99/cancel");
        expect(res.status).toBe(404);
    });
});

describe("ReservationService.cancel", () => {
    // The API refuses to create past reservations, so this test builds the service directly
    // and inserts a past reservation straight into the fake repository.
    it("rejects cancelling a reservation that already started with 422", async () => {
        const reservations = new InMemoryReservationRepository();
        const service = new ReservationService(
            reservations,
            new InMemoryEquipmentRepository(),
            new InMemoryUserRepository()
        );
        await reservations.create({
            equipmentId: 1,
            userId: 1,
            startsAt: hoursFromNow(-2),
            endsAt: hoursFromNow(-1)
        });

        await expect(service.cancel(1)).rejects.toMatchObject({ statusCode: 422 });
    });
});