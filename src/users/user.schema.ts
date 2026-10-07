import { z } from "zod";

export const USER_ROLES = ["student", "researcher", "admin"] as const;

export const createUserSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  email: z.string().trim().toLowerCase().email().max(120),
  role: z.enum(USER_ROLES).default("student")
});

// PATCH: every field optional, but at least one must be sent.
export const updateUserSchema = z
  .object({
    fullName: z.string().trim().min(3).max(120),
    email: z.string().trim().toLowerCase().email().max(120),
    role: z.enum(USER_ROLES)
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required"
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: (typeof USER_ROLES)[number];
  createdAt: Date;
}