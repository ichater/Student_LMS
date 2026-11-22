import { z } from "zod";

const nameField = z.string().trim().min(1).max(100);

export const createConsultationSchema = z.object({
  first_name: nameField,
  last_name: nameField,
  reason: z.string().trim().min(1).max(1000),
  scheduled_at: z.iso.datetime({ offset: true }),
});

export const consultationIdSchema = z.uuid();

export const patchConsultationSchema = z.union([
  z.object({ scheduled_at: z.iso.datetime({ offset: true }) }).strict(),
  z.object({ status: z.enum(["completed", "booked", "cancelled"]) }).strict(),
]);
