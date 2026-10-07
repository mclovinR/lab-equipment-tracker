import { Pool } from "pg";
import { CreateEquipmentInput, Equipment, UpdateEquipmentInput } from "./equipment.schema";

// Interface = contract. The service depends on this, not on Postgres directly,
// so in tests we can swap in a fake repository without a database.
export interface EquipmentRepository {
  findAll(category?: string): Promise<Equipment[]>;
  findById(id: number): Promise<Equipment | null>;
  create(data: CreateEquipmentInput): Promise<Equipment>;
  update(id: number, data: UpdateEquipmentInput): Promise<Equipment | null>;
  delete(id: number): Promise<boolean>;
}

const SELECT_COLUMNS = `id, name, category, location, status, created_at AS "createdAt"`;

// Repository: the only layer that writes SQL.
export class PgEquipmentRepository implements EquipmentRepository {
  constructor(private readonly db: Pool) {}

    async findAll(category?: string): Promise<Equipment[]> {
    if (category) {
      const { rows } = await this.db.query<Equipment>(
        `SELECT ${SELECT_COLUMNS} FROM equipment WHERE category = $1 ORDER BY id`,
        [category]
      );
      return rows;
    }

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

  async update(id: number, data: UpdateEquipmentInput): Promise<Equipment | null> {
    // COALESCE(new, current): if a field was not sent (null), keep the current value.
    const { rows } = await this.db.query<Equipment>(
      `UPDATE equipment
       SET name     = COALESCE($2, name),
           category = COALESCE($3, category),
           location = COALESCE($4, location),
           status   = COALESCE($5, status)
       WHERE id = $1
       RETURNING ${SELECT_COLUMNS}`,
      [id, data.name ?? null, data.category ?? null, data.location ?? null, data.status ?? null]
    );
    return rows[0] ?? null;
  }

  async delete(id: number): Promise<boolean> {
    // rowCount = how many rows were deleted. 0 means the id didn't exist.
    const result = await this.db.query(`DELETE FROM equipment WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
