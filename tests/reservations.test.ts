import request from "supertest";
import { buildApp } from "./fakes";

type App = ReturnType<typeof buildApp>;

// Returns an ISO date N hours from now, so tests never depend on today's date.
function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

// Every reservation needs an existing equipment (id 1) and user (id 1).
async function seed(app: App) {
  await request(app).post("/api/equipment").send({ name: "Oscilloscope", category: "measurement" });
  await request(app).post("/api/users").send({ fullName: "Ana López", email: "ana@lab.local" });
}

function validReservation(overrides: Record<string, unknown> = {}) {
  return {
    equipmentId: 1,
    userId: 1,
    startsAt: hoursFromNow(24),
    endsAt: hoursFromNow(26),
    ...overrides
  };
}

describe("Reservations API", () => {
  it("creates a reservation and lists it", async () => {
    const app = buildApp();
    await seed(app);

    const created = await request(app).post("/api/reservations").send(validReservation());
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("active");

    const list = await request(app).get("/api/reservations");
    expect(list.body).toHaveLength(1);
  });

  it("rejects a reservation that ends before it starts", async () => {
    const app = buildApp();
    await seed(app);

    const res = await request(app)
      .post("/api/reservations")
      .send(validReservation({ startsAt: hoursFromNow(26), endsAt: hoursFromNow(24) }));
    expect(res.status).toBe(400);
  });

  it("rejects a reservation in the past with 422", async () => {
    const app = buildApp();
    await seed(app);

    const res = await request(app)
      .post("/api/reservations")
      .send(validReservation({ startsAt: hoursFromNow(-3), endsAt: hoursFromNow(-1) }));
    expect(res.status).toBe(422);
  });

  it("returns 404 when the equipment does not exist", async () => {
    const app = buildApp();
    await seed(app);

    const res = await request(app).post("/api/reservations").send(validReservation({ equipmentId: 99 }));
    expect(res.status).toBe(404);
  });

  it("returns 404 when the user does not exist", async () => {
    const app = buildApp();
    await seed(app);

    const res = await request(app).post("/api/reservations").send(validReservation({ userId: 99 }));
    expect(res.status).toBe(404);
  });

  it("rejects reserving equipment under maintenance with 422", async () => {
    const app = buildApp();
    await seed(app);

    const patch = await request(app).patch("/api/equipment/1").send({ status: "maintenance" });
    expect(patch.status).toBe(200);

    const res = await request(app).post("/api/reservations").send(validReservation());
    expect(res.status).toBe(422);
  });

  it("filters reservations by equipment", async () => {
    const app = buildApp();
    await seed(app);
    await request(app).post("/api/equipment").send({ name: "Raspberry Pi", category: "computing" });

    await request(app).post("/api/reservations").send(validReservation());
    await request(app).post("/api/reservations").send(validReservation({ equipmentId: 2 }));

    const res = await request(app).get("/api/reservations?equipmentId=2");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].equipmentId).toBe(2);
  });

  it("rejects an overlapping reservation for the same equipment with 409", async () => {
    const app = buildApp();
    await seed(app);
    await request(app)
      .post("/api/reservations")
      .send(validReservation({ startsAt: hoursFromNow(24), endsAt: hoursFromNow(26) }));

    const res = await request(app)
      .post("/api/reservations")
      .send(validReservation({ startsAt: hoursFromNow(25), endsAt: hoursFromNow(27) }));
    expect(res.status).toBe(409);
  });

  it("allows back-to-back reservations", async () => {
    const app = buildApp();
    await seed(app);

    const first = await request(app)
      .post("/api/reservations")
      .send(validReservation({ startsAt: hoursFromNow(24), endsAt: hoursFromNow(26) }));
    expect(first.status).toBe(201);

    const res = await request(app)
      .post("/api/reservations")
      .send(validReservation({ startsAt: hoursFromNow(26), endsAt: hoursFromNow(28) }));
    expect(res.status).toBe(201);
  });

  it("allows the same time range on different equipment", async () => {
    const app = buildApp();
    await seed(app);
    await request(app).post("/api/equipment").send({ name: "Raspberry Pi", category: "computing" });
    await request(app).post("/api/reservations").send(validReservation());

    const res = await request(app).post("/api/reservations").send(validReservation({ equipmentId: 2 }));
    expect(res.status).toBe(201);
  });

  it("returns a reservation by id", async () => {
    const app = buildApp();
    await seed(app);
    const created = await request(app).post("/api/reservations").send(validReservation());
    expect(created.status).toBe(201);

    const res = await request(app).get("/api/reservations/1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("returns 404 for a missing reservation", async () => {
    const res = await request(buildApp()).get("/api/reservations/99");
    expect(res.status).toBe(404);
  });

});