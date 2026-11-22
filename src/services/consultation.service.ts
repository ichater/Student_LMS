import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiErrorCode, type ApiErrorCode as ApiErrorCodeType } from "@/lib/http/responses";
import { ConsultationRepository } from "@/repositories/consultation.repository";
import { canPerformAction, canTransition } from "@/services/consultation.transitions";
import type { ConsultationAction } from "@/services/consultation.transitions";

export class ConsultationStateError extends Error {
  constructor(
    public readonly code: ApiErrorCodeType,
    message: string,
  ) {
    super(message);
  }
}

export class ConsultationService {
  private readonly repository: ConsultationRepository;

  constructor(supabase: SupabaseClient) {
    this.repository = new ConsultationRepository(supabase);
  }

  listForUser(userId: string) {
    return this.repository.listForUser(userId);
  }

  listAll() {
    return this.repository.listAll();
  }

  findById(userId: string, consultationId: string) {
    return this.repository.findById(userId, consultationId);
  }

  async patch(
    userId: string,
    consultationId: string,
    patch: { scheduled_at?: string; status?: "completed" | "booked" | "cancelled" },
  ) {
    const consultation = await this.repository.findById(userId, consultationId);
    if (!consultation) return null;

    if (patch.scheduled_at) {
      if (!canPerformAction(consultation.status, "reschedule")) {
        throw new ConsultationStateError(ApiErrorCode.RESCHEDULE_NOT_ALLOWED, "This consultation cannot be rescheduled");
      }
      return this.repository.update(userId, consultationId, { scheduled_at: patch.scheduled_at });
    }

    if (patch.status) {
      const action: ConsultationAction =
        patch.status === "completed"
          ? "complete"
          : patch.status === "cancelled"
            ? "cancel"
            : "mark_incomplete";

      if (!canPerformAction(consultation.status, action) || !canTransition(consultation.status, patch.status)) {
        throw new ConsultationStateError(ApiErrorCode.INVALID_STATUS_TRANSITION, "This status change is not allowed");
      }
      return this.repository.update(userId, consultationId, { status: patch.status });
    }

    throw new ConsultationStateError(ApiErrorCode.VALIDATION_ERROR, "A supported field must be provided");
  }

  create(
    userId: string,
    input: {
      first_name: string;
      last_name: string;
      reason: string;
      scheduled_at: string;
    },
  ) {
    return this.repository.create(userId, input);
  }
}
