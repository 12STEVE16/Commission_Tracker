// src/lib/validators/invite.ts
import { z } from "zod";

export const InviteSchema = z.object({
  fullName: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || v.length >= 2, {
      message: "Full name must be at least 2 characters.",
    })
    .refine((v) => !v || /^[\p{L}'\-\s]+$/u.test(v), {
      message:
        "Full name may only contain letters, spaces, hyphens, or apostrophes.",
    }),
  email: z.string().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\+?[0-9 ()-]{7,}$/.test(v), {
      message: "Please enter a valid phone number.",
    }),
});

export type InviteFormData = z.infer<typeof InviteSchema>;
