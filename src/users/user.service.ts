import { ConflictError, NotFoundError } from "../errors/AppError";
import { UserRepository } from "./user.repository";
import { CreateUserInput, UpdateUserInput, User } from "./user.schema";

// Service: business rules. Knows nothing about HTTP or SQL.
export class UserService {
    constructor(private readonly repo: UserRepository) { }

    list(): Promise<User[]> {
        return this.repo.findAll();
    }

    async getById(id: number): Promise<User> {
        const user = await this.repo.findById(id);
        if (!user) throw new NotFoundError("User");
        return user;
    }

    async create(data: CreateUserInput): Promise<User> {
        // Business rule: emails are unique.
        const existing = await this.repo.findByEmail(data.email);
        if (existing) throw new ConflictError("Email already registered");
        return this.repo.create(data);
    }

    async update(id: number, data: UpdateUserInput): Promise<User> {
        // if the email changes, it must not belong to another user. This is a business rule.
        if (data.email) {
            const existing = await this.repo.findByEmail(data.email);
            if (existing && existing.id !== id) {
                throw new ConflictError("Email already registered");
            }
        }

        const user = await this.repo.update(id, data);
        if (!user) throw new NotFoundError("User");
        return user;

    }
}