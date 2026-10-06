import { Pool } from "pg";
import { CreateEquipmentInput, Equipment } from "./equipment.schema";

// Interface = contract. The service depends on this, not on Postgres directly,
// so in tests we can swap in a fake repository without a database.
export interface EquipmentRepository {
  findAll(): Promise<Equipment[]>;
  findById(id: number): Promise<Equipment | null>;
  create(data: CreateEquipmentInput): Promise<Equipment>;
}

const SELECT_COLUMNS = `id, name, category, location, status, created_at AS "createdAt"`;

// Repository: the only layer that writes SQL.
export class PgEquipmentRepository implements EquipmentRepository {
  constructor(private readonly db: Pool) {}

  async findAll(): Promise<Equipment[]> {
    const { rows } = await this.db.query<Equipment>(
      `SELECT ${SELECT_COLUMNS} FROM equipment ORDER BY id`
    );
    return rows;
  }

  async findById(id: number): Promise<Equipment | null> {
    // $1 is a parameter: pg escapes it, which prevents SQL injection.
    const { rows } = await this.db.query<Equipment>(
      `SELECT ${SELECT_COLUMNS} FROM equipment WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async create(data: CreateEquipmentInput): Promise<Equipment> {
    // RETURNING gives back the inserted row (Postgres feature; MySQL doesn't have it).
    const { rows } = await this.db.query<Equipment>(
      `INSERT INTO equipment (name, category, location)
       VALUES ($1, $2, $3)
       RETURNING ${SELECT_COLUMNS}`,
      [data.name, data.category, data.location ?? null]
    );
    return rows[0];
  }
}
