import { describe, expect, it } from "vitest";
import { dogRegistrationSchema } from "@/lib/validation/dog-registration";
import { eventCreationSchema } from "@/lib/validation/event";

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
});
