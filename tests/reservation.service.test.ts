import { ReservationService } from "../src/reservations/reservation.service";
import { createReservationSchema } from "../src/reservations/reservation.schema";
import {
    InMemoryEquipmentRepository,
    InMemoryReservationRepository,
    InMemoryUserRepository
} from "./fakes";

// Unit tests: the service is built by hand with fake repositories.
// No HTTP, no Express: we call the service methods directly.

function hoursFromNow(hours: number): Date {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function buildService() {
    const reservations = new InMemoryReservationRepository();
    const equipment = new InMemoryEquipmentRepository();
    const users = new InMemoryUserRepository();

    await equipment.create({ name: "Oscilloscope", category: "measurement" });
    await users.create({ fullName: "Ana López", email: "ana@lab.local", role: "student" });

    const service = new ReservationService(reservations, equipment, users);
    return { service, reservations, equipment };
}

function input(startHours = 24, endHours = 26) {
    return { equipmentId: 1, userId: 1, startsAt: hoursFromNow(startHours), endsAt: hoursFromNow(endHours) };
}

describe("createReservationSchema", () => {
    it("rejects a range where the end is before the start", () => {
        const result = createReservationSchema.safeParse({
            equipmentId: 1,
            userId: 1,
            startsAt: "2027-01-15T12:00:00Z",
            endsAt: "2027-01-15T10:00:00Z"
        });
        expect(result.success).toBe(false);
    });

    it("rejects a range where the end equals the start", () => {
        const result = createReservationSchema.safeParse({
            equipmentId: 1,
            userId: 1,
            startsAt: "2027-01-15T10:00:00Z",
            endsAt: "2027-01-15T10:00:00Z"
        });
        expect(result.success).toBe(false);
    });

    it("converts ISO text into Date objects", () => {
        const result = createReservationSchema.parse({
            equipmentId: 1,
            userId: 1,
            startsAt: "2027-01-15T10:00:00Z",
            endsAt: "2027-01-15T12:00:00Z"
        });
        expect(result.startsAt).toBeInstanceOf(Date);
    });
});

describe("ReservationService.create", () => {
    it("creates a valid reservation as active", async () => {
        const { service } = await buildService();
        const reservation = await service.create(input());
        expect(reservation.status).toBe("active");
    });

    it("rejects a reservation in the past with 422", async () => {
        const { service } = await buildService();
        await expect(service.create(input(-3, -1))).rejects.toMatchObject({ statusCode: 422 });
    });

    it("rejects equipment that is not available with 422", async () => {
        const { service, equipment } = await buildService();
        await equipment.update(1, { status: "retired" });
        await expect(service.create(input())).rejects.toMatchObject({ statusCode: 422 });
    });

    it("rejects an overlapping reservation with 409", async () => {
        const { service } = await buildService();
        await service.create(input(24, 26));
        await expect(service.create(input(25, 27))).rejects.toMatchObject({ statusCode: 409 });
    });

    it("returns 404 when the equipment does not exist", async () => {
        const { service } = await buildService();
        await expect(service.create({ ...input(), equipmentId: 99 })).rejects.toMatchObject({
            statusCode: 404
        });
    });
});

describe("ReservationService.cancel", () => {
    it("cancels an upcoming reservation", async () => {
        const { service } = await buildService();
        await service.create(input());
        const cancelled = await service.cancel(1);
        expect(cancelled.status).toBe("cancelled");
    });

    it("rejects cancelling a reservation that already started with 422", async () => {
        // The service refuses to create past reservations,
        // so we insert one straight into the fake repository.
        const { service, reservations } = await buildService();
        await reservations.create(input(-2, -1));
        await expect(service.cancel(1)).rejects.toMatchObject({ statusCode: 422 });
    });

    it("rejects cancelling twice with 409", async () => {
        const { service } = await buildService();
        await service.create(input());
        await service.cancel(1);
        await expect(service.cancel(1)).rejects.toMatchObject({ statusCode: 409 });
    });
});