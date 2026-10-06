import { NotFoundError } from "../errors/AppError";
import { EquipmentRepository } from "./equipment.repository";
import { CreateEquipmentInput, Equipment } from "./equipment.schema";

// Service: business rules. Knows nothing about HTTP or SQL.
export class EquipmentService {
  constructor(private readonly repo: EquipmentRepository) {}

  list(): Promise<Equipment[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Equipment> {
    const equipment = await this.repo.findById(id);
    if (!equipment) throw new NotFoundError("Equipment");
    return equipment;
  }

  create(data: CreateEquipmentInput): Promise<Equipment> {
    return this.repo.create(data);
  }
}
