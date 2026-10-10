import { Pool } from "pg";
import { CreateReservationInput, Reservation, ReservationFilters } from "./reservation.schema";
// Interface = contract. The service depends on this, not on Postgres directly,
// so in tests we can swap in a fake repository without a database.
export interface ReservationRepository {
    findAll(filters: ReservationFilters): Promise<Reservation[]>;
    findById(id: number): Promise<Reservation | null>;
    create(data: CreateReservationInput): Promise<Reservation>;
    hasOverlap(equipmentId: number, startsAt: Date, endsAt: Date): Promise<boolean>;
    cancel(id: number): Promise<Reservation | null>;
}

const SELECT_COLUMNS = `id, equipment_id AS "equipmentId", user_id AS "userId",
  starts_at AS "startsAt", ends_at AS "endsAt", status, created_at AS "createdAt"`;

// Repository: the only layer that writes SQL.
export class PgReservationRepository implements ReservationRepository {
    constructor(private readonly db: Pool) { }

    async findAll(filters: ReservationFilters): Promise<Reservation[]> {

        const { rows } = await this.db.query<Reservation>(
            `SELECT ${SELECT_COLUMNS} FROM reservations
       WHERE ($1::int IS NULL OR equipment_id = $1)
         AND ($2::int IS NULL OR user_id = $2)
       ORDER BY starts_at`,
            [filters.equipmentId ?? null, filters.userId ?? null]
        );
        return rows;
    }

    async findById(id: number): Promise<Reservation | null> {
        // $1 is a parameter: pg escapes it, which prevents SQL injection.
        const { rows } = await this.db.query<Reservation>(
            `SELECT ${SELECT_COLUMNS} FROM reservations WHERE id = $1`,
            [id]
        );
        return rows[0] ?? null;
    }

    async create(data: CreateReservationInput): Promise<Reservation> {
        // RETURNING gives back the inserted row (Postgres feature; MySQL doesn't have it).
        const { rows } = await this.db.query<Reservation>(
            `INSERT INTO reservations (equipment_id, user_id, starts_at, ends_at)
       VALUES ($1, $2, $3, $4)
       RETURNING ${SELECT_COLUMNS}`,
            [data.equipmentId, data.userId, data.startsAt, data.endsAt]
        );
        return rows[0];
    }

    async hasOverlap(equipmentId: number, startsAt: Date, endsAt: Date): Promise<boolean> {
        // Same rule as rangesOverlap(), but done by the database:
        // an active reservation of the same equipment that starts before ours ends
        // and ends after ours starts.
        const { rows } = await this.db.query<{ overlap: boolean }>(
            `SELECT EXISTS (
         SELECT 1 FROM reservations
         WHERE equipment_id = $1
           AND status = 'active'
           AND starts_at < $3
           AND ends_at > $2
       ) AS overlap`,
            [equipmentId, startsAt, endsAt]
        );
        return rows[0].overlap;
    }

    async cancel(id: number): Promise<Reservation | null> {
        const { rows } = await this.db.query<Reservation>(
            `UPDATE reservations
       SET status = 'cancelled'
       WHERE id = $1
       RETURNING ${SELECT_COLUMNS}`,
            [id]
        );
        return rows[0] ?? null;
    }
}
