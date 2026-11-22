import { z } from "zod";

export const registerSchema = z.object({
  email: z.email().trim().max(320),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.email().trim().max(320),
  password: z.string().min(1).max(128),
});
