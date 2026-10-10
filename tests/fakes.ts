import { createApp } from "../src/app";
import { EquipmentRepository } from "../src/equipment/equipment.repository";
import {
  CreateEquipmentInput,
  Equipment,
  UpdateEquipmentInput
} from "../src/equipment/equipment.schema";
import { UserRepository } from "../src/users/user.repository";
import { CreateUserInput, UpdateUserInput, User } from "../src/users/user.schema";
import { ReservationRepository } from "../src/reservations/reservation.repository";
import {
  CreateReservationInput,
  Reservation,
  ReservationFilters
} from "../src/reservations/reservation.schema";
// Fake repositories: keep data in memory, so tests run without Postgres (fast and CI-friendly).

export class InMemoryEquipmentRepository implements EquipmentRepository {
  private items: Equipment[] = [];
  private nextId = 1;

  async findAll(category?: string) {
    if (!category) return [...this.items];
    return this.items.filter((e) => e.category === category);
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

  async delete(id: number) {
    const index = this.items.findIndex((e) => e.id === id);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }
}

export class InMemoryUserRepository implements UserRepository {
  private items: User[] = [];
  private nextId = 1;

  async findAll() {
    return [...this.items];
  }

  async findById(id: number) {
    return this.items.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string) {
    return this.items.find((u) => u.email === email) ?? null;
  }

  async create(data: CreateUserInput) {
    const user: User = {
      id: this.nextId++,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      createdAt: new Date()
    };
    this.items.push(user);
    return user;
  }

  async update(id: number, data: UpdateUserInput) {
    const user = this.items.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, data);
    return user;
  }
}
export class InMemoryReservationRepository implements ReservationRepository {
  private items: Reservation[] = [];
  private nextId = 1;

  async findAll(filters: ReservationFilters) {
    return this.items
      .filter((r) => !filters.equipmentId || r.equipmentId === filters.equipmentId)
      .filter((r) => !filters.userId || r.userId === filters.userId)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  async findById(id: number) {
    return this.items.find((r) => r.id === id) ?? null;
  }

  async create(data: CreateReservationInput) {
    const reservation: Reservation = {
      id: this.nextId++,
      equipmentId: data.equipmentId,
      userId: data.userId,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      status: "active",
      createdAt: new Date()
    };
    this.items.push(reservation);
    return reservation;
  }
}

// Builds a fresh app with empty fake repositories for each test.
export function buildApp() {
  return createApp({
    equipmentRepo: new InMemoryEquipmentRepository(),
    userRepo: new InMemoryUserRepository(),
    reservationRepo: new InMemoryReservationRepository()
  });
}
