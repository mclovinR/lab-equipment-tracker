import request from "supertest";
import { buildApp } from "./fakes";

// Helper: creates one equipment item so each test starts with known data.
async function seedOne(app: ReturnType<typeof buildApp>) {
  await request(app).post("/api/equipment").send({ name: "Oscilloscope", category: "measurement" });
}

describe("GET /health", () => {
  it("returns ok", async () => {
    const res = await request(buildApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("Equipment API", () => {
  it("creates equipment and lists it", async () => {
    const app = buildApp();

    const created = await request(app)
      .post("/api/equipment")
      .send({ name: "Oscilloscope", category: "measurement" });
    expect(created.status).toBe(201);
    expect(created.body.id).toBe(1);

    const list = await request(app).get("/api/equipment");
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it("rejects invalid data with 400", async () => {
    const res = await request(buildApp()).post("/api/equipment").send({ name: "X" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for missing equipment", async () => {
    const res = await request(buildApp()).get("/api/equipment/99");
    expect(res.status).toBe(404);
  });

  it("returns 400 for a non-numeric id", async () => {
    const res = await request(buildApp()).get("/api/equipment/abc");
    expect(res.status).toBe(400);
  });

    it("filters equipment by category", async () => {
    const app = buildApp();
    await request(app).post("/api/equipment").send({ name: "Oscilloscope", category: "measurement" });
    await request(app).post("/api/equipment").send({ name: "Raspberry Pi", category: "computing" });

    const res = await request(app).get("/api/equipment?category=computing");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Raspberry Pi");
  });
});

describe("PATCH /api/equipment/:id", () => {
  it("updates only the fields sent", async () => {
    const app = buildApp();
    await seedOne(app);

    const res = await request(app).patch("/api/equipment/1").send({ status: "maintenance" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("maintenance");
    expect(res.body.name).toBe("Oscilloscope");
  });

  it("rejects an empty body with 400", async () => {
    const app = buildApp();
    await seedOne(app);

    const res = await request(app).patch("/api/equipment/1").send({});
    expect(res.status).toBe(400);
  });

  it("rejects an invalid status with 400", async () => {
    const app = buildApp();
    await seedOne(app);

    const res = await request(app).patch("/api/equipment/1").send({ status: "broken" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for missing equipment", async () => {
    const res = await request(buildApp()).patch("/api/equipment/99").send({ status: "retired" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/equipment/:id", () => {
  it("deletes equipment and returns 204", async () => {
    const app = buildApp();
    await seedOne(app);

    const res = await request(app).delete("/api/equipment/1");
    expect(res.status).toBe(204);

    const after = await request(app).get("/api/equipment/1");
    expect(after.status).toBe(404);
  });

  it("returns 404 for missing equipment", async () => {
    const res = await request(buildApp()).delete("/api/equipment/99");
    expect(res.status).toBe(404);
  });
});
