import { EquipmentRepository } from "../equipment/equipment.repository";
import { AppError, ConflictError, NotFoundError } from "../errors/AppError";
import { UserRepository } from "../users/user.repository";
import { ReservationRepository } from "./reservation.repository";
import { CreateReservationInput, Reservation, ReservationFilters } from "./reservation.schema";

// This service needs THREE repositories: a reservation links equipment and a user.
export class ReservationService {
    constructor(
        private readonly reservations: ReservationRepository,
        private readonly equipment: EquipmentRepository,
        private readonly users: UserRepository
    ) { }

    list(filters: ReservationFilters): Promise<Reservation[]> {
        return this.reservations.findAll(filters);
    }

    async getById(id: number): Promise<Reservation> {
        const reservation = await this.reservations.findById(id);
        if (!reservation) throw new NotFoundError("Reservation");
        return reservation;
    }

    async create(data: CreateReservationInput): Promise<Reservation> {

        const equipment = await this.equipment.findById(data.equipmentId);
        if (!equipment) throw new NotFoundError("Equipment");


        if (equipment.status !== "available") {
            throw new AppError(422, "Equipment is not available");
        }

        const user = await this.users.findById(data.userId);
        if (!user) throw new NotFoundError("User");

        if (!(await this.users.findById(data.userId))) {
            throw new NotFoundError("User");
        }

        if (data.startsAt <= new Date()) {
            throw new AppError(422, "Reservations must start in the future");
        }

        // Business rule: the same equipment cannot be reserved twice at the same time.
        const overlap = await this.reservations.hasOverlap(data.equipmentId, data.startsAt, data.endsAt);
        if (overlap) throw new ConflictError("Equipment is already reserved in that time range");

        return this.reservations.create(data);
    }
}