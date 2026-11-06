import { z } from "zod";

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional();

const participantSchema = z.object({
  name: z.string().trim().min(1).max(120),
  context: optionalText(160),
});

const eventBaseSchema = z.object({
  dogId: z.uuid(),
  title: z.string().trim().min(1).max(160),
  description: optionalText(4000),
  occurredAt: z.iso.datetime({ offset: true }).refine(
    value => new Date(value).getTime() <= Date.now() + 5 * 60 * 1000,
    "The event time cannot be in the future.",
  ),
  locationLabel: optionalText(200),
  visibility: z.enum(["PUBLIC", "MEMBERS", "PRIVATE"]).default("PUBLIC"),
  participants: z.array(participantSchema).max(20).default([]),
});

const feedingSchema = eventBaseSchema.extend({
  eventType: z.literal("FEEDING"),
  details: z.object({
    foodType: z.string().trim().min(1).max(80),
    quantity: z.number().positive().max(10000).optional(),
    quantityUnit: z.enum(["g", "kg", "portion"]).optional(),
    waterProvided: z.boolean().default(false),
  }),
});

const sightingSchema = eventBaseSchema.extend({
  eventType: z.literal("SIGHTING"),
  details: z.object({
    observedCondition: optionalText(240),
    directionOfTravel: optionalText(120),
  }),
});

const healthObservationSchema = eventBaseSchema.extend({
  eventType: z.literal("HEALTH_OBSERVATION"),
  details: z.object({
    observedSigns: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
    bodyArea: optionalText(120),
    professionalDiagnosis: z.literal(false).default(false),
  }),
});

const veterinaryVisitSchema = eventBaseSchema.extend({
  eventType: z.literal("VETERINARY_VISIT"),
  details: z.object({
    providerName: z.string().trim().min(1).max(160),
    visitOutcome: optionalText(500),
    nextDueAt: z.union([z.literal(""), z.iso.datetime({ offset: true })]).optional(),
  }),
});

const vaccinationSchema = eventBaseSchema.extend({
  eventType: z.literal("VACCINATION"),
  details: z.object({
    vaccineName: z.string().trim().min(1).max(160),
    dose: optionalText(80),
    nextDueAt: z.union([z.literal(""), z.iso.datetime({ offset: true })]).optional(),
  }),
});

const sterilisationSchema = eventBaseSchema.extend({
  eventType: z.literal("STERILISATION"),
  details: z.object({
    procedureStatus: z.enum(["COMPLETED", "SCHEDULED", "UNKNOWN"]),
    providerName: optionalText(160),
  }),
});

const rescueSchema = eventBaseSchema.extend({
  eventType: z.literal("RESCUE"),
  details: z.object({
    outcome: z.string().trim().min(1).max(500),
    destination: optionalText(200),
  }),
});

const generalUpdateSchema = eventBaseSchema.extend({
  eventType: z.literal("GENERAL_UPDATE"),
  details: z.object({
    category: optionalText(80),
  }),
});

export const eventCreationSchema = z.discriminatedUnion("eventType", [
  feedingSchema,
  sightingSchema,
  healthObservationSchema,
  veterinaryVisitSchema,
  vaccinationSchema,
  sterilisationSchema,
  rescueSchema,
  generalUpdateSchema,
]);

export const eventCorrectionSchema = z.object({
  eventId: z.uuid(),
  reason: z.string().trim().min(1).max(500),
  title: z.string().trim().min(1).max(160),
  description: optionalText(4000),
  occurredAt: z.iso.datetime({ offset: true }).refine(
    value => new Date(value).getTime() <= Date.now() + 5 * 60 * 1000,
    "The event time cannot be in the future.",
  ),
  locationLabel: optionalText(200),
  visibility: z.enum(["PUBLIC", "MEMBERS", "PRIVATE"]),
  verificationStatus: z.enum(["UNVERIFIED", "EVIDENCE_ATTACHED", "VERIFIED", "DISPUTED"]),
});

export const eventReportSchema = z.object({
  dogId: z.uuid(),
  eventId: z.uuid(),
  reason: z.string().trim().min(3).max(160),
  description: optionalText(2000),
});

export type EventCreationInput = z.infer<typeof eventCreationSchema>;
