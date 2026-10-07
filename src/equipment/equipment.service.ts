import { NotFoundError } from "../errors/AppError";
import { EquipmentRepository } from "./equipment.repository";
import { CreateEquipmentInput, Equipment, UpdateEquipmentInput } from "./equipment.schema";

// Service: business rules. Knows nothing about HTTP or SQL.
export class EquipmentService {
  constructor(private readonly repo: EquipmentRepository) {}

  list(category?: string): Promise<Equipment[]> {
    return this.repo.findAll(category);
  }

  async getById(id: number): Promise<Equipment> {
    const equipment = await this.repo.findById(id);
    if (!equipment) throw new NotFoundError("Equipment");
    return equipment;
  }

  create(data: CreateEquipmentInput): Promise<Equipment> {
    return this.repo.create(data);
  }

  async update(id: number, data: UpdateEquipmentInput): Promise<Equipment> {
    const equipment = await this.repo.update(id, data);
    if (!equipment) throw new NotFoundError("Equipment");
    return equipment;
  }

  async remove(id: number): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new NotFoundError("Equipment");
  }
}
