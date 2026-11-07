import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().transform(value => value || undefined);

export const pendingPawUpdateSchema = z.object({
  dogId: z.uuid(),
  name: optionalText(100),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]),
  estimatedAge: optionalText(80),
  breed: optionalText(120),
  colour: optionalText(120),
  size: z.enum(["UNKNOWN", "SMALL", "MEDIUM", "LARGE"]),
  distinguishingFeatures: optionalText(1000),
  foundAt: z.iso.datetime({ offset: true }).refine(value => new Date(value).getTime() <= Date.now() + 5 * 60 * 1000, "Discovery time cannot be in the future."),
  foundLocationLabel: z.string().trim().min(1).max(200),
  vaccinationStatus: z.enum(["UNKNOWN", "REPORTED", "EVIDENCE_ATTACHED"]),
  sterilisationStatus: z.enum(["UNKNOWN", "REPORTED", "EVIDENCE_ATTACHED"]),
});

export const followUpCreateSchema = z.object({
  dogId: z.uuid(),
  relatedEventId: z.union([z.literal(""), z.uuid()]).optional(),
  title: z.string().trim().min(1).max(160),
  description: optionalText(2000),
  dueAt: z.union([z.literal(""), z.iso.datetime({ offset: true })]).optional(),
  assignedTo: z.union([z.literal(""), z.uuid()]).optional(),
});

export const followUpStatusSchema = z.object({
  followUpId: z.uuid(),
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

export const reportResolutionSchema = z.object({
  reportId: z.uuid(),
  status: z.enum(["UNDER_REVIEW", "RESOLVED", "DISMISSED"]),
  resolutionNote: z.string().trim().min(1).max(2000),
});

export const accountStatusSchema = z.object({
  userId: z.uuid(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DISABLED"]),
  reason: z.string().trim().min(1).max(500),
});

export const roleChangeSchema = z.object({
  userId: z.uuid(),
  role: z.enum(["MODERATOR", "SUPER_ADMIN"]),
  enabled: z.enum(["true", "false"]).transform(value => value === "true"),
  reason: z.string().trim().min(1).max(500),
});
