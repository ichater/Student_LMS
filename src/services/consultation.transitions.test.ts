import { describe, expect, it } from "vitest";
import { canPerformAction, canTransition } from "./consultation.transitions";

describe("consultation state transitions", () => {
  it("allows booked consultations to be completed or cancelled", () => {
    expect(canTransition("booked", "completed")).toBe(true);
    expect(canTransition("booked", "cancelled")).toBe(true);
  });

  it("allows completed consultations to return to booked", () => {
    expect(canTransition("completed", "booked")).toBe(true);
  });

  it("keeps cancelled consultations terminal", () => {
    expect(canTransition("cancelled", "booked")).toBe(false);
    expect(canTransition("cancelled", "completed")).toBe(false);
  });

  it("initially prevents rescheduling and cancelling completed consultations", () => {
    expect(canPerformAction("completed", "reschedule")).toBe(false);
    expect(canPerformAction("completed", "cancel")).toBe(false);
  });
});
