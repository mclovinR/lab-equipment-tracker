import { z } from "zod";

// Validation rules for incoming data. If the body doesn't match, Zod throws a ZodError.
export const createEquipmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(50),
  location: z.string().trim().max(100).optional()
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;

export interface Equipment {
  id: number;
  name: string;
  category: string;
  location: string | null;
  status: "available" | "maintenance" | "retired";
  createdAt: Date;
}
