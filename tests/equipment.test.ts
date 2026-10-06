import request from "supertest";
import { createApp } from "../src/app";
import { EquipmentRepository } from "../src/equipment/equipment.repository";
import { CreateEquipmentInput, Equipment, UpdateEquipmentInput } from "../src/equipment/equipment.schema";

// Fake repository: keeps data in memory, so tests run without Postgres (fast and CI-friendly).
class InMemoryEquipmentRepository implements EquipmentRepository {
  private items: Equipment[] = [];
  private nextId = 1;

  async findAll() {
    return this.items;
  }

  async findById(id: number) {
    return this.items.find((e) => e.id === id) ?? null;
  }

  async create(data: CreateEquipmentInput) {
    const item: Equipment = {
      id: this.nextId++,
      name: data.name,
      category: data.category,
      location: data.location ?? null,
      status: "available",
      createdAt: new Date()
    };
    this.items.push(item);
    return item;
  }

    async update(id: number, data: UpdateEquipmentInput) {
    const item = this.items.find((e) => e.id === id);
    if (!item) return null;
    Object.assign(item, data);
    return item;
  }
}

function buildApp() {
  return createApp({ equipmentRepo: new InMemoryEquipmentRepository() });
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

    it("updates equipment status with PATCH", async () => {
    const app = buildApp();
    await request(app).post("/api/equipment").send({ name: "Oscilloscope", category: "measurement" });

    const res = await request(app).patch("/api/equipment/1").send({ status: "maintenance" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("maintenance");
    expect(res.body.name).toBe("Oscilloscope");
  });

  it("rejects an empty PATCH body with 400", async () => {
    const app = buildApp();
    await request(app).post("/api/equipment").send({ name: "Oscilloscope", category: "measurement" });

    const res = await request(app).patch("/api/equipment/1").send({});
    expect(res.status).toBe(400);
  });

  it("returns 404 when updating missing equipment", async () => {
    const res = await request(buildApp()).patch("/api/equipment/99").send({ status: "retired" });
    expect(res.status).toBe(404);
  });
});
