import request from "supertest";
import { buildApp } from "./fakes";

const ana = { fullName: "Ana López", email: "ana@lab.local", role: "researcher" };

describe("Users API", () => {
  it("creates a user and lists it", async () => {
    const app = buildApp();

    const created = await request(app).post("/api/users").send(ana);
    expect(created.status).toBe(201);
    expect(created.body.fullName).toBe("Ana López");

    const list = await request(app).get("/api/users");
    expect(list.body).toHaveLength(1);
  });

  it("uses 'student' as the default role", async () => {
    const res = await request(buildApp())
      .post("/api/users")
      .send({ fullName: "Luis Pérez", email: "luis@lab.local" });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe("student");
  });

  it("rejects an invalid email with 400", async () => {
    const res = await request(buildApp())
      .post("/api/users")
      .send({ fullName: "Ana López", email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email with 409", async () => {
    const app = buildApp();
    await request(app).post("/api/users").send(ana);

    const res = await request(app).post("/api/users").send({ ...ana, fullName: "Otra Ana" });
    expect(res.status).toBe(409);
  });

  it("returns 404 for a missing user", async () => {
    const res = await request(buildApp()).get("/api/users/99");
    expect(res.status).toBe(404);
  });

  it("updates a user's role with PATCH", async () => {
    const app = buildApp();
    await request(app).post("/api/users").send(ana);

    const res = await request(app).patch("/api/users/1").send({ role: "admin" });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("admin");
    expect(res.body.email).toBe("ana@lab.local");
  });

  it("rejects changing the email to one another user has", async () => {
    // TODO (tú):
    // 1. Crea la app con buildApp()
    const app = buildApp();
    // 2. Registra a ana (será el usuario 1)
    await request(app).post("/api/users").send(ana);
    // 3. Registra a otro usuario con correo distinto, por ejemplo luis@lab.local (será el usuario 2)
    await request(app).post("/api/users").send({ fullName: "Luis Pérez", email: "luis@lab.local" });
    // 4. Intenta cambiarle el correo al usuario 2 por "ana@lab.local" con un PATCH
    const res = await request(app).patch("/api/users/2").send({ email: "ana@lab.local" });
    // 5. Revisa que la respuesta sea 409
    expect(res.status).toBe(409);
  });
});