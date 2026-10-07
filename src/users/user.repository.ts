import { Pool } from "pg";
import { CreateUserInput, User, UpdateUserInput } from "./user.schema";

// Interface = contract. The service depends on this, not on Postgres directly,
// so in tests we can swap in a fake repository without a database.
export interface UserRepository {
    findAll(): Promise<User[]>;
    findById(id: number): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(data: CreateUserInput): Promise<User>;
    update(id: number, data: UpdateUserInput): Promise<User | null>;
}

const SELECT_COLUMNS = `id, full_name AS "fullName", email, role, created_at AS "createdAt"`;

// Repository: the only layer that writes SQL.
export class PgUserRepository implements UserRepository {
    constructor(private readonly db: Pool) { }

    async findAll(): Promise<User[]> {

        const { rows } = await this.db.query<User>(
            `SELECT ${SELECT_COLUMNS} FROM users ORDER BY id`
        );
        return rows;
    }

    async findById(id: number): Promise<User | null> {
        // $1 is a parameter: pg escapes it, which prevents SQL injection.
        const { rows } = await this.db.query<User>(
            `SELECT ${SELECT_COLUMNS} FROM users WHERE id = $1`,
            [id]
        );
        return rows[0] ?? null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const { rows } = await this.db.query<User>(
            `SELECT ${SELECT_COLUMNS} FROM users WHERE email = $1`,
            [email]
        );
        return rows[0] ?? null;
    }

    async create(data: CreateUserInput): Promise<User> {
        // RETURNING gives back the inserted row (Postgres feature; MySQL doesn't have it).
        const { rows } = await this.db.query<User>(
            `INSERT INTO users (full_name, email, role)
       VALUES ($1, $2, $3)
       RETURNING ${SELECT_COLUMNS}`,
            [data.fullName, data.email, data.role]
        );
        return rows[0];
    }

    async update(id: number, data: UpdateUserInput): Promise<User | null> {
        // COALESCE(new, current): if a field was not sent (null), keep the current value.
        const { rows } = await this.db.query<User>(
            `UPDATE users
       SET full_name = COALESCE($2, full_name),
           email     = COALESCE($3, email),
           role      = COALESCE($4, role)
       WHERE id = $1
       RETURNING ${SELECT_COLUMNS}`,
            [id, data.fullName ?? null, data.email ?? null, data.role ?? null]
        );
        return rows[0] ?? null;
    }
}
