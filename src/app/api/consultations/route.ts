import { ZodError } from "zod";
import { createConsultationSchema } from "@/lib/validation/consultations";
import {
  authenticationRequired,
  ApiErrorCode,
  ApiSuccessCode,
  error,
  invalidFields,
  invalidJson,
  success,
} from "@/lib/http/responses";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ConsultationService } from "@/services/consultation.service";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return authenticationRequired();

  const supabase = await createClient();
  const service = new ConsultationService(supabase);
  const consultations = await service.listForUser(user.id);

  return success(consultations, ApiSuccessCode.OK, "Consultations fetched successfully");
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return authenticationRequired();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidJson();
  }

  try {
    const input = createConsultationSchema.parse(body);
    if (new Date(input.scheduled_at).getTime() <= Date.now()) {
      return error(ApiErrorCode.VALIDATION_ERROR, "Consultation time must be in the future", 422, [
        { field: "scheduled_at", message: "Choose a future date and time" },
      ]);
    }

    const supabase = await createClient();
    const service = new ConsultationService(supabase);
    const consultation = await service.create(user.id, input);

    return success(consultation, ApiSuccessCode.CREATED, "Consultation created successfully");
  } catch (caught) {
    if (caught instanceof ZodError) {
      return invalidFields(
        caught.issues.map((issue) => ({
          field: issue.path.join(".") || "body",
          message: issue.message,
        })),
      );
    }

    console.error("Failed to create consultation", caught);
    return error(ApiErrorCode.INTERNAL_ERROR, "The consultation could not be created", 500);
  }
}
