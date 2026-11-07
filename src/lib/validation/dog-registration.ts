import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || undefined);

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().nonnegative().optional(),
});

const memberParticipantSchema = z.object({
  kind: z.literal("MEMBER"),
  userId: z.uuid(),
  context: optionalText(120),
});

const nonMemberParticipantSchema = z.object({
  kind: z.literal("NON_MEMBER"),
  name: z.string().trim().min(1).max(120),
  context: optionalText(120),
});

export const participantSchema = z.discriminatedUnion("kind", [
  memberParticipantSchema,
  nonMemberParticipantSchema,
]);

export const dogRegistrationSchema = z.object({
  primaryPhotoPath: z.string().trim().min(1),
  name: optionalText(100),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN"),
  estimatedAge: optionalText(80),
  breed: optionalText(120),
  colour: optionalText(120),
  size: z.enum(["UNKNOWN", "SMALL", "MEDIUM", "LARGE"]).default("UNKNOWN"),
  distinguishingFeatures: optionalText(1000),
  foundAt: z.iso.datetime({ offset: true }),
  foundLocationLabel: z.string().trim().min(1).max(200),
  coordinates: coordinatesSchema,
  discoveryDescription: optionalText(2000),
  initialObservation: optionalText(2000),
  vaccinationStatus: z.enum(["UNKNOWN", "REPORTED", "EVIDENCE_ATTACHED"]).default("UNKNOWN"),
  sterilisationStatus: z.enum(["UNKNOWN", "REPORTED", "EVIDENCE_ATTACHED"]).default("UNKNOWN"),
  participants: z.array(participantSchema).max(20).default([]),
});

export type DogRegistrationInput = z.infer<typeof dogRegistrationSchema>;
