import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business name").max(80),
  businessType: z.enum(["retail", "wholesale", "pharmacy", "restaurant", "hotel", "services", "other"]),
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters").max(128),
});
