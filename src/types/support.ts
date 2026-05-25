import { z } from "zod";

export const supportTicketSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Invalid email").max(254),
  subject: z.string().trim().min(1, "Subject is required").max(120),
  message: z.string().trim().min(10, "Message is too short").max(2000),
  turnstileToken: z.string().min(1, "Please complete the security check"),
  website: z.string().max(0, "Spam detected").optional(),
});

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
