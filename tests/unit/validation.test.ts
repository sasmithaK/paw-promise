import { describe, expect, it } from "vitest";
import { dogRegistrationSchema } from "@/lib/validation/dog-registration";
import { eventCreationSchema, eventCorrectionSchema, eventReportSchema } from "@/lib/validation/event";

const validRegistration = {
  primaryPhotoPath: "user-id/photo.webp",
  sex: "UNKNOWN",
  size: "UNKNOWN",
  foundAt: "2026-11-06T08:30:00+05:30",
  foundLocationLabel: "Approximate locality, Tholangamuwa",
  coordinates: { latitude: 7, longitude: 80, accuracyMeters: 100 },
  participants: [],
};

describe("dog registration validation", () => {
  it("accepts unknown values and valid coordinates", () => {
    expect(dogRegistrationSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("rejects invalid coordinates", () => {
    const result = dogRegistrationSchema.safeParse({
      ...validRegistration,
      coordinates: { latitude: 100, longitude: 80 },
    });
    expect(result.success).toBe(false);
  });
});

describe("event validation", () => {
  it("prevents a browser payload from claiming a professional diagnosis", () => {
    const result = eventCreationSchema.safeParse({
      dogId: "00000000-0000-4000-8000-000000000001",
      eventType: "HEALTH_OBSERVATION",
      title: "Visible wound",
      occurredAt: "2026-11-06T08:30:00+05:30",
      details: {
        observedSigns: ["visible_wound"],
        professionalDiagnosis: true,
      },
    });
    expect(result.success).toBe(false);
  });

  it.each([
    ["FEEDING", { foodType: "Rice", waterProvided: true }],
    ["SIGHTING", { observedCondition: "Alert" }],
    ["VETERINARY_VISIT", { providerName: "Community clinic" }],
    ["VACCINATION", { vaccineName: "Rabies" }],
    ["STERILISATION", { procedureStatus: "COMPLETED" }],
    ["RESCUE", { outcome: "Moved to safety" }],
    ["GENERAL_UPDATE", { category: "Behaviour" }],
  ])("accepts valid %s details", (eventType, details) => {
    expect(eventCreationSchema.safeParse({
      dogId: "00000000-0000-4000-8000-000000000001",
      eventType,
      title: "Care update",
      occurredAt: "2026-11-06T08:30:00+05:30",
      details,
      participants: [],
    }).success).toBe(true);
  });

  it("rejects future event times", () => {
    expect(eventCreationSchema.safeParse({
      dogId: "00000000-0000-4000-8000-000000000001",
      eventType: "SIGHTING",
      title: "Future sighting",
      occurredAt: "2099-01-01T00:00:00+00:00",
      details: {},
    }).success).toBe(false);
  });

  it("requires a reason for moderator corrections", () => {
    expect(eventCorrectionSchema.safeParse({
      eventId: "00000000-0000-4000-8000-000000000002",
      reason: "",
      title: "Corrected event",
      occurredAt: "2026-11-06T08:30:00+05:30",
      visibility: "PUBLIC",
      verificationStatus: "VERIFIED",
    }).success).toBe(false);
  });

  it("validates authenticated event reports", () => {
    expect(eventReportSchema.safeParse({
      dogId: "00000000-0000-4000-8000-000000000001",
      eventId: "00000000-0000-4000-8000-000000000002",
      reason: "Incorrect date",
    }).success).toBe(true);
  });
});
