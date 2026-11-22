import type { ConsultationStatus } from "@/types/consultation";

export type ConsultationAction = "reschedule" | "complete" | "mark_incomplete" | "cancel";

const allowedTransitions: Record<ConsultationStatus, ConsultationStatus[]> = {
  booked: ["completed", "cancelled"],
  completed: ["booked"],
  cancelled: [],
};

export function canTransition(from: ConsultationStatus, to: ConsultationStatus): boolean {
  return allowedTransitions[from].includes(to);
}

export function canPerformAction(status: ConsultationStatus, action: ConsultationAction): boolean {
  switch (action) {
    case "reschedule":
      return status === "booked";
    case "complete":
      return status === "booked";
    case "mark_incomplete":
      return status === "completed";
    case "cancel":
      return status === "booked";
  }
}
