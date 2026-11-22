import { ZodError } from "zod";
import {
  ApiErrorCode,
  ApiSuccessCode,
  authenticationRequired,
  consultationNotFound,
  error,
  invalidFields,
  invalidJson,
  success,
} from "@/lib/http/responses";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { consultationIdSchema, patchConsultationSchema } from "@/lib/validation/consultations";
import { ConsultationService, ConsultationStateError } from "@/services/consultation.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();
  if (!user) return authenticationRequired();

  const { id } = await context.params;
  const idResult = consultationIdSchema.safeParse(id);
  if (!idResult.success) return consultationNotFound();

  const supabase = await createClient();
  const consultation = await new ConsultationService(supabase).findById(user.id, idResult.data);
  if (!consultation) return consultationNotFound();

  return success(consultation, ApiSuccessCode.OK, "Consultation fetched successfully");
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();
  if (!user) return authenticationRequired();

  const { id } = await context.params;
  const idResult = consultationIdSchema.safeParse(id);
  if (!idResult.success) return consultationNotFound();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidJson();
  }

  try {
    const patch = patchConsultationSchema.parse(body);
    if ("scheduled_at" in patch && new Date(patch.scheduled_at).getTime() <= Date.now()) {
      return error(ApiErrorCode.VALIDATION_ERROR, "Consultation time must be in the future", 422,
        [{ field: "scheduled_at", message: "Choose a future date and time" }]);
    }

    const supabase = await createClient();
    const consultation = await new ConsultationService(supabase).patch(user.id, idResult.data, patch);
    if (!consultation) return consultationNotFound();

    return success(consultation, ApiSuccessCode.UPDATED, "Consultation updated successfully");
  } catch (caught) {
    if (caught instanceof ZodError) {
      return invalidFields(
        caught.issues.map((issue) => ({ field: issue.path.join(".") || "body", message: issue.message })),
      );
    }
    if (caught instanceof ConsultationStateError) {
      return error(caught.code, caught.message, 409);
    }
    console.error("Failed to update consultation", caught);
    return error(ApiErrorCode.INTERNAL_ERROR, "The consultation could not be updated", 500);
  }
}
