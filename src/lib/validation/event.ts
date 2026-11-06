import { z } from "zod";

const eventBaseSchema = z.object({
  dogId: z.uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).optional(),
  occurredAt: z.iso.datetime({ offset: true }),
  locationLabel: z.string().trim().max(200).optional(),
  visibility: z.enum(["PUBLIC", "MEMBERS", "PRIVATE"]).default("PUBLIC"),
});

const feedingSchema = eventBaseSchema.extend({
  eventType: z.literal("FEEDING"),
  details: z.object({
    foodType: z.string().trim().min(1).max(80),
    quantity: z.number().positive().optional(),
    quantityUnit: z.enum(["g", "kg", "portion"]).optional(),
    waterProvided: z.boolean().default(false),
  }),
});

const healthObservationSchema = eventBaseSchema.extend({
  eventType: z.literal("HEALTH_OBSERVATION"),
  details: z.object({
    observedSigns: z.array(z.string().trim().min(1).max(80)).max(20),
    bodyArea: z.string().trim().max(120).optional(),
    professionalDiagnosis: z.literal(false).default(false),
  }),
});

const generalEventSchema = eventBaseSchema.extend({
  eventType: z.enum(["SIGHTING", "VETERINARY_VISIT", "VACCINATION", "STERILISATION", "RESCUE", "GENERAL_UPDATE"]),
  details: z.record(z.string(), z.unknown()).default({}),
});

export const eventCreationSchema = z.discriminatedUnion("eventType", [
  feedingSchema,
  healthObservationSchema,
  generalEventSchema,
]);

export type EventCreationInput = z.infer<typeof eventCreationSchema>;
